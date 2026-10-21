import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth.js';
import { config } from '../lib/config.js';
import { currentSlot, findGaps, overlaps, DAYS } from '../services/Schedule.js';

const router = Router();

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const TRANSITIONS = ['crossfade', 'fade-in', 'hard-cut'];
const parseId = (v: unknown) => {
  const n = Number.parseInt(String(v), 10);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// GET: grade completa e horários sem programa (nesses horários toca a rotação geral)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.programSlot.findMany({
      include: { program: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Mesmo formato que o painel já usa (campos do programa achatados no slot)
    const slots = rows.map(({ program, ...slot }) => ({
      ...slot,
      program_title: program.title,
      host: program.host,
      category: program.category,
      color: program.color,
      mediaFolder: program.mediaFolder,
    }));

    res.status(200).json({
      success: true,
      slots,
      gaps: findGaps(rows),
      timezone: config.timezone,
      transitionsConfig: { defaultCrossfadeSecs: 5, autoJingleIntervalMinutes: config.jingleEveryMin },
    });
  } catch (err) {
    console.error('Erro ao buscar grade de programação:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao processar a grade.' });
  }
});

// GET: programa no ar agora
router.get('/now', async (req: Request, res: Response): Promise<void> => {
  try {
    const slot = await currentSlot();
    res.json({
      success: true,
      program: slot ? { ...slot.program, startTime: slot.startTime, endTime: slot.endTime } : null,
    });
  } catch (err) {
    console.error('Erro ao buscar programa no ar:', err);
    res.status(500).json({ success: false });
  }
});

// POST: aloca um programa num horário da grade (recusa se bater com outro bloco)
router.post('/slots', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const { programId, dayOfWeek, startTime, endTime, transitionType, jingleEnabled } = req.body ?? {};
  const pid = parseId(programId);
  const day = Number(dayOfWeek);

  if (!pid || !Number.isInteger(day) || day < 0 || day > 6) {
    res.status(400).json({ success: false, error: 'Programa ou dia da semana inválido.' });
    return;
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime) || startTime === endTime) {
    res.status(400).json({ success: false, error: 'Horários devem estar no formato HH:MM e ser diferentes.' });
    return;
  }
  const candidate = { dayOfWeek: day, startTime, endTime };

  try {
    if (!(await prisma.program.findUnique({ where: { id: pid } }))) {
      res.status(404).json({ success: false, error: 'Programa não encontrado.' });
      return;
    }
    const existing = await prisma.programSlot.findMany({ include: { program: true } });
    const clash = existing.find((s) => overlaps(s, candidate));
    if (clash) {
      res.status(409).json({
        success: false,
        error: `Conflita com "${clash.program.title}" (${DAYS[clash.dayOfWeek]} ${clash.startTime} - ${clash.endTime}).`,
      });
      return;
    }

    const slot = await prisma.programSlot.create({
      data: {
        programId: pid,
        ...candidate,
        transitionType: TRANSITIONS.includes(transitionType) ? transitionType : 'crossfade',
        jingleEnabled: jingleEnabled ?? true,
      },
    });
    res.status(201).json({ success: true, slot });
  } catch (err) {
    console.error('Erro ao criar slot de programação:', err);
    res.status(500).json({ success: false, error: 'Erro ao alocar horário.' });
  }
});

