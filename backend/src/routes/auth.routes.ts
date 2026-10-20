import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../lib/config.js';
import {
  SESSION_COOKIE,
  createSessionToken,
  safeEqual,
  sessionCookieOptions,
  verifySessionToken,
} from '../lib/auth.js';

const router = Router();

// 5 tentativas erradas a cada 15 minutos por IP. Login certo não conta.
const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Muitas tentativas. Tente de novo em 15 minutos.' },
});

router.post('/login', loginLimiter, (req: Request, res: Response) => {
  const user = String(req.body?.user ?? config.adminUser);
  const password = String(req.body?.password ?? '');

  // Avalia as duas comparações sempre, para não revelar pelo tempo qual das duas falhou
  const okUser = safeEqual(user, config.adminUser);
  const okPass = safeEqual(password, config.adminPassword);
  if (!(okUser && okPass)) {
    res.status(401).json({ success: false, error: 'Usuário ou senha incorretos.' });
    return;
  }

  res.cookie(SESSION_COOKIE, createSessionToken(config.adminUser), sessionCookieOptions());
  res.json({ success: true, user: config.adminUser });
});

router.post('/logout', (req: Request, res: Response) => {
  const { maxAge, ...opts } = sessionCookieOptions();
  res.clearCookie(SESSION_COOKIE, opts);
  res.json({ success: true });
});

router.get('/me', (req: Request, res: Response) => {
  const session = verifySessionToken(req.cookies?.[SESSION_COOKIE]);
  if (!session) {
    res.status(401).json({ success: false });
    return;
  }
  res.json({ success: true, user: session.sub });
});

export default router;
