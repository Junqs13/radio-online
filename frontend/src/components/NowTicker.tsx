'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/config';

interface Played {
  title: string;
  artist: string | null;
  playedAt: string;
  request: boolean;
}

/**
 * Letreiro que corre com as últimas músicas que tocaram na rádio.
 * Para quando o mouse passa por cima. Com "menos movimento" ligado no sistema,
 * fica parado e dá para rolar com o dedo.
 */
export default function NowTicker() {
  const [items, setItems] = useState<Played[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/stream/history?limit=14`);
        if (res.ok) setItems((await res.json()).history ?? []);
      } catch {
        /* sem conexão: mantém o que já estava */
      }
    };
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  if (items.length < 4) return null;

  // Duas cópias seguidas: quando a primeira termina de passar, a segunda está no mesmo lugar
  const row = (copy: number) =>
    items.map((t, i) => (
      <li key={`${copy}-${i}`} className="flex items-center gap-3 pr-8 whitespace-nowrap" aria-hidden={copy === 1 || undefined}>
        <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-red-600 to-purple-600 flex-shrink-0" />
        <span className="text-white font-semibold">{t.artist || 'Antena Rock'}</span>
        <span className="text-gray-400">{t.title}</span>
        {t.request && <span className="text-[10px] uppercase tracking-widest text-red-300 border border-red-500/40 rounded-full px-2 py-0.5">pedido</span>}
      </li>
    ));

  return (
    <div className="ticker relative border-y border-white/10 bg-white/[0.02] py-3 overflow-x-auto motion-safe:overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Músicas que tocaram há pouco">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#050507] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#050507] to-transparent z-10" />
      <span className="absolute left-0 inset-y-0 z-20 hidden sm:flex items-center pl-6 pr-4 bg-[#050507] shadow-[20px_0_20px_#050507] text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold">
        Tocou agora há pouco
      </span>
      <ul className="ticker-track text-sm">
        {row(0)}
        {row(1)}
      </ul>
    </div>
  );
}
