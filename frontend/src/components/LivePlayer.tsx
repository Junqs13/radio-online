'use client';

import { API_URL, STREAM_URL } from '@/lib/config';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Music, Users } from 'lucide-react';

export default function LivePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [nowPlaying, setNowPlaying] = useState({ title: 'Carregando...', artist: 'Antena Rock', listeners: 0 });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const apiUrl = API_URL;
  // URL pública do stream (mount /live.mp3 do Icecast)
  const streamUrl = STREAM_URL;

  // Buscar metadados em tempo real (Now Playing) a cada 10 segundos
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`${apiUrl}/stream/now-playing`);
        if (res.ok) {
          const data = await res.json();
          setNowPlaying({
            title: data.title || 'Antena Rock ao vivo',
            artist: data.artist || 'Antena Rock',
            listeners: data.listeners || 0,
          });
        }
      } catch (err) {
        console.error('Erro ao atualizar metadados:', err);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 10000);
    return () => clearInterval(interval);
  }, [apiUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    if (isPlaying) {
      // Em rádio ao vivo, pausar = desconectar. Senão o navegador continua baixando
      // e, ao dar play de novo, toca o áudio atrasado que ficou no buffer.
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      setIsPlaying(false);
    } else {
      audio.src = `${streamUrl}?t=${Date.now()}`; // parâmetro evita cache de conexão antiga
      audio.volume = volume;
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error('Erro ao reproduzir stream:', err);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  return (
    <div className="w-full bg-black/60 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
      
      {/* Elemento de Áudio Oculto */}
      <audio ref={audioRef} preload="none" />

      {/* Info da Música Atual (Now Playing) */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
          isPlaying ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 animate-pulse' : 'bg-white/5 border border-white/10 text-gray-400'
        }`}>
          {isPlaying ? <Radio className="w-7 h-7" /> : <Music className="w-7 h-7" />}
        </div>
        
        <div className="space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            <span className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Ao vivo 24h</span>
            <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400 flex items-center gap-1">
              <Users className="w-3 h-3" /> {nowPlaying.listeners} ouvintes
            </span>
          </div>
          <h3 className="text-sm font-black text-white truncate max-w-xs sm:max-w-md">{nowPlaying.title}</h3>
          <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-md">{nowPlaying.artist}</p>
        </div>
      </div>

      {/* Controlos do Player (Play/Pause e Volume) */}
      <div className="flex items-center gap-4 w-full md:w-auto justify-end">
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-all transform hover:scale-105 cursor-pointer"
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
        </button>

        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
          <button onClick={toggleMute} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-20 accent-red-600 cursor-pointer h-1 bg-white/20 rounded-lg"
          />
        </div>
      </div>

    </div>
  );
}