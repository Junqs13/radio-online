'use client';

import { useEffect, useRef } from 'react';
import { BrandMark } from './BrandLogo';
import { usePlayer } from './PlayerContext';

/**
 * Símbolo grande do topo. As ondas da antena ficam mais fortes conforme o mouse chega perto
 * e uma terceira onda aparece quando ele está bem em cima. No celular (sem mouse), as ondas
 * pulsam devagar enquanto a rádio está tocando.
 * O "sinal" vai de 0 a 1 e chega ao CSS pela variável --sig.
 */
export default function ReactiveMark({ size = 150, className = '' }: { size?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { isPlaying } = usePlayer();
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const touch = window.matchMedia('(hover: none)').matches;
    let target = 0;
    let cur = 0;
    let raf = 0;
    let visible = true;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      const reach = Math.max(420, r.width * 3);
      const f = Math.max(0, 1 - d / reach);
      target = f * f * (3 - 2 * f);
    };
    const onOut = () => (target = 0);

    const step = (t: number) => {
      if (touch) target = playingRef.current ? 0.45 + 0.4 * Math.sin(t / 420) : 0;
      cur += (target - cur) * 0.12;
      el.style.setProperty('--sig', cur.toFixed(3));
      raf = visible ? requestAnimationFrame(step) : 0;
    };

    // Só anima enquanto o topo está na tela
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) raf = requestAnimationFrame(step);
    });
    io.observe(el);
    if (!touch) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onOut);
    }
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onOut);
    };
  }, []);

  return (
    <div ref={ref} className={`reactive-mark ${className}`}>
      {/* Brilho das ondas e a terceira onda, por cima do símbolo */}
      <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full overflow-visible pointer-events-none" aria-hidden>
        <defs>
          <filter id="rm-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <g filter="url(#rm-glow)" style={{ opacity: 'var(--sig)' }} strokeLinecap="round" fill="none">
          <path d="M84 20 A22 22 0 0 0 84 52 M116 20 A22 22 0 0 1 116 52" stroke="#E11D2E" strokeWidth="10" />
          <path d="M70 6 A40 40 0 0 0 70 66 M130 6 A40 40 0 0 1 130 66" stroke="#7C3AED" strokeWidth="10" />
        </g>
        <path
          d="M60 -6 A58 58 0 0 0 60 78 M140 -6 A58 58 0 0 1 140 78"
          fill="none"
          stroke="#F4EDE0"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray="2 9"
          style={{ opacity: 'calc(var(--sig) * var(--sig))' }}
        />
      </svg>
      <BrandMark size={size} className="relative w-full h-full" />
    </div>
  );
}
