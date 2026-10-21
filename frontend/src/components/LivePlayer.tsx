'use client';

import { Play, Pause, Volume2, VolumeX, Users, Disc, Loader2 } from 'lucide-react';
import { usePlayer } from './PlayerContext';

/** Card principal: player e "o que toca agora" juntos. */
export default function LivePlayer() {
  const { nowPlaying, isPlaying, loading, volume, muted, toggle, setVolume, toggleMute } = usePlayer();

  return (
    <div className="w-full border border-white/10 bg-gradient-to-br from-white/[0.05] to-black/60 backdrop-blur-2xl rounded-[2rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -right-16 -bottom-16 opacity-[0.04] pointer-events-none">
        <Disc className={`w-72 h-72 ${isPlaying ? 'animate-spin-slow' : ''}`} />
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-3 mb-5">
        <span className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full text-red-500 text-[10px] font-bold tracking-widest uppercase">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" /> Ao vivo agora
        </span>
        <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-full text-gray-400 flex items-center gap-1">
          <Users className="w-3 h-3" /> {nowPlaying.listeners} {nowPlaying.listeners === 1 ? 'ouvinte' : 'ouvintes'}
        </span>
        {nowPlaying.program && (
          <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-full text-gray-300">
            {nowPlaying.program.title} · {nowPlaying.program.startTime} às {nowPlaying.program.endTime}
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <button
          onClick={toggle}
          aria-label={isPlaying ? 'Pausar a rádio' : 'Ouvir a rádio ao vivo'}
          className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-3xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform hover:scale-105 cursor-pointer self-start sm:self-auto"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8 fill-current" />
          ) : (
            <Play className="w-8 h-8 fill-current ml-1" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs uppercase tracking-[0.25em] text-gray-500 font-bold">O que toca agora</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight truncate" title={nowPlaying.title}>
            {nowPlaying.title}
          </h2>
          <p className="text-sm uppercase tracking-[0.15em] text-red-400 font-bold truncate">{nowPlaying.artist}</p>
          {!isPlaying && <p className="text-xs text-gray-500 pt-1">Aperte o play para ouvir.</p>}
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl flex-shrink-0">
          <button onClick={toggleMute} aria-label={muted ? 'Ativar som' : 'Silenciar'} className="text-gray-400 hover:text-white cursor-pointer">
            {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-label="Volume"
            className="w-24 accent-red-600 cursor-pointer h-1"
          />
        </div>
      </div>
    </div>
  );
}