// DELETE: remove um bloco da grade
router.delete('/slots/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: 'ID inválido.' });
    return;
  }
  const { count } = await prisma.programSlot.deleteMany({ where: { id } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

// POST: troca o conteúdo de dois blocos (quadro arrastável do painel).
// Os horários ficam onde estão; o que muda de lugar é o programa, com a transição e as vinhetas dele.
router.post('/slots/swap', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const a = parseId(req.body?.a);
  const b = parseId(req.body?.b);
  if (!a || !b || a === b) {
    res.status(400).json({ success: false, error: 'Informe dois blocos diferentes.' });
    return;
  }
  try {
    const [sa, sb] = await Promise.all([
      prisma.programSlot.findUnique({ where: { id: a } }),
      prisma.programSlot.findUnique({ where: { id: b } }),
    ]);
    if (!sa || !sb) {
      res.status(404).json({ success: false, error: 'Bloco não encontrado.' });
      return;
    }
    const content = (s: typeof sa) => ({ programId: s.programId, transitionType: s.transitionType, jingleEnabled: s.jingleEnabled });
    await prisma.$transaction([
      prisma.programSlot.update({ where: { id: a }, data: content(sb) }),
      prisma.programSlot.update({ where: { id: b }, data: content(sa) }),
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao trocar blocos:', err);
    res.status(500).json({ success: false, error: 'Erro ao trocar os blocos.' });
  }
});

// PATCH: põe outro programa num bloco, mantendo o horário
router.patch('/slots/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const programId = parseId(req.body?.programId);
  if (!id || !programId) {
    res.status(400).json({ success: false, error: 'Bloco ou programa inválido.' });
    return;
  }
  try {
    if (!(await prisma.program.findUnique({ where: { id: programId } }))) {
      res.status(404).json({ success: false, error: 'Programa não encontrado.' });
      return;
    }
    const { count } = await prisma.programSlot.updateMany({ where: { id }, data: { programId } });
    res.status(count ? 200 : 404).json({ success: count > 0 });
  } catch (err) {
    console.error('Erro ao trocar programa do bloco:', err);
    res.status(500).json({ success: false, error: 'Erro ao trocar o programa.' });
  }
});

// GET: programas cadastrados
router.get('/programs', async (req: Request, res: Response): Promise<void> => {
  try {
    const programs = await prisma.program.findMany({
      orderBy: { title: 'asc' },
      include: { _count: { select: { slots: true } } },
    });
    res.status(200).json({ success: true, programs });
  } catch (err) {
    console.error('Erro ao listar programas:', err);
    res.status(500).json({ success: false, error: 'Erro ao listar programas.' });
  }
});

const programData = (b: any) => ({
  title: String(b.title).slice(0, 120),
  host: String(b.host).slice(0, 120),
  category: String(b.category).slice(0, 120),
  description: b.description ? String(b.description).slice(0, 1000) : '',
  color: /^#[0-9a-fA-F]{6}$/.test(b.color) ? b.color : '#dc2626',
  // Várias pastas separadas por "|"
  mediaFolder:
    String(b.mediaFolder ?? '')
      .split('|')
      .map((f: string) => f.trim().slice(0, 120))
      .filter(Boolean)
      .slice(0, 20)
      .join('|') || null,
});

// POST: novo programa
router.post('/programs', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const b = req.body ?? {};
  if (!b.title || !b.host || !b.category) {
    res.status(400).json({ success: false, error: 'Título, apresentador e categoria são obrigatórios.' });
    return;
  }
  try {
    const program = await prisma.program.create({ data: programData(b) });
    res.status(201).json({ success: true, program });
  } catch (err) {
    console.error('Erro ao criar programa:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao criar o programa.' });
  }
});

// PUT: edita um programa
router.put('/programs/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  const b = req.body ?? {};
  if (!id || !b.title || !b.host || !b.category) {
    res.status(400).json({ success: false, error: 'Título, apresentador e categoria são obrigatórios.' });
    return;
  }
  try {
    const { count } = await prisma.program.updateMany({ where: { id }, data: programData(b) });
    res.status(count ? 200 : 404).json({ success: count > 0 });
  } catch (err) {
    console.error('Erro ao editar programa:', err);
    res.status(500).json({ success: false, error: 'Erro interno ao editar o programa.' });
  }
});

// DELETE: remove um programa e os blocos dele na grade
router.delete('/programs/:id', requireAdmin, async (req: Request, res: Response): Promise<void> => {
  const id = parseId(req.params.id);
  if (!id) {
    res.status(400).json({ success: false, error: 'ID inválido.' });
    return;
  }
  const { count } = await prisma.program.deleteMany({ where: { id } });
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

export default router;
