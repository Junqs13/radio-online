'use client';

import { API_URL, apiFetch } from '@/lib/config';

import { useState, useEffect } from 'react';
import { Disc, Upload, Music, Radio, CheckCircle2, AlertCircle } from 'lucide-react';

interface MediaItem {
  id: number;
  title: string;
  filename: string;
  type: string;
  duration: number;
  programId?: number;
  artist?: string | null;
  category?: string | null;
  enabled?: boolean;
  playCount?: number;
  lastPlayedAt?: string | null;
  createdAt: string;
}

interface Program {
  id: number;
  title: string;
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const apiUrl = API_URL;
  const [filter, setFilter] = useState('');

  const norm = (t: string) => t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const visible = (mediaList || []).filter((m) =>
    norm(`${m.artist ?? ''} ${m.title} ${m.category ?? ''}`).includes(norm(filter)),
  );

  // Muda tipo ou tira/volta a faixa da rotação; atualiza a tela sem recarregar tudo
  const updateItem = async (id: number, data: { type?: string; enabled?: boolean }) => {
    const res = await apiFetch(`${apiUrl}/media/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) setMediaList((list) => list.map((m) => (m.id === id ? { ...m, ...data } : m)));
  };

  const fetchData = async () => {
    try {
      const [mediaRes, progRes] = await Promise.all([
        apiFetch(`${apiUrl}/media`),
        apiFetch(`${apiUrl}/schedule/programs`)
      ]);

      if (mediaRes.ok) {
        const mediaData = await mediaRes.json();
        // Garante que o estado recebe sempre um array seguro
        const rawMedia = mediaData.media || mediaData;
        setMediaList(Array.isArray(rawMedia) ? rawMedia : []);
      }

      if (progRes.ok) {
        const progData = await progRes.json();
        setPrograms(progData.programs || []);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do acervo ou programas:', err);
      setMediaList([]);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl]);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setUploading(true);
    setMessage(null);

    try {
      const res = await apiFetch(`${apiUrl}/media/upload`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setMessage({ text: 'Áudio enviado para o acervo.', type: 'success' });
        form.reset();
        fetchData();
      } else {
        setMessage({ text: 'Erro ao enviar o arquivo.', type: 'error' });
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setMessage({ text: 'Erro de conexão com o servidor.', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-8 lg:p-16">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Cabeçalho */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/10 pb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider">Acervo e Auto-DJ</h1>
              <p className="text-xs text-gray-400">Envie áudios, marque vinhetas e tire faixas da rotação. Arquivos copiados direto para a pasta storage entram sozinhos em até 5 minutos.</p>
            </div>
          </div>
        </header>

        {/* SECÇÃO DE UPLOAD COM SELETOR DE PROGRAMAS */}
        <section className="border border-white/10 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl space-y-6">
          <h2 className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold flex items-center gap-2">
            <Upload className="w-4 h-4" /> Enviar áudio
          </h2>

          {message && (
            <div className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpload} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input 
              type="text" 
              name="title" 
              placeholder="Título (vazio = usa a tag do arquivo)" 
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500 text-white placeholder-gray-500"
            />

            {/* SELETOR DE PROGRAMAS COM PROTEÇÃO (programs || []) */}
            <select 
              name="programId" 
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-red-500 text-white cursor-pointer"
            >
              <option value="">Sem programa (rotação geral)</option>
              {(programs || []).map((prog) => (
                <option key={prog.id} value={prog.id} className="bg-[#050507] text-white">
                  {prog.title}
                </option>
              ))}
            </select>

            <input 
              type="file" 
              name="audioFile" 
              accept=".mp3,.ogg,.flac,.wav,.m4a,.aac"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer"
              required
            />

            <button 
              type="submit" 
              disabled={uploading}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" /> {uploading ? 'Enviando...' : 'Enviar Áudio'}
            </button>
          </form>
        </section>

        {/* LISTAGEM DO ACERVO */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">
              Acervo ({(mediaList || []).length} faixas)
            </h2>
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filtrar por artista, música ou pasta"
              aria-label="Filtrar acervo"
              className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 sm:w-80"
            />
          </div>

          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando acervo...</div>
          ) : visible.length === 0 ? (
            <div className="text-center py-16 border border-white/5 rounded-3xl text-gray-400 text-sm">
              Nenhuma faixa encontrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2">
              {visible.map((item) => (
                <div
                  key={item.id}
                  className={`border border-white/10 bg-white/[0.02] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${item.enabled === false ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
                      <Music className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
                      <p className="text-xs text-gray-400 truncate">
                        {item.artist || 'Artista desconhecido'} · {item.category || 'Sem pasta'} · tocou {item.playCount ?? 0}x
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={item.type}
                      onChange={(e) => updateItem(item.id, { type: e.target.value })}
                      aria-label="Tipo da faixa"
                      className="bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white cursor-pointer"
                    >
                      <option value="music" className="bg-[#050507]">Música</option>
                      <option value="jingle" className="bg-[#050507]">Vinheta</option>
                      <option value="spot" className="bg-[#050507]">Spot</option>
                    </select>
                    <button
                      onClick={() => updateItem(item.id, { enabled: item.enabled === false })}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer ${item.enabled === false ? 'border-white/10 text-gray-400' : 'border-green-500/30 text-green-300 bg-green-500/10'}`}
                    >
                      {item.enabled === false ? 'Fora da rotação' : 'Na rotação'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}