'use client';

import { API_URL } from '@/lib/config';

import { useState, useEffect } from 'react';
import { Music, Disc } from 'lucide-react';

interface MediaItem {
  id: string | number;
  title: string;
  artist: string | null;
  type: string;
  duration: number | null;
}

export default function MediaCatalog() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = API_URL;

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${apiUrl}/media`);
        if (res.ok) {
          const data = await res.json();
          // Garante que extraímos o array independentemente de vir direto ou dentro de um objeto { media: [...] }
          const rawList = Array.isArray(data) ? data : (data.media || data.items || []);
          setMediaList(Array.isArray(rawList) ? rawList : []);
        }
      } catch (err) {
        console.error('Erro ao carregar acervo:', err);
        setMediaList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [apiUrl]);

  if (loading) {
    return <div className="text-center text-gray-500 py-12">Carregando acervo do banco de dados...</div>;
  }

  if ((mediaList || []).length === 0) {
    return <div className="text-center text-gray-500 py-12">Nenhum áudio cadastrado no banco ainda.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {(mediaList || []).map((item) => (
        <div key={item.id} className="border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-6 rounded-3xl transition-all duration-300 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-600/10 border border-red-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 text-red-500">
            <Music className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-base truncate">{item.title}</h4>
            <p className="text-xs text-gray-400 truncate">{item.artist || 'Artista Desconhecido'} • <span className="uppercase text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">{item.type}</span></p>
          </div>
        </div>
      ))}
    </div>
  );
}