import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';
import { locate } from '../lib/geo.js';
import { parseUserAgent } from '../lib/useragent.js';

/**
 * Estatísticas do site sem serviço de terceiros. O navegador manda pacotes de eventos;
 * aqui eles viram uma visita (sessão) e uma lista de eventos. O IP só é usado na hora,
 * para achar a cidade, e não é guardado.
 */

const STORED = new Set(['pageview', 'click', 'play', 'pause', 'open', 'like', 'share']);
const RETENTION_DAYS = 400;

export interface IncomingBatch {
  sid?: unknown;
  vid?: unknown;
  meta?: { path?: unknown; referrer?: unknown; utm?: unknown; lang?: unknown; tz?: unknown };
  events?: { type?: unknown; name?: unknown; section?: unknown; path?: unknown; value?: unknown }[];
}

const s = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null);
const id = (v: unknown) => (typeof v === 'string' && /^[\w-]{8,64}$/.test(v) ? v : null);

function referrerDomain(ref: string | null) {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    return config.corsOrigins.some((o) => o.includes(host)) ? null : host; // o próprio site não conta como origem
  } catch {
    return null;
  }
}

export async function collect(batch: IncomingBatch, ip: string | undefined, ua: string | undefined) {
  const sid = id(batch.sid);
  const vid = id(batch.vid);
  if (!sid || !vid) return false;
  const agent = parseUserAgent(ua);
  if (agent.isBot) return true;

  const events = (Array.isArray(batch.events) ? batch.events : []).slice(0, 50);
  const now = new Date();

  const exists = await prisma.statSession.findUnique({ where: { id: sid }, select: { id: true } });
  if (!exists) {
    const geo = await locate(ip);
    const m = batch.meta ?? {};
    await prisma.statSession
      .create({
        data: {
          id: sid,
          visitorId: vid,
          landingPath: s(m.path, 200),
          referrer: referrerDomain(s(m.referrer, 500)),
          utmSource: s(m.utm, 80),
          lang: s(m.lang, 20),
          timezone: s(m.tz, 60),
          country: geo?.country ?? null,
          region: geo?.region ?? null,
          city: geo?.city ?? null,
          device: agent.device,
          os: agent.os,
          browser: agent.browser,
        },
      })
      .catch(() => {}); // duas abas criando ao mesmo tempo: a segunda só segue
  }

  let pageviews = 0;
  let listen = 0;
  let played = false;
  const rows: Prisma.StatEventCreateManyInput[] = [];
  for (const e of events) {
    const type = s(e.type, 20);
    if (!type) continue;
    const value = Number.isFinite(Number(e.value)) ? Math.max(0, Math.min(3600, Math.round(Number(e.value)))) : null;
    if (type === 'pageview') pageviews++;
    if (type === 'listen' && value) listen += value; // tempo ouvindo: soma na visita, não vira linha
    if (type === 'play') played = true;
    if (STORED.has(type)) {
      rows.push({ sessionId: sid, type, name: s(e.name, 160), section: s(e.section, 60), path: s(e.path, 200), value, createdAt: now });
    }
  }

  await prisma.statSession.updateMany({
    where: { id: sid },
    data: {
      lastSeenAt: now,
      ...(pageviews ? { pageviews: { increment: pageviews } } : {}),
      ...(listen ? { listenSeconds: { increment: listen } } : {}),
      ...(played ? { played: true } : {}),
    },
  });
  if (rows.length) await prisma.statEvent.createMany({ data: rows });
  return true;
}

/** Apaga visitas com mais de ~13 meses */
export async function purgeOld() {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
  const { count } = await prisma.statSession.deleteMany({ where: { startedAt: { lt: cutoff } } });
  if (count) console.log(`[estatísticas] ${count} visita(s) antigas apagadas.`);
}

type Row = Record<string, unknown>;
const num = (v: unknown) => Number(v ?? 0);

