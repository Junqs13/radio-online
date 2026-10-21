'use client';

import { API_URL } from './config';

/**
 * Estatísticas próprias do site, sem Google Analytics e sem cookie.
 * Guarda no navegador só dois números aleatórios: um da visita (some ao fechar a aba
 * ou depois de 30 min parado) e um do aparelho, para saber quem volta.
 * Quem liga "Não rastrear" no navegador fica de fora.
 */

type Ev = { type: string; name?: string; section?: string; path?: string; value?: number };

const VISIT_IDLE_MS = 30 * 60_000;
let queue: Ev[] = [];
let started = false;
let sid = '';
let vid = '';
let sentMeta = false;
const leaveHooks: (() => void)[] = [];

/** Chamado antes do último envio quando a pessoa sai ou esconde a aba (ex: fechar a conta do tempo ouvindo) */
export const onLeave = (cb: () => void) => leaveHooks.push(cb);

const rid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(
    /[^\w-]/g,
    '',
  );

function storage(kind: 'local' | 'session') {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function ids() {
  const ls = storage('local');
  const ss = storage('session');
  vid = ls?.getItem('ar_vid') || '';
  if (!vid) {
    vid = rid();
    ls?.setItem('ar_vid', vid);
  }
  const last = Number(ss?.getItem('ar_last') || 0);
  sid = ss?.getItem('ar_sid') || '';
  if (!sid || Date.now() - last > VISIT_IDLE_MS) {
    sid = rid();
    ss?.setItem('ar_sid', sid);
    sentMeta = false;
  }
  ss?.setItem('ar_last', String(Date.now()));
}

const optedOut = () =>
  typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1');

function flush(useBeacon = false) {
  if (!started || (!queue.length && !useBeacon)) return;
  ids();
  const url = new URLSearchParams(location.search);
  const payload: Record<string, unknown> = { sid, vid, events: queue.splice(0, 50) };
  if (!sentMeta) {
    payload.meta = {
      path: location.pathname,
      referrer: document.referrer || null,
      utm: url.get('utm_source') || url.get('ref') || null,
      lang: navigator.language,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    sentMeta = true;
  }
  const body = JSON.stringify(payload);
  const endpoint = `${API_URL}/stats/collect`;
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(endpoint, { method: 'POST', body, headers: { 'Content-Type': 'text/plain' }, keepalive: true }).catch(() => {});
    }
  } catch {
    /* sem rede: perde só este pacote */
  }
}

export function track(type: string, name?: string, extra: Omit<Ev, 'type' | 'name'> = {}) {
  if (!started) return;
  queue.push({ type, name: name?.slice(0, 160), path: location.pathname, ...extra });
  if (type === 'listen' && document.visibilityState === 'hidden') flush(true); // tela bloqueada ouvindo
  else if (type !== 'listen' && queue.length >= 10) flush();
}

/** O que foi clicado: data-track, rótulo do botão ou texto do link */
function describe(el: Element) {
  const tracked = el.closest('[data-track]');
  if (tracked) return tracked.getAttribute('data-track') || '';
  const target = el.closest('a,button,[role=button],input[type=submit],summary');
  if (!target) return '';
  const label =
    target.getAttribute('aria-label') ||
    target.textContent?.trim().replace(/\s+/g, ' ') ||
    target.getAttribute('title') ||
    target.getAttribute('href') ||
    '';
  return label.slice(0, 80);
}

function sectionOf(el: Element) {
  const marked = el.closest('[data-section]');
  if (marked) return marked.getAttribute('data-section') || 'outro';
  const s = el.closest('section[id], header, nav, footer');
  if (!s) return 'outro';
  return s.getAttribute('data-section') || s.id || s.tagName.toLowerCase();
}

export function startAnalytics() {
  if (started || typeof window === 'undefined' || optedOut()) return;
  started = true;
  ids();
  track('pageview');
  flush();

  document.addEventListener(
    'click',
    (e) => {
      const el = e.target as Element | null;
      if (!el) return;
      const name = describe(el);
      if (name) track('click', name, { section: sectionOf(el) });
    },
    { capture: true, passive: true },
  );

  // A cada 20 s com a aba visível avisa que a pessoa segue aqui (é assim que sai o tempo de visita)
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    storage('session')?.setItem('ar_last', String(Date.now()));
    if (!queue.length) queue.push({ type: 'ping' });
    flush();
  }, 20_000);

  const leave = () => {
    leaveHooks.forEach((h) => h());
    flush(true);
  };
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && leave());
  window.addEventListener('pagehide', leave);
}
