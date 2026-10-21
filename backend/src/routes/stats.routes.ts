import express, { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAdmin } from '../lib/auth.js';
import { collect, summary } from '../services/Stats.js';

const router = Router();

// O navegador manda como texto (sendBeacon), assim não precisa de pré-checagem de CORS
const body = express.text({ type: ['text/plain', 'application/json'], limit: '32kb' });

router.post(
  '/collect',
  rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }),
  body,
  async (req: Request, res: Response) => {
    try {
      const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body;
      await collect(data ?? {}, req.ip, req.get('user-agent'));
    } catch {
      /* pacote inválido: ignora em silêncio */
    }
    res.status(204).end();
  },
);

router.get('/summary', requireAdmin, async (req: Request, res: Response) => {
  const days = [1, 7, 30, 90, 365].includes(Number(req.query.days)) ? Number(req.query.days) : 7;
  try {
    res.json({ success: true, ...(await summary(days)) });
  } catch (err) {
    console.error('[estatísticas] erro no resumo:', err);
    res.status(500).json({ success: false, error: 'Erro ao montar as estatísticas.' });
  }
});

export default router;
