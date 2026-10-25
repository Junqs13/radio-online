import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth.js';
import { searchMedia, tryQueue, randomPick } from '../services/Requests.js';

const router = Router();

// Cada ouvinte pode mandar até 5 pedidos a cada 10 minutos
const requestLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Você já mandou vários pedidos. Tente de novo daqui a pouco.' },
});

type Row = Awaited<ReturnType<typeof prisma.songRequest.findMany<{ include: { mediaItem: true } }>>>[number];

// O painel espera os campos em snake_case (formato antigo da tabela)
const toDto = (r: Row) => ({
  id: r.id,
  track_title: r.trackTitle,
  listener_name: r.listenerName,
  status: r.status,
  created_at: r.createdAt,
  queued_at: r.queuedAt,
  played_at: r.playedAt,
  media: r.mediaItem ? { id: r.mediaItem.id, title: r.mediaItem.title, artist: r.mediaItem.artist } : null,
});

const parseId = (v: unknown) => {
  const n = Number.parseInt(String(v), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// POST: novo pedido. Se o ouvinte escolheu uma música do acervo (ou o texto bate com
// exatamente uma), ela entra direto na fila; senão fica aguardando o locutor.
router.post('/', requestLimiter, async (req: Request, res: Response): Promise<void> => {
  const trackTitle = String(req.body?.trackTitle ?? '').trim().slice(0, 200);
  const listenerName = String(req.body?.listenerName ?? '').trim().slice(0, 80);
  let mediaItemId = parseId(req.body?.mediaItemId);

  if (!trackTitle && !mediaItemId) {
    res.status(400).json({ success: false, error: 'Informe a música ou o artista.' });
    return;
  }

  try {
    if (!mediaItemId && trackTitle) {
      const matches = await searchMedia(trackTitle, 2);
      if (matches.length === 1) mediaItemId = matches[0].id;
    }
    const media = mediaItemId ? await prisma.mediaItem.findUnique({ where: { id: mediaItemId } }) : null;

    // Música que já está na fila: não cria outro pedido, só avisa
    if (media && (await prisma.songRequest.count({ where: { mediaItemId: media.id, status: { in: ['queued', 'sent'] } } }))) {
      res.status(200).json({ success: true, queued: true, message: 'Essa música já está na fila e vai tocar em breve.' });
      return;
    }

    const created = await prisma.songRequest.create({
      data: {
        trackTitle: trackTitle || `${media?.artist ?? ''} - ${media?.title ?? ''}`.trim(),
        listenerName: listenerName || 'Ouvinte anônimo',
        mediaItemId: media?.id ?? null,
      },
    });

    let message = 'Pedido enviado para o locutor.';
    let queued = false;
    if (media) {
      const r = await tryQueue(created.id, media.id);
      if (r.queued) {
        queued = true;
        message = `Pedido aceito! Posição ${r.position} na fila.`;
      } else if (r.reason.startsWith('Essa música já está na fila')) {
        message = 'Essa música já está na fila e vai tocar em breve.';
      } else {
        message = `${r.reason} Seu pedido ficou com o locutor.`;
      }
    } else {
      message = 'Não achamos essa música no acervo. O locutor vai ver seu pedido.';
    }
    res.status(201).json({ success: true, queued, message });
  } catch (err) {
    console.error('Erro ao registrar pedido de música:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao processar o pedido.' });
  }
});

// GET: busca no acervo para o campo de pedidos (público)
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q ?? '').slice(0, 100);
  try {
    res.json({ success: true, results: await searchMedia(q) });
  } catch (err) {
    console.error('Erro na busca:', err);
    res.status(500).json({ success: false, error: 'Erro na busca.' });
  }
});

// GET: sugestão sorteada para os cartões do pedido (?folders=Iron Maiden|Megadeth)
router.get('/random', async (req: Request, res: Response): Promise<void> => {
  const folders = String(req.query.folders ?? '')
    .split('|')
    .map((f) => f.trim())
    .filter(Boolean)
    .slice(0, 12);
  try {
    const pick = await randomPick(folders);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, result: pick });
  } catch (err) {
    console.error('Erro ao sortear sugestão:', err);
    res.status(500).json({ success: false, error: 'Erro ao sortear.' });
  }
});

// GET: fila pública (só o que vai tocar, sem nome de ouvinte)
router.get('/queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.songRequest.findMany({
      where: { status: 'queued' },
      orderBy: { queuedAt: 'asc' },
      include: { mediaItem: { select: { title: true, artist: true } } },
    });
    res.json({ success: true, queue: rows.map((r) => ({ title: r.mediaItem?.title, artist: r.mediaItem?.artist })) });
  } catch (err) {
    console.error('Erro ao buscar fila:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar a fila.' });
  }
});

// GET: últimos pedidos para o painel
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.songRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { mediaItem: true },
    });
    res.status(200).json({ success: true, requests: rows.map(toDto) });
  } catch (err) {
    console.error('Erro ao buscar pedidos:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao buscar pedidos.' });
  }
});

// POST: locutor coloca o pedido na fila escolhendo a música do acervo
router.post('/:id/queue', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const mediaItemId = parseId(req.body?.mediaItemId);
  if (!id || !mediaItemId) {
    res.status(400).json({ success: false, error: 'Pedido ou música inválidos.' });
    return;
  }
  try {
    const exists = await prisma.songRequest.findUnique({ where: { id } });
    if (!exists) {
      res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
      return;
    }
    const r = await tryQueue(id, mediaItemId);
    if (!r.queued) {
      res.status(409).json({ success: false, error: r.reason });
      return;
    }
    res.json({ success: true, position: r.position });
  } catch (err) {
    console.error('Erro ao enfileirar pedido:', err);
    res.status(500).json({ success: false, error: 'Erro interno.' });
  }
});

// POST: recusar pedido
router.post('/:id/reject', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: 'ID inválido.' });
    return;
  }
  const { count } = await prisma.songRequest.updateMany({ where: { id }, data: { status: 'rejected' } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

// DELETE: remove um pedido
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: 'ID inválido.' });
    return;
  }
  try {
    const { count } = await prisma.songRequest.deleteMany({ where: { id } });
    if (count === 0) {
      res.status(404).json({ success: false, error: 'Pedido não encontrado.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Pedido removido.' });
  } catch (err) {
    console.error('Erro ao apagar pedido:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao apagar pedido.' });
  }
});

export default router;
