import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';
import { requireAdmin } from '../lib/auth.js';

/**
 * Conteúdo editável do site: "Lendas & Histórias" e "Curiosidade do dia".
 * Rotas públicas para o site e rotas de admin para o painel.
 */
const router = Router();

// Imagens enviadas pelo painel ficam junto do acervo, numa pasta que o Auto-DJ ignora
export const IMAGE_DIR = path.join(config.mediaDir, '_site');
fs.mkdirSync(IMAGE_DIR, { recursive: true });
const IMAGE_EXT: Record<string, string> = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, IMAGE_DIR),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${IMAGE_EXT[file.mimetype] ?? ''}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (IMAGE_EXT[file.mimetype]) cb(null, true);
    else cb(new Error('Envie uma imagem JPG, PNG ou WEBP.'));
  },
});

// Confere a assinatura do arquivo: um .jpg que não é imagem é apagado
function looksLikeImage(file: string) {
  const b = Buffer.alloc(12);
  const fd = fs.openSync(file, 'r');
  fs.readSync(fd, b, 0, 12, 0);
  fs.closeSync(fd);
  const jpg = b[0] === 0xff && b[1] === 0xd8;
  const png = b.toString('hex', 0, 4) === '89504e47';
  const webp = b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
  return jpg || png || webp;
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const optStr = (v: unknown, max: number) => {
  const s = str(v, max);
  return s ? s : null;
};
const okImageUrl = (u: string | null) => !u || u.startsWith('/images/') || u.startsWith('/api/content/images/') || /^https:\/\//.test(u);

function legendData(b: Record<string, unknown>, partial: boolean) {
  const data: Record<string, unknown> = {};
  const set = (k: string, v: unknown) => {
    if (!partial || b[k] !== undefined) data[k] = v;
  };
  set('artist', str(b.artist, 120));
  set('title', str(b.title, 160));
  set('description', str(b.description, 1200));
  set('imageUrl', optStr(b.imageUrl, 500));
  set('gradient', str(b.gradient, 30) || 'vermelho');
  set('year', optStr(b.year, 20));
  set('origin', optStr(b.origin, 120));
  if (typeof b.enabled === 'boolean') data.enabled = b.enabled;
  return data;
}

function curiosityData(b: Record<string, unknown>, partial: boolean) {
  const data: Record<string, unknown> = {};
  if (!partial || b.text !== undefined) data.text = str(b.text, 600);
  if (!partial || b.tags !== undefined) {
    const raw = Array.isArray(b.tags) ? b.tags : typeof b.tags === 'string' ? b.tags.split(/[\s,]+/) : [];
    data.tags = raw
      .map((t) => String(t).replace(/^#/, '').replace(/[^\p{L}\p{N}_]/gu, '').slice(0, 30))
      .filter(Boolean)
      .slice(0, 6);
  }
  if (typeof b.enabled === 'boolean') data.enabled = b.enabled;
  return data;
}

const shuffle = <T>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- Público ----------

/**
 * Cards do carrossel: o mais recente abre a fila, o segundo mais recente fecha,
 * e o meio é sorteado de novo a cada acesso.
 */
router.get('/legends', async (req: Request, res: Response) => {
  const limit = Math.min(12, Math.max(2, Number(req.query.limit) || 6));
  const all = await prisma.legend.findMany({ where: { enabled: true }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  if (all.length <= 2) {
    res.json({ success: true, legends: all });
    return;
  }
  const [newest, second, ...rest] = all;
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, legends: [newest, ...shuffle(rest).slice(0, limit - 2), second] });
});

// Uma curiosidade sorteada; "exclude" evita repetir a que a pessoa acabou de ver
router.get('/curiosity', async (req: Request, res: Response) => {
  const exclude = Number(req.query.exclude) || 0;
  const ids = await prisma.curiosity.findMany({ where: { enabled: true }, select: { id: true } });
  const pool = ids.length > 1 ? ids.filter((c) => c.id !== exclude) : ids;
  if (!pool.length) {
    res.json({ success: true, curiosity: null });
    return;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, curiosity: await prisma.curiosity.findUnique({ where: { id: pick.id } }) });
});

router.get('/images/:name', (req: Request, res: Response) => {
  const name = path.basename(String(req.params.name));
  if (!/^[\w.-]+\.(jpg|png|webp)$/.test(name)) {
    res.status(404).end();
    return;
  }
  res.set('Cache-Control', 'public, max-age=604800');
  res.sendFile(path.join(IMAGE_DIR, name), (err) => {
    if (err && !res.headersSent) res.status(404).end();
  });
});

// ---------- Painel ----------

router.get('/admin/legends', requireAdmin, async (req: Request, res: Response) => {
  const legends = await prisma.legend.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  res.json({ success: true, legends });
});

router.post('/admin/legends', requireAdmin, async (req: Request, res: Response) => {
  const data = legendData(req.body ?? {}, false);
  if (!data.artist || !data.title || !data.description) {
    res.status(400).json({ success: false, error: 'Preencha banda ou artista, música e história.' });
    return;
  }
  if (!okImageUrl(data.imageUrl as string | null)) {
    res.status(400).json({ success: false, error: 'O endereço da imagem precisa começar com https://.' });
    return;
  }
  const legend = await prisma.legend.create({ data: data as never });
  res.status(201).json({ success: true, legend });
});

router.patch('/admin/legends/:id', requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const data = legendData(req.body ?? {}, true);
  if (data.imageUrl !== undefined && !okImageUrl(data.imageUrl as string | null)) {
    res.status(400).json({ success: false, error: 'O endereço da imagem precisa começar com https://.' });
    return;
  }
  // "Subir para o topo": vira o mais recente e passa a abrir o carrossel
  if (req.body?.bump === true) data.createdAt = new Date();
  const { count } = await prisma.legend.updateMany({ where: { id }, data });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

router.delete('/admin/legends/:id', requireAdmin, async (req: Request, res: Response) => {
  const { count } = await prisma.legend.deleteMany({ where: { id: Number(req.params.id) } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

router.post(
  '/admin/images',
  requireAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('image')(req, res, (err: unknown) => {
      if (!err) return next();
      const message =
        err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE' ? 'Imagem maior que 5 MB.' : err instanceof Error ? err.message : 'Erro no envio.';
      res.status(400).json({ success: false, error: message });
    });
  },
  (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: 'Nenhuma imagem enviada.' });
      return;
    }
    if (!looksLikeImage(file.path)) {
      fs.rm(file.path, { force: true }, () => {});
      res.status(400).json({ success: false, error: 'O arquivo não é uma imagem válida.' });
      return;
    }
    res.status(201).json({ success: true, url: `/api/content/images/${file.filename}` });
  },
);

router.get('/admin/curiosities', requireAdmin, async (req: Request, res: Response) => {
  const curiosities = await prisma.curiosity.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  res.json({ success: true, curiosities });
});

router.post('/admin/curiosities', requireAdmin, async (req: Request, res: Response) => {
  const data = curiosityData(req.body ?? {}, false);
  if (!data.text || String(data.text).length < 10) {
    res.status(400).json({ success: false, error: 'Escreva a curiosidade (pelo menos 10 letras).' });
    return;
  }
  const curiosity = await prisma.curiosity.create({ data: data as never });
  res.status(201).json({ success: true, curiosity });
});

router.patch('/admin/curiosities/:id', requireAdmin, async (req: Request, res: Response) => {
  const { count } = await prisma.curiosity.updateMany({ where: { id: Number(req.params.id) }, data: curiosityData(req.body ?? {}, true) });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

router.delete('/admin/curiosities/:id', requireAdmin, async (req: Request, res: Response) => {
  const { count } = await prisma.curiosity.deleteMany({ where: { id: Number(req.params.id) } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

export default router;
