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

  // Quer dizer "a pessoa mandou tocar e não mandou parar". Enquanto for true, a rádio
  // reconecta sozinha se a internet cair, travar ou o servidor reiniciar.
  const wantPlay = useRef(false);
  const switching = useRef(false); // trocando a conexão: ignora o "pause" que o navegador dispara
  const retries = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const clearRetry = () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
    retryTimer.current = null;
  };

  // Fecha a conta do tempo ouvindo quando o som para por qualquer motivo
  const pauseListen = useCallback(() => {
    if (listenFrom.current === null) return;
    reportListen();
    listenFrom.current = null;
  }, [reportListen]);

  const connectRef = useRef<(retry: boolean) => void>(() => {});

  // Espera 1, 2, 4, 8, 15 e depois 30 s entre as tentativas, até a pessoa apertar pause
  const scheduleRetry = useCallback(() => {
    if (!wantPlay.current) return;
    clearRetry();
    const delays = [1, 2, 4, 8, 15, 30];
    const wait = delays[Math.min(retries.current, delays.length - 1)] * 1000;
    retries.current += 1;
    setLoading(true);
    retryTimer.current = setTimeout(() => connectRef.current(true), wait);
  }, []);

  const connect = useCallback(
    (retry: boolean) => {
      const audio = audioRef.current;
      if (!audio || !wantPlay.current) return;
      clearRetry();
      switching.current = true;
      // Endereço novo a cada conexão: o navegador não reaproveita áudio velho guardado
      audio.src = `${STREAM_URL}?t=${Date.now()}`;
      audio.volume = volumeRef.current;
      audio.muted = mutedRef.current;
      setLoading(true);
      audio
        .play()
        .then(() => {
          switching.current = false;
          retries.current = 0;
          setIsPlaying(true);
          setLoading(false);
          if (listenFrom.current === null) listenFrom.current = Date.now();
          if (!retry) track('play', nowPlayingRef.current, { section: 'player' });
        })
        .catch((err: unknown) => {
          switching.current = false;
          const name = err instanceof DOMException ? err.name : '';
          if (name === 'AbortError') return; // outra conexão começou por cima desta
          if (name === 'NotAllowedError') {
            // O navegador exige um toque da pessoa (comum depois de ficar em segundo plano)
            wantPlay.current = false;
            setIsPlaying(false);
            setLoading(false);
            return;
          }
          scheduleRetry();
        });
    },
    [scheduleRetry],
  );
  connectRef.current = connect;

  const stop = useCallback(() => {
    const audio = audioRef.current;
    wantPlay.current = false;
    clearRetry();
    retries.current = 0;
    if (listenFrom.current !== null) {
      pauseListen();
      track('pause', nowPlayingRef.current, { section: 'player' });
    }
    if (!audio) return;
    // Em rádio ao vivo, pausar = desconectar. Senão o navegador segue baixando
    // e, no próximo play, toca o áudio atrasado que ficou guardado.
    switching.current = true;
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    switching.current = false;
    setIsPlaying(false);
    setLoading(false);
  }, [pauseListen]);

  const start = useCallback(() => {
    wantPlay.current = true;
    retries.current = 0;
    connect(false);
  }, [connect]);

  const toggle = useCallback(() => (wantPlay.current ? stop() : start()), [start, stop]);

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

  // Quedas e travadas: reconecta sozinha. Interrupção por outro app: mostra pausado.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const lost = () => {
      if (switching.current || !audio.getAttribute('src')) return;
      pauseListen();
      if (wantPlay.current) scheduleRetry();
      else {
        setIsPlaying(false);
        setLoading(false);
      }
    };

    // Ligação, áudio do WhatsApp, GPS falando ou outro app de música tomou o som.
    // Não volta sozinha para não brigar com o outro app; o play da tela, do fone
    // ou do carro reconecta na hora.
    const onPause = () => {
      if (switching.current || !wantPlay.current) return;
      wantPlay.current = false;
      clearRetry();
      pauseListen();
      setIsPlaying(false);
      setLoading(false);
    };

    let waitingSince = 0;
    const onWaiting = () => {
      waitingSince = Date.now();
      setLoading(true);
    };
    const onPlaying = () => {
      waitingSince = 0;
      setLoading(false);
      setIsPlaying(true);
      if (listenFrom.current === null) listenFrom.current = Date.now();
    };

    // Vigia: se o som parou de andar há 10 s (rede presa sem dar erro), troca a conexão
    let lastTime = -1;
    let stuckSince = 0;
    const watchdog = setInterval(() => {
      if (!wantPlay.current || switching.current || retryTimer.current || audio.paused) {
        stuckSince = 0;
        return;
      }
      const t = audio.currentTime;
      const moving = t !== lastTime;
      lastTime = t;
      if (moving && !waitingSince) {
        stuckSince = 0;
        return;
      }
      if (!stuckSince) stuckSince = Date.now();
      if (Date.now() - stuckSince > 10_000) {
        stuckSince = 0;
        pauseListen();
        connectRef.current(true);
      }
    }, 2_000);

    // Voltou a internet ou a pessoa voltou para a aba: se era para estar tocando, reconecta já
    const revive = () => {
      if (!wantPlay.current) return;
      if (retryTimer.current || audio.paused || audio.error) {
        retries.current = 0;
        connectRef.current(true);
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && revive();

    audio.addEventListener('error', lost);
    audio.addEventListener('ended', lost);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('playing', onPlaying);
    window.addEventListener('online', revive);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(watchdog);
      audio.removeEventListener('error', lost);
      audio.removeEventListener('ended', lost);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('playing', onPlaying);
      window.removeEventListener('online', revive);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [pauseListen, scheduleRetry]);

  // Tela bloqueada, fone Bluetooth, central do carro e CarPlay: nome da música e play/pause.
  // O play daqui sempre abre uma conexão nova, então funciona mesmo depois de uma interrupção.
  const startRef = useRef(start);
  startRef.current = start;
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const play = () => {
      // Algumas centrais de carro mandam "play" repetido: se já está tocando, não reconecta
      if (wantPlay.current && audioRef.current && !audioRef.current.paused) return;
      startRef.current();
    };
    const pause = () => stopRef.current();
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
