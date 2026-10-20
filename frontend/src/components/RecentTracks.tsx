'use client';

import { useState, useEffect } from 'react';
import { History, Disc, Heart } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface Played {
  title: string;
  artist: string | null;
  playedAt: string;
  request: boolean;
}

function ago(iso: string) {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return `há ${h} h`;
}

export default function RecentTracks() {
  const [history, setHistory] = useState<Played[] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_URL}/stream/history?limit=6`);
        // A primeira linha é a faixa que está tocando agora (já aparece no card "O que toca")
        if (res.ok) setHistory(((await res.json()).history ?? []).slice(1, 6));
      } catch {
        /* sem conexão: mantém o que já estava na tela */
      }
    };
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  // Sem histórico ainda (rádio acabou de subir): não mostra a seção
  if (!history || history.length === 0) return null;

  return (
    <div className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl p-8 backdrop-blur-xl">
      <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
        <History className="w-5 h-5 text-red-500" /> Últimas tocadas
      </h3>

      <ul className="space-y-3">
        {history.map((track, index) => (
          <li key={`${track.playedAt}-${index}`} className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 flex-shrink-0">
                <Disc className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{track.title}</h4>
                <p className="text-xs text-gray-400 truncate">{track.artist || 'Artista desconhecido'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {track.request && (
                <span className="text-[11px] text-red-300 flex items-center gap-1" title="Pedido de ouvinte">
                  <Heart className="w-3 h-3" /> pedido
                </span>
              )}
              <span className="text-xs text-gray-400">{ago(track.playedAt)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
