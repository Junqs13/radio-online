import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { getIcecastSource, splitTitle } from '../lib/icecast.js';
import { currentSlot } from '../services/Schedule.js';

const router = Router();

// GET: faixa que está tocando agora (Icecast) e o programa no ar (grade)
router.get('/now-playing', async (req: Request, res: Response): Promise<void> => {
  const slot = await currentSlot().catch(() => null);
  const program = slot
    ? { id: slot.program.id, title: slot.program.title, host: slot.program.host, startTime: slot.startTime, endTime: slot.endTime }
    : null;
  try {
    const source = await getIcecastSource();
    if (!source) {
      res.status(200).json({ success: false, online: false, title: 'Rádio fora do ar', artist: '', listeners: 0, program });
      return;
    }

    const { title, artist } = splitTitle(source);
    res.status(200).json({
      success: true,
      online: true,
      title: title || 'Transmissão ao vivo',
      artist: artist || '',
      listeners: source.listeners ?? 0,
      genre: source.genre || '',
      serverName: source.server_name || '',
      program,
    });
  } catch {
    res.status(200).json({ success: false, online: false, title: 'Conectando à antena...', artist: '', listeners: 0, program });
  }
});

// GET: últimas faixas tocadas (sem vinhetas)
router.get('/history', async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
  try {
    const rows = await prisma.playHistory.findMany({
      where: { source: { not: 'jingle' } },
      orderBy: { playedAt: 'desc' },
      take: limit,
    });
    res.json({
      success: true,
      history: rows.map((r) => ({ title: r.title, artist: r.artist, playedAt: r.playedAt, request: r.source === 'request' })),
    });
  } catch (err) {
    console.error('Erro ao buscar histórico:', err);
    res.status(500).json({ success: false, error: 'Erro ao buscar o histórico.' });
  }
});

export default router;
