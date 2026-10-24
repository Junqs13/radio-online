import fs from 'fs';
import path from 'path';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';
import { currentSlot } from './Schedule.js';
import { ruleFor, allowed, isSpecific } from './JingleRules.js';

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

// Vinheta a cada N músicas, com N sorteado entre o mínimo e o máximo da configuração (5 a 7).
// O contador vive em memória; ao reiniciar o backend ele é refeito pelo histórico.
let songsSinceJingle: number | null = null;
let nextJingleGap = 0;
const drawGap = () =>
  config.jingleEverySongsMin + Math.floor(Math.random() * (config.jingleEverySongsMax - config.jingleEverySongsMin + 1));

async function songsSinceLastJingle() {
  if (songsSinceJingle !== null) return songsSinceJingle;
  const lastJingle = await prisma.playHistory.findFirst({ where: { source: 'jingle' }, orderBy: { playedAt: 'desc' } });
  songsSinceJingle = await prisma.playHistory.count({
    where: { source: { in: ['music', 'request'] }, ...(lastJingle ? { playedAt: { gt: lastJingle.playedAt } } : {}) },
  });
  nextJingleGap = drawGap();
  return songsSinceJingle;
}
const countSong = () => {
  songsSinceJingle = (songsSinceJingle ?? 0) + 1;
};

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
      countSong();
      return { media: queued.mediaItem, source: 'request', requestId: queued.id, programId, crossfade };
    }
  }

  // 2. Vinheta, se o bloco permite e já tocaram de 5 a 7 músicas desde a última
  if ((slot?.jingleEnabled ?? true) && (await songsSinceLastJingle()) >= nextJingleGap) {
    const all = (await prisma.mediaItem.findMany({ where: { type: 'jingle', enabled: true } })).filter(fileExists);
    const titles = (await prisma.program.findMany({ select: { title: true } })).map((p) => p.title);
    const programTitle = slot?.program.title ?? null;
    // Só as que podem tocar agora: programa no ar, horário e dia da semana (regra pela subpasta)
    const eligible = all
      .map((m) => ({ m, rule: ruleFor(m.filename, titles) }))
      .filter(({ m, rule }) => (m.programId == null || m.programId === programId) && allowed(rule, programTitle, now));
    // Metade das vezes, se houver, usa a vinheta específica do programa ou do horário; senão, a geral
    const specific = eligible.filter(({ m, rule }) => isSpecific(rule) || (programId != null && m.programId === programId));
    const general = eligible.filter((e) => !specific.includes(e));
    const pool = (specific.length && (Math.random() < 0.5 || !general.length) ? specific : general).map((e) => e.m);
    // Entre as candidatas, sorteia entre as que estão há mais tempo sem tocar
    const lastOfJ = (m: Media) => Math.max(m.lastPlayedAt?.getTime() ?? 0, recentlySent.get(m.id) ?? 0);
    const rested = [...pool].sort(() => Math.random() - 0.5).sort((a, b) => lastOfJ(a) - lastOfJ(b));
    const chosen = pick(rested.slice(0, Math.max(1, Math.ceil(rested.length / 3))));
    if (chosen) {
      remember(chosen.id);
      songsSinceJingle = 0;
      nextJingleGap = drawGap();
      return { media: chosen, source: 'jingle', programId, crossfade: 1 };
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
  countSong();
  return { media: chosen, source: 'music', programId, crossfade };
}

/** Monta o endereço que o Liquidsoap entende, com dados extras que voltam no aviso de "tocou". */
export function toLiquidsoapUri(t: NextTrack) {
  const meta: Record<string, string> = {
    media_id: String(t.media.id),
    source: t.source,
    liq_cross_duration: t.crossfade.toFixed(1),
  };
  // Corta o silêncio do começo e do fim do arquivo (medido pelo SilenceTrim)
  if (t.media.cueIn != null) meta.liq_cue_in = t.media.cueIn.toFixed(2);
  if (t.media.cueOut != null) meta.liq_cue_out = t.media.cueOut.toFixed(2);
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
