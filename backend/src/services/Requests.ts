import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';

export const normalize = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Busca no acervo por artista e título. Todas as palavras digitadas precisam aparecer. */
export async function searchMedia(q: string, limit = 8) {
  const words = normalize(q).split(' ').filter((w) => w.length > 1);
  if (words.length === 0) return [];
  const all = await prisma.mediaItem.findMany({
    where: { type: 'music', enabled: true },
    select: { id: true, title: true, artist: true, category: true, duration: true },
  });
  return all
    .map((m) => ({ m, text: normalize(`${m.artist ?? ''} ${m.title}`) }))
    .filter(({ text }) => words.every((w) => text.includes(w)))
    .sort((a, b) => a.text.length - b.text.length)
    .slice(0, limit)
    .map(({ m }) => m);
}

/**
 * Sorteia uma música do acervo para as sugestões prontas do pedido.
 * Só entra o que pode ser pedido agora: ativa, fora da fila e sem ter tocado há pouco.
 * folders = subpastas do acervo (ex: ["Iron Maiden", "Megadeth"]). Vazio = acervo inteiro.
 */
export async function randomPick(folders: string[] = []) {
  const cooldown = new Date(Date.now() - config.requestCooldownMin * 60_000);
  const base = {
    type: 'music',
    enabled: true,
    OR: [{ lastPlayedAt: null }, { lastPlayedAt: { lt: cooldown } }],
    requests: { none: { status: { in: ['queued', 'sent'] } } },
  };
  const select = { id: true, title: true, artist: true };
  let pool = folders.length
    ? await prisma.mediaItem.findMany({ where: { ...base, category: { in: folders } }, select })
    : [];
  if (pool.length === 0) pool = await prisma.mediaItem.findMany({ where: base, select });
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
}

export type QueueResult =
  | { queued: true; position: number }
  | { queued: false; reason: string };

/** Tenta colocar uma música do acervo na fila de pedidos, com as regras anti-abuso. */
export async function tryQueue(requestId: number, mediaItemId: number): Promise<QueueResult> {
  const media = await prisma.mediaItem.findUnique({ where: { id: mediaItemId } });
  if (!media || !media.enabled || media.type !== 'music') return { queued: false, reason: 'Música não encontrada no acervo.' };

  const already = await prisma.songRequest.findFirst({
    where: { mediaItemId, status: { in: ['queued', 'sent'] }, id: { not: requestId } },
  });
  if (already) return { queued: false, reason: 'Essa música já está na fila.' };

  const cooldown = new Date(Date.now() - config.requestCooldownMin * 60_000);
  if (media.lastPlayedAt && media.lastPlayedAt > cooldown) {
    return { queued: false, reason: `Essa música tocou há pouco. Peça de novo daqui a ${config.requestCooldownMin} minutos.` };
  }

  const inQueue = await prisma.songRequest.count({ where: { status: 'queued' } });
  if (inQueue >= config.maxQueuedRequests) return { queued: false, reason: 'A fila de pedidos está cheia agora.' };

  await prisma.songRequest.update({
    where: { id: requestId },
    data: { status: 'queued', mediaItemId, queuedAt: new Date() },
  });
  return { queued: true, position: inQueue + 1 };
}
