'use client';

import { useEffect, useState } from 'react';
import { usePlayer } from './PlayerContext';

const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

/** Hora de Brasília com os dois-pontos piscando e o programa que está no ar */
export function HeaderClock({ className = '' }: { className?: string }) {
  const { nowPlaying } = usePlayer();
  const [now, setNow] = useState<[string, string] | null>(null);

  useEffect(() => {
    const tick = () => {
      const [h, m] = fmt.format(new Date()).split(':');
      setNow([h, m]);
    };
    tick();
    const t = setInterval(tick, 5_000);
    return () => clearInterval(t);
  }, []);

  const program = nowPlaying.program?.title;
  return (
    <div className={`flex items-center gap-2.5 text-[11px] uppercase tracking-widest text-gray-400 ${className}`} title="Horário de Brasília">
      <span className="font-brand text-sm text-[#F4EDE0] tabular-nums tracking-[0.12em]" aria-label={now ? `${now[0]} horas e ${now[1]} minutos` : undefined}>
        {now ? now[0] : '--'}
        <span className="clock-colon">:</span>
        {now ? now[1] : '--'}
      </span>
      {program && (
        <span className="hidden min-[1400px]:inline max-w-[13rem] truncate border-l border-white/15 pl-2.5 text-gray-300 normal-case tracking-normal text-xs">
          {program}
        </span>
      )}
    </div>
  );
}

/** Botão de play do topo: as barras se mexem enquanto a rádio toca */
export function HeaderPlay() {
  const { isPlaying, loading, toggle } = usePlayer();
  const state = loading ? 'wait' : isPlaying ? 'on' : '';
  return (
    <button
      onClick={toggle}
      aria-label={isPlaying ? 'Pausar a rádio' : 'Ouvir a rádio ao vivo'}
      aria-pressed={isPlaying}
      className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-semibold uppercase tracking-widest transition-colors cursor-pointer ${
        isPlaying ? 'border-red-500/60 bg-red-600/20 text-red-200' : 'border-white/15 text-gray-200 hover:border-red-500/60 hover:text-white'
      }`}
    >
      <span className={`eq ${state} ${isPlaying ? 'text-red-400' : 'text-gray-400'}`} aria-hidden>
        <i />
        <i />
        <i />
        <i />
      </span>
      {loading ? 'Ligando' : isPlaying ? 'No ar' : 'Ouvir'}
    </button>
  );
}
