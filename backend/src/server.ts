import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config, assertSecurityConfig } from './lib/config.js';
import authRoutes from './routes/auth.routes.js';
import mediaRoutes from './routes/media.routes.js';
import streamRoutes from './routes/stream.routes.js';
import requestRoutes from './routes/requests.routes.js';
import scheduleRoutes from './routes/schedule.routes.js';
import autodjRoutes from './routes/autodj.routes.js';
import { RadioScheduler } from './services/RadioScheduler.js';
import { HealthController } from './controllers/health.controller.js';
import { prisma } from './lib/prisma.js';

assertSecurityConfig();

const app = express();
app.disable('x-powered-by');
if (config.trustProxy) app.set('trust proxy', config.trustProxy);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(
  cors({
    // Só os sites listados em CORS_ORIGINS podem chamar a API pelo navegador, e com cookie
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
  }),
);
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

// Teto geral por IP, contra robôs martelando a API
app.use(
  '/api',
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skip: (req) => req.path.startsWith('/autodj/'),
  }),
);

app.get('/api/health', HealthController.checkSystem);
app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/autodj', autodjRoutes);

app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada.' });
});

// Erro não tratado: registra no log e não devolve detalhes internos ao navegador
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[api] erro não tratado:', err);
  res.status(500).json({ success: false, error: 'Erro interno.' });
});

const server = app.listen(config.port, () => {
  console.log(`API da rádio rodando na porta ${config.port} (mídia em ${config.mediaDir})`);
  RadioScheduler.init();
});

// Encerramento limpo quando o Docker para o container
const shutdown = () => {
  server.close(() => prisma.$disconnect().finally(() => process.exit(0)));
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
