'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Play, Pause } from 'lucide-react';
import { BrandMark } from './BrandLogo';
import { usePlayer } from './PlayerContext';
import { gradientClasses } from '@/lib/gradients';

export interface LegendStory {
  artist: string;
  title: string;
  description?: string;
  src?: string | null;
  gradient?: string;
  year?: string | null;
  origin?: string | null;
}

type Lenis = { stop: () => void; start: () => void };

/** Quebra a história em páginas curtas, sem cortar frase no meio */
function paginate(text: string, max = 300) {
  const sentences = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+/);
  const pages: string[] = [];
  let cur = '';
  for (const s of sentences) {
    if (cur && (cur + ' ' + s).length > max) {
      pages.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) pages.push(cur);
  return pages;
}

/**
 * A lenda abre como um livro: a capa vira e a história segue em páginas curtas.
 * As folhas viram em 3D, e o texto, a foto e os detalhes ficam em camadas de profundidade
 * diferentes, que se deslocam quando o mouse inclina o livro.
 * Virar: tocar no lado direito (ou esquerdo para voltar), arrastar, setas do teclado ou os botões.
 */
export default function LegendBook({ item, onClose }: { item: LegendStory; onClose: () => void }) {
  const text = useMemo(() => paginate(item.description || ''), [item.description]);
  const total = text.length + 2; // capa + páginas de texto + página final
  const [page, setPage] = useState(0); // quantas folhas já viraram
  const [turning, setTurning] = useState<number | null>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { isPlaying, toggle } = usePlayer();
  const [calm] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  const turnTo = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(total - 1, next));
      if (n === page) return;
      setTurning(n > page ? page : n);
      setPage(n);
      window.setTimeout(() => setTurning(null), 900);
    },
    [page, total],
  );

  // Trava a rolagem da página enquanto o livro está aberto e devolve o foco ao sair
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    const before = document.activeElement as HTMLElement | null;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
      before?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') turnTo(page + 1);
      else if (e.key === 'ArrowLeft') turnTo(page - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, turnTo, onClose]);

  // Inclinação com o mouse: as camadas em profundidade se deslocam (efeito 2,5D)
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !bookRef.current) return;
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    bookRef.current.style.transform = `rotateY(${(x * 12).toFixed(2)}deg) rotateX(${(-y * 10).toFixed(2)}deg)`;
  };
  const onLeave = () => bookRef.current && (bookRef.current.style.transform = '');

  // Arrastar com o dedo para virar
  const down = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => (down.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: React.PointerEvent) => {
    const d = down.current;
    down.current = null;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - d.y)) turnTo(page + (dx < 0 ? 1 : -1));
    else {
      // Toque: lado direito avança, esquerdo volta
      const r = bookRef.current?.getBoundingClientRect();
      if (r) turnTo(page + (e.clientX > r.left + r.width / 2 ? 1 : -1));
    }
  };

  // Cada face tem um fundo chapado (face-base) e, por cima, as camadas que sobem do papel.
  // Fundo e camadas são irmãos para o navegador ordenar a profundidade sem buracos.
  const cover = (
    <div className="face-3d absolute inset-0">
      <div className="face-base absolute inset-0 overflow-hidden bg-[#0B0A10]">
        {item.src ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${item.src})` }} />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses(item.gradient)}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
      </div>
      <div className="layer-1 absolute top-6 left-6 right-6 flex items-center justify-between">
        <BrandMark size={40} simple />
        <span className="text-[10px] uppercase tracking-[0.35em] text-white/70 font-bold">Lendas & Histórias</span>
      </div>
      <div className="layer-3 absolute left-7 right-7 bottom-20 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-red-400 font-bold">{item.artist}</p>
        <h3 className="text-3xl sm:text-4xl font-black leading-tight text-white">{item.title}</h3>
        {(item.origin || item.year) && <p className="text-xs uppercase tracking-widest text-gray-300">{[item.origin, item.year].filter(Boolean).join(' · ')}</p>}
      </div>
      <p className="layer-1 absolute bottom-6 right-7 text-[11px] uppercase tracking-widest text-white/60 flex items-center gap-1">
        Vire a página <ChevronRight className="w-3.5 h-3.5" />
      </p>
    </div>
  );

  const paper = (body: string, n: number) => (
    <div className="face-3d absolute inset-0 text-[#0B0A10]">
      {/* Papel com linhas finas e a margem vermelha */}
      <div
        className="face-base absolute inset-0 overflow-hidden bg-[#F4EDE0]"
        style={{ backgroundImage: 'repeating-linear-gradient(transparent 0 31px, rgba(11,10,16,0.045) 31px 32px)' }}
      >
        <div className="absolute inset-y-0 left-10 w-px bg-[#C8102E]/40" />
        <span aria-hidden className="absolute right-5 top-3 font-neon text-[8rem] leading-none text-[#C8102E]/10 select-none">
          {n}
        </span>
      </div>
      <p className="layer-1 absolute top-7 left-14 right-7 text-[10px] uppercase tracking-[0.3em] text-[#C8102E] font-bold truncate">{item.artist}</p>
      <p className="layer-2 absolute top-16 left-14 right-8 bottom-14 text-[17px] sm:text-lg leading-[32px] overflow-hidden">{body}</p>
      <p className="layer-1 absolute bottom-6 left-14 right-7 flex justify-between text-[11px] text-[#4A4458]">
        <span>{item.title}</span>
        <span className="tabular-nums">
          {n} / {text.length}
        </span>
      </p>
    </div>
  );

  const ending = (
    <div className="face-3d absolute inset-0 flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="face-base absolute inset-0 bg-[#0B0A10] bg-[radial-gradient(circle_at_50%_30%,rgba(225,29,46,0.25),transparent_60%)]" />
      <div className="layer-3">
        <BrandMark size={96} />
      </div>
      <p className="layer-2 text-2xl font-black text-white leading-snug">Essa história continua no ar.</p>
      <div className="layer-2 flex flex-col gap-3 w-full max-w-[16rem]" onPointerUp={(e) => e.stopPropagation()}>
        <button
          onClick={toggle}
          className="flex items-center justify-center gap-2 rounded-full bg-red-600 hover:bg-red-700 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isPlaying ? 'Pausar a rádio' : 'Ouvir a Antena Rock'}
        </button>
        <button onClick={onClose} className="rounded-full border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest text-gray-200 hover:text-white cursor-pointer">
          Fechar o livro
        </button>
      </div>
    </div>
  );

  // Verso das folhas: aparece do lado esquerdo quando o livro abre (no celular fica fora da tela)
  const back = (n: number) => (
    <div className="face-3d absolute inset-0">
      <div className="face-base absolute inset-0 overflow-hidden bg-[#16131F]">
        {item.src ? (
          <div className="absolute inset-0 bg-cover bg-center opacity-25 grayscale" style={{ backgroundImage: `url(${item.src})` }} />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br opacity-30 ${gradientClasses(item.gradient)}`} />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <BrandMark size={110} tone="white" simple className="opacity-20" />
        </div>
        <span className="absolute bottom-6 left-7 text-[11px] text-gray-500 tabular-nums">{n + 1}</span>
      </div>
    </div>
  );

  const faces = [cover, ...text.map((t, i) => paper(t, i + 1)), ending];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.artist}: ${item.title}`}
      data-section="lendas"
      data-lenis-prevent
      className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 px-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <button
        ref={closeRef}
        onClick={onClose}
        aria-label="Fechar a história"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-red-600 transition-colors cursor-pointer"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* No computador o livro abre em duas páginas; no celular, uma */}
      <div
        className="book-stage relative w-[var(--pw)] lg:w-[calc(var(--pw)*2)] h-[var(--ph)]"
        style={{ ['--pw' as string]: 'min(400px, 88vw)', ['--ph' as string]: 'min(570px, 72dvh)' }}
      >
        <div
          ref={bookRef}
          className="book absolute top-0 right-0 w-[var(--pw)] h-full select-none touch-pan-y cursor-pointer"
          onPointerDown={onDown}
          onPointerUp={onUp}
        >
          {faces.map((face, i) => {
            const turned = i < page;
            // Cada folha fica 1 px atrás da anterior. Virada, a ordem se inverte sozinha
            // (a última que virou fica por cima do lado esquerdo).
            // Só ficam na tela as folhas que podem aparecer: a aberta, a do lado esquerdo e,
            // durante a virada, a que está virando e as vizinhas. Assim nenhuma folha de trás
            // atravessa a da frente no 3D.
            const shown = i === page || i === page - 1 || (turning !== null && Math.abs(i - turning) <= 1);
            const style: React.CSSProperties = calm
              ? { opacity: i === page ? 1 : 0, pointerEvents: i === page ? undefined : 'none' }
              : { transform: `rotateY(${turned ? -178 : 0}deg) translateZ(${-i * 3}px)`, visibility: shown ? 'visible' : 'hidden' };
            return (
              <div
                key={i}
                className={`book-page ${i === page ? 'is-current' : ''} ${turning === i ? 'turning' : ''}`}
                style={style}
                aria-hidden={i !== page}
              >
                <div className="book-face front shadow-2xl shadow-black/60 border border-white/10">{face}</div>
                <div className="book-face back shadow-2xl shadow-black/60 border border-white/10">{back(i)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-5 text-sm text-gray-300">
        <button
          onClick={() => turnTo(page - 1)}
          disabled={page === 0}
          aria-label="Página anterior"
          className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:border-red-500/60 disabled:opacity-30 cursor-pointer disabled:cursor-default"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="tabular-nums w-14 text-center" aria-live="polite">
          {page + 1} / {total}
        </span>
        <button
          onClick={() => turnTo(page + 1)}
          disabled={page === total - 1}
          aria-label="Próxima página"
          className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:border-red-500/60 disabled:opacity-30 cursor-pointer disabled:cursor-default"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
