'use client';

type LenisLike = { scrollTo: (t: number | HTMLElement, o?: { offset?: number; duration?: number }) => void };

/** Rola até uma seção (ou ao topo) usando o Lenis da página, com fallback para o rolar nativo. */
export function scrollToTarget(target: string | 0) {
  const lenis = (window as unknown as { __lenis?: LenisLike }).__lenis;
  const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (target === 0) {
    if (lenis && !calm) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: calm ? 'auto' : 'smooth' });
    return;
  }
  const el = document.getElementById(target);
  if (!el) return;
  const offset = -(document.querySelector('header')?.getBoundingClientRect().height ?? 80) - 16;
  if (lenis && !calm) lenis.scrollTo(el, { offset, duration: 1.2 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: calm ? 'auto' : 'smooth' });
}
