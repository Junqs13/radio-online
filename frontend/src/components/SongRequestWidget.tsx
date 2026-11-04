'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Music2, CheckCircle2, Search, Shuffle } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { haptic } from '@/lib/haptics';

interface Result {
  id: number;
  title: string;
  artist: string | null;
}

// Sugestões prontas: cada cartão sorteia uma música dessas pastas do acervo (vazio = acervo inteiro)
const SUGGESTIONS = [
  { label: 'Um clássico nacional', folders: ['Clássicos Nacionais'] },
  { label: 'Volta pros anos 70', folders: ['Rock Anos 70', 'David Bowie'] },
  { label: 'Algo pesado', folders: ['Iron Maiden', 'Megadeth', 'Black Sabbath'] },
  { label: 'Hino de estádio', folders: ['Queen', 'Kiss', 'Def Leppard'] },
  { label: 'Um Elvis', folders: ['Elvis Presley'] },
  { label: 'Me surpreenda', folders: [] as string[] },
];

export default function SongRequestWidget() {
  const [query, setQuery] = useState('');
  const [listenerName, setListenerName] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [chosen, setChosen] = useState<Result | null>(null);
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [drawing, setDrawing] = useState('');
  const [active, setActive] = useState(-1); // item da lista destacado pelas setas do teclado
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Busca no acervo enquanto o ouvinte digita, para ele escolher uma música que existe
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    if (chosen || query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_URL}/requests/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          setResults((await res.json()).results ?? []);
          setActive(-1);
        }
      } catch {
        setResults([]);
      }
    }, 250);
  }, [query, chosen]);

  const choose = (r: Result) => {
    setChosen(r);
    setQuery(`${r.artist ?? ''} - ${r.title}`.replace(/^ - /, ''));
    setResults([]);
    setActive(-1);
  };

  // Setas andam pela lista, Enter escolhe, Esc fecha (como qualquer campo de busca)
  const onSearchKey = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      choose(results[active]);
    } else if (e.key === 'Escape') {
      setResults([]);
      setActive(-1);
    }
  };

  // Toque num cartão: sorteia uma música que pode ser pedida agora e já deixa escolhida
  const suggest = async (label: string, folders: string[]) => {
    setDrawing(label);
    setError('');
    try {
      const res = await fetch(`${API_URL}/requests/random?folders=${encodeURIComponent(folders.join('|'))}`, { cache: 'no-store' });
      const d = await res.json().catch(() => ({}));
      if (res.ok && d.result) choose(d.result);
      else setError('Não achamos uma música livre agora. Tente outro cartão.');
    } catch {
      setError('Sem conexão com a rádio. Tente de novo.');
    } finally {
      setDrawing('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trackTitle: query.trim(), listenerName, mediaItemId: chosen?.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (data.queued) haptic(12); // pedido aceito na fila: vibração curta, junto com a mensagem
        setSent(data.message || 'Pedido enviado!');
        setQuery('');
        setChosen(null);
        setTimeout(() => setSent(''), 6000);
      } else {
        setError(data.error || 'Não foi possível enviar o pedido.');
      }
    } catch {
      setError('Sem conexão com a rádio. Tente de novo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent rounded-3xl p-8 backdrop-blur-xl relative my-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
          <Music2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Peça sua música</h3>
          <p className="text-xs text-gray-400">Digite e escolha uma música do nosso acervo. Ela entra na fila do Auto-DJ.</p>
        </div>
      </div>

      {sent ? (
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2" role="status">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> {sent}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2.5 flex items-center gap-1.5">
              <Shuffle className="w-3.5 h-3.5" /> Sem ideia? Toque num cartão e a gente escolhe
            </p>
            <div className="flex gap-2 overflow-x-auto sm:flex-wrap -mx-1 px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {SUGGESTIONS.map((sug) => (
                <button
                  key={sug.label}
                  type="button"
                  data-track={`Sugestão: ${sug.label}`}
                  onClick={() => suggest(sug.label, sug.folders)}
                  disabled={!!drawing}
                  className={`glass flex-shrink-0 rounded-full px-3.5 py-2 text-xs cursor-pointer disabled:cursor-wait ${
                    drawing === sug.label ? 'is-on text-white motion-safe:animate-pulse' : 'text-gray-200 hover:text-white'
                  }`}
                >
                  {sug.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setChosen(null);
                }}
                onKeyDown={onSearchKey}
                placeholder="Música ou artista"
                aria-label="Música ou artista"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="pedido-resultados"
                aria-autocomplete="list"
                aria-activedescendant={active >= 0 && results[active] ? `pedido-op-${results[active].id}` : undefined}
                autoComplete="off"
                maxLength={200}
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500"
                required
              />
              {results.length > 0 && (
                <ul id="pedido-resultados" className="absolute z-20 mt-2 w-full bg-[#0c0c10] border border-white/10 rounded-xl overflow-hidden shadow-2xl" role="listbox">
                  {results.map((r, i) => (
                    <li
                      key={r.id}
                      id={`pedido-op-${r.id}`}
                      role="option"
                      aria-selected={i === active}
                      onPointerDown={(e) => e.preventDefault()}
                      onClick={() => choose(r)}
                      onPointerEnter={() => setActive(i)}
                      className={`px-4 py-2.5 text-sm cursor-pointer ${i === active ? 'bg-white/10' : ''}`}
                    >
                      <span className="text-white">{r.title}</span>
                      <span className="text-gray-400"> · {r.artist || 'Artista desconhecido'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <input
              type="text"
              value={listenerName}
              onChange={(e) => setListenerName(e.target.value)}
              placeholder="Seu nome (opcional)"
              aria-label="Seu nome"
              maxLength={80}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500"
            />
          </div>
          {chosen && (
            <p className="text-xs text-gray-400" role="status">
              Escolhida: <span className="text-white">{chosen.title}</span>. Envie, ou toque no cartão de novo para sortear outra.
            </p>
          )}
          {error && <p className="text-xs text-red-400" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="glass glass-red w-full disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4" /> {loading ? 'Enviando...' : 'Enviar pedido'}
          </button>
        </form>
      )}
    </div>
  );
}
