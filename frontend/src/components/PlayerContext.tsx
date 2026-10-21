'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { API_URL, STREAM_URL } from '@/lib/config';
import { track, onLeave } from '@/lib/analytics';

export interface NowPlaying {
  title: string;
  artist: string;
  listeners: number;
  online: boolean;
  program: { title: string; startTime: string; endTime: string } | null;
}

interface PlayerState {
  nowPlaying: NowPlaying;
  isPlaying: boolean;
  loading: boolean;
  volume: number;
  muted: boolean;
  toggle: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer precisa estar dentro de <PlayerProvider>');
  return ctx;
}

/**
 * Um único <audio> para o site inteiro. O card ao vivo e a barra fixa do rodapé
 * controlam o mesmo som, então dar play em um aparece no outro.
 */
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlaying>({
    title: 'Conectando...',
    artist: 'Antena Rock',
    listeners: 0,
    online: true,
    program: null,
  });

  // Música atual, ouvintes e programa no ar, a cada 10 segundos
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/stream/now-playing`);
        if (!res.ok || !alive) return;
        const d = await res.json();
        setNowPlaying({
          title: d.title || 'Antena Rock ao vivo',
          artist: d.artist || 'Antena Rock',
          listeners: d.listeners || 0,
          online: d.online !== false,
          program: d.program ?? null,
        });
      } catch {
        /* sem conexão: mantém o que já estava na tela */
      }
    };
    load();
    const t = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // Tempo ouvindo, para as estatísticas: conta desde o play e manda em pedaços
  const listenFrom = useRef<number | null>(null);
  const reportListen = useCallback(() => {
    if (listenFrom.current === null) return;
    const secs = Math.round((Date.now() - listenFrom.current) / 1000);
    if (secs > 0) track('listen', undefined, { value: secs, section: 'player' });
    listenFrom.current = Date.now();
  }, []);
  useEffect(() => {
    onLeave(reportListen);
    const t = setInterval(reportListen, 60_000);
    return () => clearInterval(t);
  }, [reportListen]);
  const nowPlayingRef = useRef('');

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (listenFrom.current !== null) {
      reportListen();
      listenFrom.current = null;
      track('pause', nowPlayingRef.current, { section: 'player' });
    }
    // Em rádio ao vivo, pausar = desconectar. Senão o navegador segue baixando
    // e, no próximo play, toca o áudio atrasado que ficou guardado.
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    setIsPlaying(false);
    setLoading(false);
  }, [reportListen]);

  const start = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = `${STREAM_URL}?t=${Date.now()}`;
    audio.volume = volume;
    audio.muted = muted;
    setLoading(true);
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        listenFrom.current = Date.now();
        track('play', nowPlayingRef.current, { section: 'player' });
      })
      .catch(() => setIsPlaying(false))
      .finally(() => setLoading(false));
  }, [volume, muted]);

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const toggle = useCallback(() => (isPlayingRef.current ? stop() : start()), [start, stop]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
    if (v > 0 && audioRef.current?.muted) {
      audioRef.current.muted = false;
      setMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (audioRef.current) audioRef.current.muted = !m;
      return !m;
    });
  }, []);

  // Se a conexão cair, o botão volta para "play" em vez de ficar mentindo que está tocando
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onError = () => {
      if (listenFrom.current !== null) {
        reportListen();
        listenFrom.current = null; // conexão caiu: para de contar tempo ouvindo
      }
      if (audio.getAttribute('src')) setIsPlaying(false);
      setLoading(false);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    return () => {
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
    };
  }, [reportListen]);

  // Tela bloqueada, fone Bluetooth, central do carro e CarPlay: nome da música e play/pause
  const toggleRef = useRef(toggle);
  toggleRef.current = toggle;
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const play = () => { if (!isPlayingRef.current) toggleRef.current(); };
    const pause = () => { if (isPlayingRef.current) toggleRef.current(); };
    const actions: [MediaSessionAction, MediaSessionActionHandler][] = [['play', play], ['pause', pause], ['stop', pause]];
    for (const [a, h] of actions) {
      try { ms.setActionHandler(a, h); } catch { /* ação não suportada neste navegador */ }
    }
    return () => {
      for (const [a] of actions) {
        try { ms.setActionHandler(a, null); } catch { /* idem */ }
      }
    };
  }, []);

  useEffect(() => {
    nowPlayingRef.current = `${nowPlaying.artist} - ${nowPlaying.title}`;
  }, [nowPlaying.artist, nowPlaying.title]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: nowPlaying.title,
      artist: nowPlaying.artist,
      album: 'Antena Rock',
      artwork: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    });
  }, [nowPlaying.title, nowPlaying.artist]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  return (
    <PlayerContext.Provider value={{ nowPlaying, isPlaying, loading, volume, muted, toggle, setVolume, toggleMute }}>
      <audio ref={audioRef} preload="none" />
      {children}
    </PlayerContext.Provider>
  );
}