/** Resumo para o painel: últimos N dias, no fuso da rádio */
export async function summary(days: number) {
  const since = new Date(Date.now() - days * 86_400_000);
  const tz = config.timezone;
  // Uma visita sem nada além de abrir e fechar dura 0s; mais de 6h quase sempre é aba esquecida
  const dur = Prisma.sql`LEAST(EXTRACT(EPOCH FROM (last_seen_at - started_at))::float8, 21600::float8)`;

  const [tot] = await prisma.$queryRaw<Row[]>`
    SELECT COUNT(*) AS sessions,
           COUNT(DISTINCT visitor_id) AS visitors,
           COALESCE(SUM(pageviews), 0) AS pageviews,
           COALESCE(AVG(${dur}), 0) AS avg_duration,
           COUNT(*) FILTER (WHERE played) AS listeners,
           COALESCE(AVG(listen_seconds) FILTER (WHERE played), 0) AS avg_listen,
           COALESCE(SUM(listen_seconds), 0) AS listen_total,
           COUNT(*) FILTER (WHERE pageviews <= 1 AND ${dur} < 10 AND NOT played) AS bounces
    FROM stat_sessions WHERE started_at >= ${since}`;

  const [ret] = await prisma.$queryRaw<Row[]>`
    SELECT COUNT(DISTINCT s.visitor_id) AS returning
    FROM stat_sessions s
    WHERE s.started_at >= ${since}
      AND EXISTS (SELECT 1 FROM stat_sessions p WHERE p.visitor_id = s.visitor_id AND p.started_at < ${since})`;

  const local = Prisma.sql`(started_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz})`;
  const byDay = await prisma.$queryRaw<Row[]>`
    SELECT to_char(date_trunc('day', ${local}), 'YYYY-MM-DD') AS day,
           COUNT(*) AS sessions, COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) FILTER (WHERE played) AS listeners
    FROM stat_sessions WHERE started_at >= ${since} GROUP BY 1 ORDER BY 1`;
  const byHour = await prisma.$queryRaw<Row[]>`
    SELECT EXTRACT(HOUR FROM ${local})::int AS hour, COUNT(*) AS sessions
    FROM stat_sessions WHERE started_at >= ${since} GROUP BY 1 ORDER BY 1`;

  const group = async (col: string, limit = 12, where = Prisma.empty) =>
    (
      await prisma.$queryRaw<Row[]>`
        SELECT COALESCE(${Prisma.raw(col)}, '(não identificado)') AS label, COUNT(*) AS n
        FROM stat_sessions WHERE started_at >= ${since} ${where}
        GROUP BY 1 ORDER BY 2 DESC LIMIT ${limit}`
    ).map((r) => ({ label: String(r.label), n: num(r.n) }));

  const events = async (type: string, limit = 15) =>
    (
      await prisma.$queryRaw<Row[]>`
        SELECT COALESCE(name, '(sem nome)') AS label, COALESCE(section, '') AS section, COUNT(*) AS n
        FROM stat_events WHERE type = ${type} AND created_at >= ${since}
        GROUP BY 1, 2 ORDER BY 3 DESC LIMIT ${limit}`
    ).map((r) => ({ label: String(r.label), section: String(r.section), n: num(r.n) }));

  const sections = (
    await prisma.$queryRaw<Row[]>`
      SELECT COALESCE(section, 'outro') AS label, COUNT(*) AS n
      FROM stat_events WHERE type = 'click' AND created_at >= ${since}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 12`
  ).map((r) => ({ label: String(r.label), n: num(r.n) }));

  const cities = (
    await prisma.$queryRaw<Row[]>`
      SELECT city, region, country, COUNT(*) AS n
      FROM stat_sessions WHERE started_at >= ${since} AND city IS NOT NULL
      GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 15`
  ).map((r) => ({ label: [r.city, r.region, r.country].filter(Boolean).join(', '), n: num(r.n) }));

  const recent = (
    await prisma.$queryRaw<Row[]>`
      SELECT started_at, city, region, country, device, os, browser, COALESCE(utm_source, referrer) AS referrer, pageviews, listen_seconds, ${dur} AS duration
      FROM stat_sessions WHERE started_at >= ${since} ORDER BY started_at DESC LIMIT 25`
  ).map((r) => ({
    startedAt: r.started_at,
    place: [r.city, r.region, r.country].filter(Boolean).join(', ') || '(não identificado)',
    device: `${r.device ?? ''} · ${r.os ?? ''} · ${r.browser ?? ''}`,
    referrer: (r.referrer as string) || 'direto',
    pageviews: num(r.pageviews),
    listenSeconds: num(r.listen_seconds),
    duration: Math.round(num(r.duration)),
  }));

  return {
    days,
    totals: {
      sessions: num(tot.sessions),
      visitors: num(tot.visitors),
      returning: num(ret.returning),
      pageviews: num(tot.pageviews),
      avgDuration: Math.round(num(tot.avg_duration)),
      listeners: num(tot.listeners),
      avgListen: Math.round(num(tot.avg_listen)),
      listenHours: Math.round((num(tot.listen_total) / 3600) * 10) / 10,
      bounces: num(tot.bounces),
    },
    byDay: byDay.map((r) => ({ day: String(r.day), sessions: num(r.sessions), visitors: num(r.visitors), listeners: num(r.listeners) })),
    byHour: Array.from({ length: 24 }, (_, h) => num(byHour.find((r) => num(r.hour) === h)?.sessions)),
    cities,
    regions: await group(`region || ', ' || country`),
    countries: await group('country'),
    devices: await group('device'),
    os: await group('os'),
    browsers: await group('browser'),
    referrers: await group(`COALESCE(utm_source, referrer, 'direto')`),
    landing: await group('landing_path', 8),
    clicks: await events('click', 20),
    sections,
    plays: await events('play', 10),
    legends: await events('open', 10),
    likes: await events('like', 10),
    shares: await events('share', 10),
    recent,
  };
}
