'use client';

import { useEffect, useRef, useState } from 'react';
import { API_URL } from '@/lib/config';

interface Today {
  songs: number;
  artists: number;
  requests: number;
}

/** Número que sobe de 0 até o valor quando aparece na tela */
function Count({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(0);
  const last = useRef(0); // na atualização seguinte, sobe a partir de onde estava
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(to);
    let raf = 0;
    const t0 = performance.now();
    const from = last.current;
    last.current = to;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1400);
      setN(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, run]);
  return <>{n.toLocaleString('pt-BR')}</>;
}

/**
 * Números de hoje, contados no histórico da rádio desde a meia-noite (horário de Brasília).
 * Vinhetas não entram. De madrugada, antes da primeira música, o bloco não aparece.
 */
export default function TodayNumbers() {
  const [data, setData] = useState<Today | null>(null);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/stream/today`);
        if (res.ok) {
          const d = await res.json();
          setData({ songs: d.songs ?? 0, artists: d.artists ?? 0, requests: d.requests ?? 0 });
        }
      } catch {
        /* sem conexão: não mostra */
      }
    };
    load();
    const t = setInterval(load, 120_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [data !== null]);

  if (!data || data.songs < 1) return null;

  const items = [
    { n: data.songs, label: data.songs === 1 ? 'música tocada' : 'músicas tocadas' },
    { n: data.artists, label: data.artists === 1 ? 'artista' : 'artistas diferentes' },
    { n: data.requests, label: data.requests === 1 ? 'pedido de ouvinte' : 'pedidos de ouvintes' },
  ];

  return (
    <div ref={ref} data-section="numeros-de-hoje" className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent px-6 py-6 sm:px-10">
      <p className="text-[10px] uppercase tracking-[0.35em] text-gray-400 font-bold mb-4">Hoje na Antena, desde a meia-noite</p>
      <dl className="grid grid-cols-3 gap-4 sm:gap-8">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col gap-1">
            <dd className="order-first font-brand font-extrabold text-3xl sm:text-5xl tabular-nums bg-gradient-to-r from-[#F4EDE0] to-[#CFC8DA] bg-clip-text text-transparent">
              <Count to={it.n} run={seen} />
            </dd>
            <dt className="text-xs sm:text-sm text-gray-400">{it.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}
