'use client';

import { API_URL, apiFetch } from '@/lib/config';

import { useState, useEffect } from 'react';
import { Radio, Database, Server, Plus, Music, CheckCircle2, ArrowLeft, Users, TrendingUp, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [nowPlaying, setNowPlaying] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [type, setType] = useState('music');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [loading, setLoading] = useState(false);


  const apiUrl = API_URL;

  const loadData = async () => {
    try {
      const resMedia = await apiFetch(`${apiUrl}/media`);
      if (resMedia.ok) {
        const data = await resMedia.json();
        setMediaList(Array.isArray(data.media) ? data.media : []);
      }

      // O health responde 503 quando algum serviço está fora, mas o corpo continua útil
      const resHealth = await apiFetch(`${apiUrl}/health`);
      setHealth(await resHealth.json());

      const resStream = await apiFetch(`${apiUrl}/stream/now-playing`);
      if (resStream.ok) setNowPlaying(await resStream.json());
    } catch (e) {
      console.error('Erro ao carregar dados do admin', e);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000); // Polling a cada 5s
    return () => clearInterval(interval);
  }, [apiUrl]);

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setUploadError('Escolha um arquivo de áudio.');
      return;
    }
    setLoading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('audioFile', audioFile);
      formData.append('title', title);
      formData.append('artist', artist);
      formData.append('type', type);

      const res = await apiFetch(`${apiUrl}/media/upload`, { method: 'POST', body: formData });
      if (res.ok) {
        setTitle('');
        setArtist('');
        setAudioFile(null);
        (e.target as HTMLFormElement).reset();
        loadData();
      } else {
        const data = await res.json().catch(() => ({}));
        setUploadError(data.error || 'Erro ao enviar o arquivo.');
      }
    } catch (e) {
      console.error('Erro ao adicionar mídia', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-12 font-sans">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
            <Radio className="text-white w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="font-black tracking-widest text-lg">ANTENA ROCK <span className="text-red-500">ADMIN</span></h1>
            <p className="text-xs text-gray-400">Dashboard de Métricas e Controle de Programação</p>
          </div>
        </div>
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors bg-white/5 border border-white/10 px-4 py-2 rounded-full">
          <ArrowLeft className="w-4 h-4" /> Voltar para a Rádio
        </Link>
      </div>

      {/* MÉTRICAS EM TEMPO REAL (DASHBOARD) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="border border-white/10 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Ouvintes Conectados</p>
            <h3 className="text-3xl font-black">{nowPlaying?.listeners ?? 0} <span className="text-xs font-normal text-green-400">AO VIVO</span></h3>
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Faixas no acervo</p>
            <h3 className="text-3xl font-black">{mediaList.length}</h3>
          </div>
        </div>

        <div className="border border-white/10 bg-white/[0.02] p-6 rounded-3xl backdrop-blur-xl flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">Status Geral</p>
            <h3 className="text-xl font-bold text-green-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-4 h-4" /> {health?.status || 'Online'}
            </h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA 1 & 2: ACERVO E GRADE DE PROGRAMAÇÃO */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* NO AR AGORA */}
          <div className="border border-white/10 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-xl space-y-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-red-500" /> No ar agora
            </h2>
            <p className="text-sm text-white font-bold">{nowPlaying?.artist ? `${nowPlaying.artist} - ` : ''}{nowPlaying?.title ?? '...'}</p>
            <p className="text-xs text-gray-400">
              {nowPlaying?.program
                ? `Programa: ${nowPlaying.program.title} (${nowPlaying.program.startTime} - ${nowPlaying.program.endTime})`
                : 'Sem programa neste horário: Auto-DJ com o acervo inteiro.'}
            </p>
            <Link href="/admin/schedule" className="inline-block text-xs text-red-400 underline">Abrir a grade</Link>
          </div>

          {/* CADASTRO DE MÍDIA */}
          <div className="border border-white/10 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-500" /> Cadastrar Nova Faixa / Spot
            </h2>
            <form onSubmit={handleAddMedia} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Título da Faixa</label>
                  <input 
                    type="text" 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Vazio = usa a tag do arquivo" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Artista / Autor</label>
                  <input 
                    type="text" 
                    value={artist} 
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Vazio = usa a tag do arquivo" 
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Arquivo de Áudio</label>
                  <input
                    type="file"
                    accept=".mp3,.ogg,.flac,.wav,.m4a,.aac"
                    onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-gray-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-red-600 file:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500"
                  >
                    <option value="music">Música</option>
                    <option value="jingle">Vinheta</option>
                    <option value="spot">Spot / Comercial</option>
                  </select>
                </div>
              </div>
              {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/30"
              >
                {loading ? 'Salvando...' : 'Adicionar ao Acervo'}
              </button>
            </form>
          </div>

        </div>

        {/* COLUNA 3: ACERVO E SAÚDE DO SISTEMA */}
        <div className="space-y-8">
          
          <div className="border border-white/10 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-xl space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Server className="w-5 h-5 text-red-500" /> Saúde dos Containers
            </h2>
            
            {health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-xs text-gray-400">Banco de Dados</span>
                  <span className="text-xs font-semibold text-white">{health.services?.database}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-xs text-gray-400">Antena Icecast</span>
                  <span className="text-xs font-semibold text-white">{health.services?.streaming_antenna}</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <span className="text-xs text-gray-400">Motor Scheduler</span>
                  <span className="text-xs font-semibold text-white">{health.services?.scheduler_engine}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Carregando métricas...</p>
            )}
          </div>

          <div className="border border-white/10 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-xl">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-red-500" /> Acervo ({mediaList.length})
            </h2>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {mediaList.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-red-500" />
                    <div>
                      <h4 className="font-bold text-xs truncate max-w-[120px]">{item.title}</h4>
                      <p className="text-[10px] text-gray-400">{item.artist || 'Desconhecido'}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}