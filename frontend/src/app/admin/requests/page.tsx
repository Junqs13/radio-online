'use client';

import { useState, useEffect, useCallback } from 'react';
import { Radio, Music, User, Clock, RefreshCw, Check, X, Trash2, Search } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';

interface MediaRef {
  id: number;
  title: string;
  artist: string | null;
}

interface SongRequest {
  id: number;
  track_title: string;
  listener_name: string;
  status: 'pending' | 'queued' | 'sent' | 'played' | 'rejected';
  created_at: string;
  played_at: string | null;
  media: MediaRef | null;
}

const STATUS: Record<SongRequest['status'], { label: string; cls: string }> = {
  pending: { label: 'Aguardando você', cls: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30' },
  queued: { label: 'Na fila', cls: 'bg-blue-500/10 text-blue-300 border-blue-500/30' },
  sent: { label: 'Tocando agora', cls: 'bg-red-500/10 text-red-300 border-red-500/30' },
  played: { label: 'Tocou', cls: 'bg-green-500/10 text-green-300 border-green-500/30' },
  rejected: { label: 'Recusado', cls: 'bg-white/5 text-gray-400 border-white/10' },
};

/** Busca no acervo para o locutor escolher qual faixa atende um pedido. */
function MediaPicker({ initial, onPick }: { initial: string; onPick: (m: MediaRef) => void }) {
  const [q, setQ] = useState(initial);
  const [results, setResults] = useState<MediaRef[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`${API_URL}/requests/search?q=${encodeURIComponent(q)}`).catch(() => null);
      if (res?.ok) setResults((await res.json()).results ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar no acervo"
          className="w-full bg-black/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          autoFocus
        />
      </div>
      {results.length === 0 ? (
        <p className="text-xs text-gray-400">Nada encontrado. Tente outra palavra.</p>
      ) : (
        <ul className="space-y-1">
          {results.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => onPick(m)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/5 cursor-pointer"
              >
                {m.title} <span className="text-gray-400">· {m.artist || 'Artista desconhecido'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_URL}/requests`);
      if (res.ok) setRequests((await res.json()).requests ?? []);
    } catch (err) {
      console.error('Erro ao buscar pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10_000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const act = async (url: string, init: RequestInit, ok: string) => {
    const res = await apiFetch(url, init);
    const data = await res.json().catch(() => ({}));
    setNotice(res.ok ? ok : data.error || 'Não foi possível concluir.');
    setTimeout(() => setNotice(''), 5000);
    fetchRequests();
  };

  const queue = (id: number, mediaItemId: number) =>
    act(
      `${API_URL}/requests/${id}/queue`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mediaItemId }) },
      'Pedido colocado na fila do Auto-DJ.',
    ).then(() => setPicking(null));

  const pending = requests.filter((r) => r.status === 'pending');
  const others = requests.filter((r) => r.status !== 'pending');

  const Card = (req: SongRequest) => (
    <div key={req.id} className="border border-white/10 bg-white/[0.02] p-5 rounded-2xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-white truncate">{req.track_title}</h3>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> {req.listener_name || 'Ouvinte anônimo'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(req.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </span>
              {req.media && <span className="text-gray-300">Acervo: {req.media.artist} - {req.media.title}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${STATUS[req.status].cls}`}>{STATUS[req.status].label}</span>
          {req.status === 'pending' && (
            <>
              <button
                onClick={() => (req.media ? queue(req.id, req.media.id) : setPicking(picking === req.id ? null : req.id))}
                className="bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-4 h-4" /> {req.media ? 'Pôr na fila' : 'Escolher faixa'}
              </button>
              <button
                onClick={() => act(`${API_URL}/requests/${req.id}/reject`, { method: 'POST' }, 'Pedido recusado.')}
                aria-label="Recusar pedido"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 px-3 py-2 rounded-lg text-xs cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {req.status !== 'pending' && req.status !== 'sent' && (
            <button
              onClick={() => act(`${API_URL}/requests/${req.id}`, { method: 'DELETE' }, 'Pedido apagado.')}
              aria-label="Apagar pedido"
              className="text-gray-500 hover:text-red-400 p-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      {picking === req.id && <MediaPicker initial={req.track_title} onPick={(m) => queue(req.id, m.id)} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider">Pedidos dos ouvintes</h1>
              <p className="text-xs text-gray-400">
                Pedidos de músicas do acervo entram na fila sozinhos. Os outros esperam você escolher a faixa ou recusar.
              </p>
            </div>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atualizar
          </button>
        </header>

        {notice && <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm" role="status">{notice}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Carregando pedidos...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-3xl text-gray-400 text-sm">Nenhum pedido ainda.</div>
        ) : (
          <>
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-yellow-300 font-bold">Aguardando você ({pending.length})</h2>
              {pending.length === 0 ? <p className="text-sm text-gray-400">Nada pendente.</p> : pending.map(Card)}
            </section>
            <section className="space-y-3">
              <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">Fila e histórico</h2>
              {others.map(Card)}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
