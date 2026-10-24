'use client';

/**
 * Entradas no scroll: qualquer elemento com data-reveal aparece quando chega na tela.
 *   data-reveal="up" | "zoom" | "left" | "right" | "tilt" | "title"
 *   data-reveal-stagger  → os filhos entram um depois do outro (serve para listas que carregam depois)
 * O CSS fica em globals.css e só esconde as coisas depois que este script liga a classe
 * "reveal-ready" no <html>. Se o JavaScript falhar, nada some da página.
 * Quem pede menos movimento no sistema vê tudo parado.
 */
export function startReveal() {
  if (typeof window === 'undefined') return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const root = document.documentElement;
  root.classList.add('reveal-ready');

  const stagger = (el: Element) => {
    Array.from(el.children).forEach((c, i) => (c as HTMLElement).style.setProperty('--reveal-delay', `${Math.min(i, 12) * 90}ms`));
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        if (e.target.hasAttribute('data-reveal-stagger')) stagger(e.target);
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
  );

  const watch = (scope: ParentNode) => {
    scope.querySelectorAll('[data-reveal]:not(.is-in), [data-reveal-stagger]:not(.is-in)').forEach((el) => io.observe(el));
  };
  watch(document);

  // Conteúdo que chega depois (lendas, grade, últimas tocadas): observa os novos e dá atraso aos filhos novos
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      m.addedNodes.forEach((n) => {
        if (!(n instanceof Element)) return;
        if (n.matches('[data-reveal], [data-reveal-stagger]')) io.observe(n);
        watch(n);
      });
      const parent = m.target as Element;
      if (parent instanceof Element && parent.hasAttribute('data-reveal-stagger')) stagger(parent);
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });

  return () => {
    io.disconnect();
    mo.disconnect();
    root.classList.remove('reveal-ready');
  };
}
