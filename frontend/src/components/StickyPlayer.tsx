'use client';

import { useEffect, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { usePlayer } from './PlayerContext';

/**
 * Barra fixa no rodapé. Aparece quando o card do player sai da tela,
 * então quem desce a página continua com play, música atual e volume à mão.
 */
export default function StickyPlayer({ watchId = 'player' }: { watchId?: string }) {
  const { nowPlaying, isPlaying, loading, volume, muted, toggle, setVolume, toggleMute } = usePlayer();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = document.getElementById(watchId);
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [watchId]);

  return (
    <div
      data-section="barra-player"
      aria-hidden={!visible}
      className={`fixed bottom-0 inset-x-0 z-50 transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}
    >
      <div className="mx-auto max-w-5xl px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3 bg-[#0c0c10]/95 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-2.5 shadow-2xl shadow-black/60">
          <button
            onClick={toggle}
            tabIndex={visible ? 0 : -1}
            aria-label={isPlaying ? 'Pausar a rádio' : 'Ouvir a rádio ao vivo'}
            className="w-11 h-11 flex-shrink-0 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <a href="#player" tabIndex={visible ? 0 : -1} className="min-w-0 flex-1 leading-tight">
            <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-red-500 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full bg-red-500 ${isPlaying ? 'animate-pulse' : ''}`} /> Antena Rock ao vivo
            </span>
            <span className="block text-sm font-bold text-white truncate">{nowPlaying.title}</span>
            <span className="block text-xs text-gray-400 truncate">{nowPlaying.artist}</span>
          </a>

          <button
            onClick={toggleMute}
            tabIndex={visible ? 0 : -1}
            aria-label={muted ? 'Ativar som' : 'Silenciar'}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center text-gray-300 hover:text-white cursor-pointer"
          >
            {muted || volume === 0 ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            tabIndex={visible ? 0 : -1}
            aria-label="Volume"
            className="hidden sm:block w-24 accent-red-600 cursor-pointer h-1 mr-2"
          />
        </div>
      </div>
    </div>
  );
}
