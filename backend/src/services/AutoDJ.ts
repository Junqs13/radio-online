import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';
import { currentSlot } from './Schedule.js';

type Media = Prisma.MediaItemGetPayload<{}>;
export type Source = 'music' | 'request' | 'jingle';

export interface NextTrack {
  media: Media;
  source: Source;
  requestId?: number;
  programId?: number | null;
  crossfade: number; // segundos
}

// Duração da transição conforme o tipo escolhido no bloco da grade
const TRANSITION_SECONDS: Record<string, number> = { crossfade: 5, 'fade-in': 2, 'hard-cut': 0.1 };

// O Liquidsoap pede a próxima faixa antes da atual acabar. Esta memória curta guarda o que já foi
// entregue mas ainda não começou, para contar como "acabou de tocar" na hora de escolher a seguinte.
const recentlySent = new Map<number, number>(); // id da faixa -> quando foi entregue
const remember = (id: number) => {
  recentlySent.delete(id);
  recentlySent.set(id, Date.now());
  if (recentlySent.size > 10) recentlySent.delete(recentlySent.keys().next().value as number);
};

let lastJingleSentAt = 0;

const fileExists = (m: Media) => fs.existsSync(path.join(config.mediaDir, m.filename));
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

/** Escolhe a próxima faixa: pedido na fila > vinheta no intervalo > música do programa no ar. */
export async function pickNext(now = new Date()): Promise<NextTrack | null> {
  const slot = await currentSlot(now);
  const programId = slot?.programId ?? null;
  const crossfade = TRANSITION_SECONDS[slot?.transitionType ?? 'crossfade'] ?? 5;

  // 1. Pedido de ouvinte já aprovado (o mais antigo primeiro)
  const queued = await prisma.songRequest.findFirst({
    where: { status: 'queued', mediaItemId: { not: null } },
    orderBy: { queuedAt: 'asc' },
    include: { mediaItem: true },
  });
  if (queued) {
    await prisma.songRequest.update({ where: { id: queued.id }, data: { status: 'sent' } });
    if (queued.mediaItem && fileExists(queued.mediaItem)) {
      remember(queued.mediaItem.id);
      return { media: queued.mediaItem, source: 'request', requestId: queued.id, programId, crossfade };
    }
  }

  // 2. Vinheta, se o bloco permite e já passou o intervalo desde a última
  if (slot?.jingleEnabled ?? true) {
    const lastJingle = await prisma.playHistory.findFirst({ where: { source: 'jingle' }, orderBy: { playedAt: 'desc' } });
    const last = Math.max(lastJingle?.playedAt.getTime() ?? 0, lastJingleSentAt);
    const due = now.getTime() - last >= config.jingleEveryMin * 60_000;
    if (due) {
      const jingles = (
        await prisma.mediaItem.findMany({
          where: { type: 'jingle', enabled: true, OR: [{ programId }, { programId: null }] },
        })
      ).filter(fileExists);
      // Vinheta do próprio programa tem preferência sobre a geral
      const own = jingles.filter((j) => programId && j.programId === programId);
      const chosen = pick(own.length ? own : jingles);
      if (chosen) {
        remember(chosen.id);
        lastJingleSentAt = now.getTime();
        return { media: chosen, source: 'jingle', programId, crossfade: 1 };
      }
    }
  }

  // 3. Música: acervo do programa no ar, ou o acervo inteiro se não houver programa
  const music = { type: 'music', enabled: true } as const;
  let pool: Media[] = [];
  if (slot) {
    const or: Prisma.MediaItemWhereInput[] = [{ programId: slot.programId }];
    // Um programa pode tocar várias pastas, separadas por "|" (ex: "Iron Maiden|Megadeth")
    for (const folder of (slot.program.mediaFolder ?? '').split('|').map((f) => f.trim()).filter(Boolean)) {
      or.push({ filename: { startsWith: `${folder}/` } });
    }
    pool = await prisma.mediaItem.findMany({ where: { ...music, OR: or } });
  }
  if (pool.length === 0) pool = await prisma.mediaItem.findMany({ where: music });
  pool = pool.filter(fileExists);
  if (pool.length === 0) return null;

  // Quando cada faixa tocou (ou foi entregue ao Liquidsoap) pela última vez
  const lastOf = (m: Media) => Math.max(m.lastPlayedAt?.getTime() ?? 0, recentlySent.get(m.id) ?? 0);

  // Embaralha antes de ordenar para que faixas empatadas (ex: nunca tocadas) não saiam sempre na mesma ordem
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const byRest = [...pool].sort((a, b) => lastOf(a) - lastOf(b)); // mais "descansada" primeiro

  // Bloqueia as que tocaram por último: metade do conjunto (no máximo 60), e nunca a mesma duas vezes seguidas
  const blocked = Math.min(pool.length - 1, Math.max(1, Math.min(60, Math.floor(pool.length / 2))));
  let candidates = byRest.slice(0, byRest.length - blocked);

  // Evita o mesmo artista das últimas 3 faixas, se der
  const recent = await prisma.playHistory.findMany({
    where: { source: { not: 'jingle' } },
    orderBy: { playedAt: 'desc' },
    take: 3,
  });
  const recentArtists = new Set(recent.map((h) => h.artist?.toLowerCase()).filter(Boolean));
  const otherArtists = candidates.filter((m) => !recentArtists.has(m.artist?.toLowerCase()));
  if (otherArtists.length > 0) candidates = otherArtists;

  // Sorteia entre as mais descansadas: 20% das candidatas, no mínimo 1 e no máximo 5.
  // Assim o acervo gira inteiro antes de repetir, sem uma ordem fixa.
  const top = candidates.slice(0, Math.max(1, Math.min(5, Math.ceil(candidates.length * 0.2))));
  const chosen = pick(top);
  remember(chosen.id);
  return { media: chosen, source: 'music', programId, crossfade };
}

/** Monta o endereço que o Liquidsoap entende, com dados extras que voltam no aviso de "tocou". */
export function toLiquidsoapUri(t: NextTrack) {
  const meta: Record<string, string> = {
    media_id: String(t.media.id),
    source: t.source,
    liq_cross_duration: t.crossfade.toFixed(1),
  };
  if (t.requestId) meta.request_id = String(t.requestId);
  if (t.programId) meta.program_id = String(t.programId);
  const annotations = Object.entries(meta).map(([k, v]) => `${k}="${v}"`).join(',');
  return `annotate:${annotations}:${config.liquidsoapMediaDir}/${t.media.filename}`;
}

/** Chamado pelo Liquidsoap quando uma faixa começa de fato a tocar. */
export async function recordPlayed(input: {
  mediaId?: number;
  source?: string;
  requestId?: number;
  programId?: number;
  title?: string;
  artist?: string;
}) {
  const media = input.mediaId ? await prisma.mediaItem.findUnique({ where: { id: input.mediaId } }) : null;
  const now = new Date();

  await prisma.playHistory.create({
    data: {
      mediaItemId: media?.id ?? null,
      title: media?.title ?? input.title ?? 'Sem título',
      artist: media?.artist ?? input.artist ?? null,
      source: media ? input.source || 'music' : 'fallback',
      programId: input.programId ?? null,
      playedAt: now,
    },
  });
  if (media) {
    await prisma.mediaItem.update({
      where: { id: media.id },
      data: { lastPlayedAt: now, playCount: { increment: 1 } },
    });
  }
  if (input.requestId) {
    await prisma.songRequest.updateMany({
      where: { id: input.requestId },
      data: { status: 'played', playedAt: now },
    });
  }
}
