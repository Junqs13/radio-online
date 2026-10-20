// URLs usadas pelo navegador do ouvinte. São gravadas no momento do build:
// em Docker vêm dos build args do docker-compose (PUBLIC_API_URL / PUBLIC_STREAM_URL no .env);
// em "npm run dev" vêm do frontend/.env.local.
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
export const STREAM_URL = process.env.NEXT_PUBLIC_STREAM_URL || 'http://localhost:8000/live.mp3';

export const UNAUTHORIZED_EVENT = 'radio:admin-unauthorized';

/**
 * fetch do painel: manda o cookie de sessão junto e, se a API responder 401
 * (sessão expirou ou foi encerrada), avisa o AdminAuth para mostrar o login de novo.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const res = await fetch(input, { ...init, credentials: 'include' });
  if (res.status === 401 && typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
  }
  return res;
}
