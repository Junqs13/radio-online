'use client';

/**
 * Faz a luz do vidro líquido (.glass, em globals.css) seguir o mouse ou o dedo.
 * Um único ouvinte para a página inteira, que só escreve duas variáveis CSS no botão.
 */
export function startGlass() {
  if (typeof window === 'undefined') return () => {};
  const place = (e: PointerEvent) => {
    const el = (e.target as Element | null)?.closest?.('.glass') as HTMLElement | null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--gx', `${e.clientX - r.left}px`);
    el.style.setProperty('--gy', `${e.clientY - r.top}px`);
  };
  document.addEventListener('pointermove', place, { passive: true });
  document.addEventListener('pointerdown', place, { passive: true });
  return () => {
    document.removeEventListener('pointermove', place);
    document.removeEventListener('pointerdown', place);
  };
}
