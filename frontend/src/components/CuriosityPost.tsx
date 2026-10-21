'use client';

import { useEffect, useState } from 'react';
import { Radio, Heart, Share2, Check, Lightbulb } from 'lucide-react';
import { CURIOSITIES, type Curiosity } from '@/lib/curiosities';
import { dayNumber, pickDaily } from '@/lib/daily';

const LIKE_KEY = 'antena-curiosidade-curtida';

/** Curiosidade do dia no formato de post de rede social, com a cara da Antena Rock. */
export default function CuriosityPost() {
  const [fact, setFact] = useState<Curiosity | null>(null);
  const [day, setDay] = useState(0);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [date, setDate] = useState('');

  // Calculado no navegador para o HTML do servidor não divergir na virada do dia
  useEffect(() => {
    const d = dayNumber();
    setDay(d);
    setFact(pickDaily(CURIOSITIES, 29, d));
    setDate(new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', timeZone: 'America/Sao_Paulo' }));
    try {
      setLiked(localStorage.getItem(LIKE_KEY) === String(d));
    } catch {
      /* navegador sem armazenamento: curtida vale só nesta visita */
    }
  }, []);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    try {
      if (next) localStorage.setItem(LIKE_KEY, String(day));
      else localStorage.removeItem(LIKE_KEY);
    } catch {
      /* idem */
    }
  };

  const share = async () => {
    if (!fact) return;
    const text = `Curiosidade do dia na Antena Rock: ${fact.text}`;
    const url = typeof window !== 'undefined' ? window.location.origin : '';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-red-500" />
        <h2 className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold">Curiosidade do dia</h2>
      </div>

      <article className="border border-white/10 bg-black/50 rounded-3xl p-5 sm:p-6 backdrop-blur-xl" aria-live="polite">
        <header className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-red-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="font-bold text-white text-sm">Antena Rock</p>
            <p className="text-xs text-gray-500">Sorocaba, SP{date && ` · ${date}`}</p>
          </div>
        </header>

        {fact ? (
          <>
            <p className="mt-4 text-[15px] sm:text-base text-gray-100 leading-relaxed">{fact.text}</p>
            <p className="mt-3 text-sm text-red-400 flex flex-wrap gap-x-2">
              {fact.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </p>
          </>
        ) : (
          <div className="mt-4 space-y-2" aria-hidden>
            <div className="h-4 bg-white/5 rounded w-full" />
            <div className="h-4 bg-white/5 rounded w-5/6" />
            <div className="h-4 bg-white/5 rounded w-2/3" />
          </div>
        )}

        <footer className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-gray-400">
          <button
            onClick={toggleLike}
            aria-pressed={liked}
            className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-full cursor-pointer transition-colors ${liked ? 'text-red-500' : 'hover:text-red-400'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {liked ? 'Curtiu' : 'Curtir'}
          </button>
          <button onClick={share} className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-full hover:text-white cursor-pointer">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4" />} {copied ? 'Copiado' : 'Compartilhar'}
          </button>
          <span className="text-[11px] text-gray-600 hidden sm:inline">Amanhã tem outra</span>
        </footer>
      </article>
    </div>
  );
}
