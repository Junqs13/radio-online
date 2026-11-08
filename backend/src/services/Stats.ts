import { createHmac } from 'node:crypto';
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

const STORED = new Set(['pageview', 'click', 'play', 'pause', 'open', 'like', 'share', 'read', 'scroll']);
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

/**
 * Impressão diária do IP: HMAC com a chave do servidor mais a data do dia.
 * Serve só para contar IPs diferentes em cada dia. Não dá para voltar ao IP,
 * e o mesmo IP gera uma impressão diferente no dia seguinte.
 */
function ipDoDia(ip: string | undefined, quando: Date) {
  if (!ip) return null;
  const dia = new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(quando);
  return createHmac('sha256', `${config.sessionSecret}:${dia}`).update(ip.replace(/^::ffff:/, '')).digest('hex').slice(0, 24);
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
          lat: geo?.lat ?? null,
          lon: geo?.lon ?? null,
          ipHash: ipDoDia(ip, now),
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
    const value = Number.isFinite(Number(e.value)) ? Math.max(0, Math.min(type === 'scroll' ? 100 : 3600, Math.round(Number(e.value)))) : null;
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
// Uma visita sem nada além de abrir e fechar dura 0 s; mais de 6 h quase sempre é aba esquecida
const DUR = Prisma.sql`LEAST(EXTRACT(EPOCH FROM (last_seen_at - started_at))::float8, 21600::float8)`;

/** Números principais de um intervalo (usado no período escolhido e no anterior, para comparar) */
async function totais(desde: Date, ate: Date) {
  const [t] = await prisma.$queryRaw<Row[]>`
    SELECT COUNT(*) AS sessions,
           COUNT(DISTINCT visitor_id) AS visitors,
           COUNT(DISTINCT (ip_hash, (started_at AT TIME ZONE 'UTC' AT TIME ZONE ${config.timezone})::date)) FILTER (WHERE ip_hash IS NOT NULL) AS ip_days,
           COALESCE(SUM(pageviews), 0) AS pageviews,
           COALESCE(AVG(${DUR}), 0) AS avg_duration,
           COUNT(*) FILTER (WHERE played) AS listeners,
           COALESCE(AVG(listen_seconds) FILTER (WHERE played), 0) AS avg_listen,
           COALESCE(SUM(listen_seconds), 0) AS listen_total,
           COUNT(*) FILTER (WHERE pageviews <= 1 AND ${DUR} < 10 AND NOT played) AS bounces
    FROM stat_sessions WHERE started_at >= ${desde} AND started_at < ${ate}`;
  const [l] = await prisma.$queryRaw<Row[]>`
    SELECT COUNT(*) FILTER (WHERE type = 'pageview' AND path LIKE '/materias/%') AS article_views,
           COUNT(DISTINCT session_id) FILTER (WHERE type = 'pageview' AND path LIKE '/materias/%') AS article_sessions,
           COALESCE(SUM(value) FILTER (WHERE type = 'read'), 0) AS read_total,
           COUNT(DISTINCT session_id) FILTER (WHERE type = 'read') AS readers
    FROM stat_events WHERE created_at >= ${desde} AND created_at < ${ate}`;
  const [req] = await prisma.$queryRaw<Row[]>`SELECT COUNT(*) AS n FROM song_requests WHERE created_at >= ${desde} AND created_at < ${ate}`;
  const sessions = num(t.sessions);
  return {
    sessions,
    visitors: num(t.visitors),
    uniqueIps: num(t.ip_days), // soma dos IPs diferentes de cada dia
    pageviews: num(t.pageviews),
    pagesPerVisit: sessions ? Math.round((num(t.pageviews) / sessions) * 10) / 10 : 0,
    avgDuration: Math.round(num(t.avg_duration)),
    listeners: num(t.listeners),
    playRate: sessions ? Math.round((num(t.listeners) / sessions) * 1000) / 10 : 0,
    avgListen: Math.round(num(t.avg_listen)),
    listenHours: Math.round((num(t.listen_total) / 3600) * 10) / 10,
    bounces: num(t.bounces),
    bounceRate: sessions ? Math.round((num(t.bounces) / sessions) * 1000) / 10 : 0,
    articleViews: num(l.article_views),
    articleSessions: num(l.article_sessions),
    avgRead: num(l.readers) ? Math.round(num(l.read_total) / num(l.readers)) : 0,
    requests: num(req.n),
  };
}

/** Resumo para o painel: últimos N dias, no fuso da rádio, comparado com os N dias anteriores */
export async function summary(days: number) {
  const agora = new Date();
  const since = new Date(agora.getTime() - days * 86_400_000);
  const antes = new Date(since.getTime() - days * 86_400_000);
  const tz = config.timezone;
  const local = Prisma.sql`(started_at AT TIME ZONE 'UTC' AT TIME ZONE ${tz})`;

  const [atual, anterior] = await Promise.all([totais(since, agora), totais(antes, since)]);

  const [ret] = await prisma.$queryRaw<Row[]>`
    SELECT COUNT(DISTINCT s.visitor_id) AS returning
    FROM stat_sessions s
    WHERE s.started_at >= ${since}
      AND EXISTS (SELECT 1 FROM stat_sessions p WHERE p.visitor_id = s.visitor_id AND p.started_at < ${since})`;

  // Por dia (ou por hora, quando o período é só hoje)
  const passo = days === 1 ? Prisma.sql`'hour'` : Prisma.sql`'day'`;
  const formato = days === 1 ? 'YYYY-MM-DD"T"HH24' : 'YYYY-MM-DD';
  const serie = await prisma.$queryRaw<Row[]>`
    SELECT to_char(date_trunc(${passo}, ${local}), ${formato}) AS t,
           COUNT(*) AS sessions, COUNT(DISTINCT visitor_id) AS visitors,
           COUNT(DISTINCT ip_hash) AS ips, COUNT(*) FILTER (WHERE played) AS listeners,
           COALESCE(SUM(pageviews), 0) AS pageviews
    FROM stat_sessions WHERE started_at >= ${since} GROUP BY 1 ORDER BY 1`;

  // Dia da semana x hora
  const calor = await prisma.$queryRaw<Row[]>`
    SELECT EXTRACT(DOW FROM ${local})::int AS dow, EXTRACT(HOUR FROM ${local})::int AS hour, COUNT(*) AS n
    FROM stat_sessions WHERE started_at >= ${since} GROUP BY 1, 2`;
  const heat = Array.from({ length: 7 }, (_, d) => Array.from({ length: 24 }, (_, h) => num(calor.find((r) => num(r.dow) === d && num(r.hour) === h)?.n)));

  const group = async (col: string, limit = 12) =>
    (
      await prisma.$queryRaw<Row[]>`
        SELECT COALESCE(${Prisma.raw(col)}, '(não identificado)') AS label, COUNT(*) AS n
        FROM stat_sessions WHERE started_at >= ${since}
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

  // Páginas mais vistas
  const pages = (
    await prisma.$queryRaw<Row[]>`
      SELECT COALESCE(path, '/') AS label, COUNT(*) AS n, COUNT(DISTINCT session_id) AS visits
      FROM stat_events WHERE type = 'pageview' AND created_at >= ${since}
      GROUP BY 1 ORDER BY 2 DESC LIMIT 15`
  ).map((r) => ({ label: String(r.label), n: num(r.n), visits: num(r.visits) }));

  // Matérias: vistas, pessoas, tempo médio lendo e quanto da matéria foi lido
  const materias = (
    await prisma.$queryRaw<Row[]>`
      WITH v AS (
        SELECT e.path, COUNT(*) AS views, COUNT(DISTINCT s.visitor_id) AS people
        FROM stat_events e JOIN stat_sessions s ON s.id = e.session_id
        WHERE e.type = 'pageview' AND e.path LIKE '/materias/_%' AND e.created_at >= ${since}
        GROUP BY 1
      ), r AS (
        SELECT path, session_id, SUM(value) AS secs FROM stat_events
        WHERE type = 'read' AND path LIKE '/materias/_%' AND created_at >= ${since} GROUP BY 1, 2
      ), sc AS (
        SELECT path, session_id, MAX(value) AS pct FROM stat_events
        WHERE type = 'scroll' AND path LIKE '/materias/_%' AND created_at >= ${since} GROUP BY 1, 2
      ), t AS (
        SELECT path, MAX(name) AS title FROM stat_events
        WHERE type IN ('read', 'scroll') AND path LIKE '/materias/_%' AND name IS NOT NULL GROUP BY 1
      )
      SELECT v.path, v.views, v.people, t.title,
             (SELECT AVG(secs) FROM r WHERE r.path = v.path) AS avg_read,
             (SELECT AVG(pct) FROM sc WHERE sc.path = v.path) AS avg_scroll,
             (SELECT COUNT(*) FROM sc WHERE sc.path = v.path AND pct >= 90) AS finished,
             (SELECT COUNT(*) FROM sc WHERE sc.path = v.path) AS scrolled
      FROM v LEFT JOIN t ON t.path = v.path
      ORDER BY v.views DESC LIMIT 20`
  ).map((r) => ({
    path: String(r.path),
    title: (r.title as string) || null,
    views: num(r.views),
    people: num(r.people),
    avgRead: Math.round(num(r.avg_read)),
    avgScroll: Math.round(num(r.avg_scroll)),
    finishedRate: num(r.scrolled) ? Math.round((num(r.finished) / num(r.scrolled)) * 100) : 0,
  }));

  // Pontos para o mapa (centro aproximado da cidade)
  const points = (
    await prisma.$queryRaw<Row[]>`
      SELECT lat, lon, MAX(city) AS city, MAX(region) AS region, MAX(country) AS country, COUNT(*) AS n
      FROM stat_sessions WHERE started_at >= ${since} AND lat IS NOT NULL AND lon IS NOT NULL
      GROUP BY 1, 2 ORDER BY 6 DESC LIMIT 300`
  ).map((r) => ({ lat: num(r.lat), lon: num(r.lon), label: [r.city, r.region, r.country].filter(Boolean).join(', '), n: num(r.n) }));

  const cities = (
    await prisma.$queryRaw<Row[]>`
      SELECT city, region, country, COUNT(*) AS n
      FROM stat_sessions WHERE started_at >= ${since} AND city IS NOT NULL
      GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 15`
  ).map((r) => ({ label: [r.city, r.region, r.country].filter(Boolean).join(', '), n: num(r.n) }));

  const recent = (
    await prisma.$queryRaw<Row[]>`
      SELECT started_at, city, region, country, device, os, browser, COALESCE(utm_source, referrer) AS referrer, landing_path, pageviews, listen_seconds, ${DUR} AS duration
      FROM stat_sessions WHERE started_at >= ${since} ORDER BY started_at DESC LIMIT 25`
  ).map((r) => ({
    startedAt: r.started_at,
    place: [r.city, r.region, r.country].filter(Boolean).join(', ') || '(não identificado)',
    device: String(r.device ?? ''),
    os: String(r.os ?? ''),
    browser: String(r.browser ?? ''),
    referrer: (r.referrer as string) || 'direto',
    landing: (r.landing_path as string) || '/',
    pageviews: num(r.pageviews),
    listenSeconds: num(r.listen_seconds),
    duration: Math.round(num(r.duration)),
  }));

  return {
    days,
    totals: { ...atual, returning: num(ret.returning) },
    previous: anterior,
    series: serie.map((r) => ({
      t: String(r.t),
      sessions: num(r.sessions),
      visitors: num(r.visitors),
      ips: num(r.ips),
      listeners: num(r.listeners),
      pageviews: num(r.pageviews),
    })),
    heat,
    points,
    cities,
    regions: await group(`region || ', ' || country`),
    countries: await group('country'),
    devices: await group('device'),
    os: await group('os'),
    browsers: await group('browser'),
    referrers: await group(`COALESCE(utm_source, referrer, 'direto')`),
    landing: await group('landing_path', 8),
    pages,
    materias,
    clicks: await events('click', 20),
    sections,
    plays: await events('play', 10),
    legends: await events('open', 10),
    likes: await events('like', 10),
    shares: await events('share', 10),
    recent,
  };
}

/** Quem está no site agora: visitas com sinal nos últimos 90 s (o site manda um a cada 20 s) */
export async function live() {
  const desde = new Date(Date.now() - 90_000);
  const rows = await prisma.$queryRaw<Row[]>`
    SELECT s.id, s.city, s.region, s.country, s.device, s.played, s.started_at,
           (SELECT path FROM stat_events e WHERE e.session_id = s.id AND e.type = 'pageview' ORDER BY e.created_at DESC LIMIT 1) AS path
    FROM stat_sessions s WHERE s.last_seen_at >= ${desde} ORDER BY s.started_at DESC LIMIT 100`;
  const [hoje] = await prisma.$queryRaw<Row[]>`
    SELECT COUNT(*) AS sessions, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT ip_hash) AS ips
    FROM stat_sessions
    WHERE (started_at AT TIME ZONE 'UTC' AT TIME ZONE ${config.timezone})::date = (now() AT TIME ZONE ${config.timezone})::date`;
  return {
    active: rows.length,
    listening: rows.filter((r) => r.played).length,
    today: { sessions: num(hoje.sessions), visitors: num(hoje.visitors), ips: num(hoje.ips) },
    visits: rows.slice(0, 30).map((r) => ({
      place: [r.city, r.region].filter(Boolean).join(', ') || '(não identificado)',
      device: String(r.device ?? ''),
      path: (r.path as string) || '/',
      played: Boolean(r.played),
      since: r.started_at,
    })),
  };
}
