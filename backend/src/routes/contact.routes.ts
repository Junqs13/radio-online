import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth.js';

const router = Router();

// Cada visitante pode mandar até 3 mensagens por hora
const contactLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 3,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, error: 'Você já mandou algumas mensagens agora. Tente de novo mais tarde.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v: unknown, max: number) => String(v ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const parseId = (v: unknown) => {
  const n = Number.parseInt(String(v), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// POST: mensagem nova vinda do site
router.post('/', contactLimiter, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  // Campo escondido do formulário: gente não preenche, robô costuma preencher
  if (b.website) {
    res.status(201).json({ success: true });
    return;
  }
  const name = clean(b.name, 120);
  const email = clean(b.email, 200).toLowerCase();
  const subject = clean(b.subject, 150) || null;
  const message = String(b.message ?? '').trim().slice(0, 4000);

  if (name.length < 2 || !EMAIL_RE.test(email) || message.length < 5) {
    res.status(400).json({ success: false, error: 'Preencha nome, um e-mail válido e a mensagem.' });
    return;
  }
  try {
    await prisma.contactMessage.create({ data: { name, email, subject, message } });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Erro ao salvar mensagem de contato:', err);
    res.status(500).json({ success: false, error: 'Não deu para enviar agora. Tente de novo.' });
  }
});

// GET: mensagens recebidas (painel)
router.get('/', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
    res.json({ success: true, messages, unread: messages.filter((m) => !m.read).length });
  } catch (err) {
    console.error('Erro ao listar mensagens:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar mensagens.' });
  }
});

// PATCH: marcar como lida ou não lida
router.patch('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: 'ID inválido.' });
    return;
  }
  const { count } = await prisma.contactMessage.updateMany({ where: { id }, data: { read: Boolean(req.body?.read) } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

// DELETE: apagar mensagem
router.delete('/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: 'ID inválido.' });
    return;
  }
  const { count } = await prisma.contactMessage.deleteMany({ where: { id } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

export default router;
