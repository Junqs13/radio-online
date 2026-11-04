'use client';
import { ReactNode, useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Quem pede menos movimento fica com a rolagem nativa do navegador
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // lerp 0,2: suaviza a roda do mouse sem atrasar (assenta em uns 0,3 s, antes eram 1,2 s)
    const lenis = new Lenis({
      lerp: 0.2,
      orientation: 'vertical',
      smoothWheel: true,
    });

    // Menu e "voltar ao topo" usam o mesmo Lenis para descer suave (lib/scrollTo.ts)
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    let id = 0;
    function raf(time: number) {
      lenis.raf(time);
      id = requestAnimationFrame(raf);
    }

    id = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(id);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, []);

  return <>{children}</>;
}