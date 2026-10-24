'use client';

import { useCallback, useEffect, useState } from 'react';
import { Heart, Share2, Check, Lightbulb, Shuffle } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import { API_URL } from '@/lib/config';
import { track } from '@/lib/analytics';

interface Curiosity {
  id: number;
  text: string;
  tags: string[];
}

const LAST_KEY = 'ar_curio_last';
const LIKED_KEY = 'ar_curio_liked';

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* navegador sem armazenamento: vale só nesta visita */
  }
};

/** Curiosidade sorteada a cada acesso, no formato de post de rede social com a cara da Antena Rock. */
export default function CuriosityPost() {
  const [fact, setFact] = useState<Curiosity | null>(null);
  const [failed, setFailed] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);
  const [date, setDate] = useState('');

  const load = useCallback(async (exclude?: number) => {
    try {
      const res = await fetch(`${API_URL}/content/curiosity?exclude=${exclude ?? read(LAST_KEY) ?? ''}`, { cache: 'no-store' });
      const d = await res.json();
      if (!d.curiosity) throw new Error();
      setFact(d.curiosity);
      write(LAST_KEY, String(d.curiosity.id)); // na próxima visita não repete esta
    } catch {
      setFailed(true);
    }
  }, []);

  useEffect(() => {
    load();
    setDate(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }));
    try {
      setLiked(JSON.parse(read(LIKED_KEY) || '[]'));
    } catch {
      setLiked([]);
    }
  }, [load]);

  const isLiked = fact ? liked.includes(fact.id) : false;

  const toggleLike = () => {
    if (!fact) return;
    const next = isLiked ? liked.filter((i) => i !== fact.id) : [...liked, fact.id].slice(-200);
    setLiked(next);
    write(LIKED_KEY, JSON.stringify(next));
    if (!isLiked) track('like', fact.text.slice(0, 80), { section: 'curiosidade' });
  };

  const share = async () => {
    if (!fact) return;
    const text = `Curiosidade do rock na Antena Rock: ${fact.text}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    track('share', fact.text.slice(0, 80), { section: 'curiosidade' });
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Antena Rock', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* compartilhamento cancelado */
    }
  };

  if (failed && !fact) return null; // sem conexão com a API: a seção some em vez de ficar vazia

  return (
    <div className="space-y-4" data-section="curiosidade">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-red-500" />
        <h2 className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold">Curiosidade do dia</h2>
      </div>

      <article className="border border-white/10 bg-black/50 rounded-3xl p-5 sm:p-6 backdrop-blur-xl" aria-live="polite">
        <header className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#0B0A10] border border-white/10 flex items-center justify-center flex-shrink-0">
            <BrandMark size={30} simple />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-bold text-white text-sm">Antena Rock</p>
            <p className="text-xs text-gray-500">Sorocaba, SP{date && ` · ${date}`}</p>
          </div>
        </header>

        {fact ? (
          <>
            <p className="mt-4 text-[15px] sm:text-base text-gray-100 leading-relaxed">{fact.text}</p>
            {fact.tags.length > 0 && (
              <p className="mt-3 text-sm text-red-400 flex flex-wrap gap-x-2">
                {fact.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </p>
            )}
          </>
        ) : (
          <div className="mt-4 space-y-2" aria-hidden>
            <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-white/5 rounded w-2/3 animate-pulse" />
          </div>
        )}

        <footer className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-gray-400">
          <button
            onClick={toggleLike}
            aria-pressed={isLiked}
            data-track="Curtir curiosidade"
            className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-full cursor-pointer transition-colors ${isLiked ? 'text-red-500' : 'hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> {isLiked ? 'Curtiu' : 'Curtir'}
          </button>
          <button onClick={share} data-track="Compartilhar curiosidade" className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-full hover:text-white cursor-pointer">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />} {copied ? 'Copiado' : 'Compartilhar'}
          </button>
          <button
            onClick={() => load(fact?.id)}
            data-track="Outra curiosidade"
            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-full hover:text-white cursor-pointer"
          >
            <Shuffle className="w-4 h-4" /> Outra
          </button>
        </footer>
      </article>
    </div>
  );
}
