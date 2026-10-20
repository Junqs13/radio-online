import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../lib/config.js';
import { safeEqual } from '../lib/auth.js';
import { pickNext, recordPlayed, toLiquidsoapUri } from '../services/AutoDJ.js';

// Rotas usadas só pelo Liquidsoap. Protegidas por um token próprio (AUTODJ_TOKEN).
const router = Router();

function requireAutodj(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !safeEqual(token, config.autodjToken)) {
    res.status(401).type('text/plain').send('');
    return;
  }
  next();
}
router.use(requireAutodj);

// GET: próxima faixa, em texto puro (o Liquidsoap lê a resposta como um endereço)
router.get('/next', async (req: Request, res: Response) => {
  try {
    const next = await pickNext();
    if (!next) {
      res.status(204).send(); // nada para tocar: o Liquidsoap usa a playlist de reserva
      return;
    }
    console.log(`[Auto-DJ] próxima: ${next.media.artist ?? '?'} - ${next.media.title} (${next.source})`);
    res.type('text/plain').send(toLiquidsoapUri(next));
  } catch (err) {
    console.error('[Auto-DJ] erro ao escolher a próxima faixa:', err);
    res.status(500).type('text/plain').send('');
  }
});

// POST: a faixa começou a tocar
router.post('/played', async (req: Request, res: Response) => {
  const n = (v: unknown) => (v === undefined || v === '' ? undefined : Number(v));
  const b = req.body ?? {};
  try {
    await recordPlayed({
      mediaId: n(b.media_id),
      requestId: n(b.request_id),
      programId: n(b.program_id),
      source: b.source ? String(b.source) : undefined,
      title: b.title ? String(b.title).slice(0, 300) : undefined,
      artist: b.artist ? String(b.artist).slice(0, 300) : undefined,
    });
    res.json({ success: true });
  } catch (err) {
    console.error('[Auto-DJ] erro ao registrar faixa tocada:', err);
    res.status(500).json({ success: false });
  }
});

export default router;
