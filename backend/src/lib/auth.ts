import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { config } from './config.js';

export const SESSION_COOKIE = 'radio_session';

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString('base64url');
const hmac = (data: string) => crypto.createHmac('sha256', config.sessionSecret).update(data).digest();

/** Compara duas strings em tempo constante (não vaza, pelo tempo de resposta, quantos caracteres acertou). */
export function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

/** Token assinado com HMAC-SHA256: "<dados em base64url>.<assinatura>". */
export function createSessionToken(user: string) {
  const payload = b64(JSON.stringify({ sub: user, exp: Date.now() + config.sessionHours * 3600_000 }));
  return `${payload}.${b64(hmac(payload))}`;
}

export function verifySessionToken(token: string | undefined): { sub: string } | null {
  if (!token) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = hmac(payload);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return { sub: String(data.sub) };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = () => ({
  httpOnly: true, // JavaScript da página não consegue ler o cookie
  secure: config.cookieSecure,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: config.sessionHours * 3600_000,
});

/** Bloqueia a rota para quem não está logado no painel. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = verifySessionToken(req.cookies?.[SESSION_COOKIE]);
  if (!session) {
    res.status(401).json({ success: false, error: 'Faça login no painel.' });
    return;
  }
  res.locals.admin = session.sub;
  next();
}
