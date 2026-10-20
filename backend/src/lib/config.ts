import 'dotenv/config';
import path from 'path';

const list = (v: string | undefined, fallback: string[]) =>
  v ? v.split(',').map((s) => s.trim()).filter(Boolean) : fallback;

// Toda configuração do backend sai daqui. Em Docker os valores vêm do docker-compose.yml;
// rodando com "npm run dev" fora do Docker, vêm do backend/.env.
export const config = {
  port: Number(process.env.PORT || 3001),
  // Pasta compartilhada com o Liquidsoap. Fora do Docker, aponta para ../storage (raiz do projeto).
  mediaDir: path.resolve(process.env.MEDIA_DIR || '../storage'),
  icecastUrl: (process.env.ICECAST_URL || 'http://icecast:8000').replace(/\/$/, ''),
  icecastMount: process.env.ICECAST_MOUNT || '/live.mp3',
  maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 100),
  // Caminho da mesma pasta de mídia visto de dentro do container do Liquidsoap
  liquidsoapMediaDir: (process.env.LIQUIDSOAP_MEDIA_DIR || '/storage').replace(/\/$/, ''),

  // --- Auto-DJ ---
  timezone: process.env.RADIO_TIMEZONE || 'America/Sao_Paulo', // fuso usado na grade
  autodjToken: process.env.AUTODJ_TOKEN || '', // senha que o Liquidsoap usa para falar com a API
  jingleEveryMin: Number(process.env.JINGLE_EVERY_MIN || 30),
  maxQueuedRequests: Number(process.env.MAX_QUEUED_REQUESTS || 5),
  requestCooldownMin: Number(process.env.REQUEST_COOLDOWN_MIN || 60), // música pedida não repete antes disso

  // --- Segurança ---
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  sessionHours: Number(process.env.SESSION_HOURS || 12),
  // Sites que podem chamar a API pelo navegador (separados por vírgula)
  corsOrigins: list(process.env.CORS_ORIGINS, ['http://localhost:3000']),
  // true em produção (HTTPS): o cookie de sessão só trafega criptografado
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  // Quantos proxies ficam na frente da API (Caddy/Nginx = 1). Necessário para o limite por IP funcionar.
  trustProxy: Number(process.env.TRUST_PROXY || 0),
};

/** Interrompe a inicialização se faltar algo que deixaria o painel aberto ou previsível. */
export function assertSecurityConfig() {
  const problems: string[] = [];
  if (config.adminPassword.length < 10) problems.push('ADMIN_PASSWORD precisa ter pelo menos 10 caracteres');
  if (config.sessionSecret.length < 32) problems.push('SESSION_SECRET precisa ter pelo menos 32 caracteres');
  if (config.autodjToken.length < 16) problems.push('AUTODJ_TOKEN precisa ter pelo menos 16 caracteres');
  if (problems.length) {
    console.error('\n[segurança] A API não vai subir:\n  - ' + problems.join('\n  - ') + '\nConfigure no .env (veja .env.example).\n');
    process.exit(1);
  }
}

export const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.flac', '.wav', '.m4a', '.aac'];
