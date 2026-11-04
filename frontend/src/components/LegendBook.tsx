'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { animate } from 'framer-motion';
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
const TURNED = -178; // ângulo de uma folha virada (quase deitada do lado esquerdo)

// Bordas macias: quanto mais passa do limite, menos a folha acompanha
function rubberband(overshoot: number, dimension: number, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * A lenda abre como um livro: a capa vira e a história segue em páginas curtas.
 * As folhas viram em 3D, e o texto, a foto e os detalhes ficam em camadas de profundidade
 * diferentes, que se deslocam quando o mouse inclina o livro.
 *
 * O livro nasce do cartão tocado e volta para ele ao fechar. A folha segue o dedo
 * enquanto você arrasta; ao soltar, ela vira ou volta conforme a direção do gesto e
 * continua na velocidade do dedo. Dá para agarrar uma folha no meio da virada.
 * Também vira tocando no lado direito (ou esquerdo para voltar), pelas setas do teclado e pelos botões.
 */
export default function LegendBook({
  item,
  origin,
  onClose,
}: {
  item: LegendStory;
  origin?: HTMLElement | null;
  onClose: () => void;
}) {
  const text = useMemo(() => paginate(item.description || ''), [item.description]);
  const total = text.length + 2; // capa + páginas de texto + página final
  const [page, setPage] = useState(0); // quantas folhas já viraram
  const pageRef = useRef(0);
  pageRef.current = page;
  const overlayRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pageEls = useRef<(HTMLDivElement | null)[]>([]);
  const closing = useRef(false);
  const { isPlaying, toggle } = usePlayer();
  const [calm] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------- Física das folhas: cada uma tem ângulo e velocidade numa mola ----------
  const ang = useRef<number[]>([]);
  const vel = useRef<number[]>([]);
  const zeta = useRef<number[]>([]);
  const tilt = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    decided: boolean;
    j: number;
    c0: number;
    x0: number;
    limit: boolean;
    hist: { a: number; t: number }[];
  } | null>(null);
  const raf = useRef(0);

  if (ang.current.length !== total) {
    ang.current = Array.from({ length: total }, () => 0);
    vel.current = Array.from({ length: total }, () => 0);
    zeta.current = Array.from({ length: total }, () => 1);
  }

  const targetOf = (i: number) => (i < pageRef.current ? TURNED : 0);

  const step = useCallback((spring: { x: number; v: number }, to: number, dt: number, z: number, response: number) => {
    const k = Math.pow((2 * Math.PI) / response, 2);
    const c = (4 * Math.PI * z) / response;
    let left = dt;
    while (left > 0) {
      const h = Math.min(left, 1 / 240);
      spring.v += (k * (to - spring.x) - c * spring.v) * h;
      spring.x += spring.v * h;
      left -= h;
    }
  }, []);

  const last = useRef(0);
  const loop = useCallback(
    (now: number) => {
      raf.current = 0;
      const dt = last.current ? Math.min((now - last.current) / 1000, 0.05) : 1 / 60;
      last.current = now;
      let busy = false;
      const moving: boolean[] = [];
      const d = drag.current;

      for (let i = 0; i < total; i++) {
        const held = d && d.decided && d.j === i;
        if (!held) {
          const sp = { x: ang.current[i], v: vel.current[i] };
          step(sp, targetOf(i), dt, zeta.current[i], 0.45);
          ang.current[i] = sp.x;
          vel.current[i] = sp.v;
          if (Math.abs(sp.x - targetOf(i)) < 0.05 && Math.abs(sp.v) < 0.5) {
            ang.current[i] = targetOf(i);
            vel.current[i] = 0;
            zeta.current[i] = 1;
          }
        }
        moving[i] = !!held || ang.current[i] !== targetOf(i);
        if (moving[i]) busy = true;
      }

      const p = pageRef.current;
      for (let i = 0; i < total; i++) {
        const el = pageEls.current[i];
        if (!el) continue;
        const shown = i === p || i === p - 1 || moving[i] || !!moving[i - 1] || !!moving[i + 1];
        el.style.transform = `rotateY(${ang.current[i].toFixed(2)}deg) translateZ(${-i * 3}px)`;
        el.style.visibility = shown ? 'visible' : 'hidden';
        el.classList.toggle('turning', moving[i]);
      }

      // Inclinação do livro com o mouse, também numa mola (começa de onde está)
      const t = tilt.current;
      const sx = { x: t.x, v: t.vx };
      const sy = { x: t.y, v: t.vy };
      step(sx, t.tx, dt, 1, 0.5);
      step(sy, t.ty, dt, 1, 0.5);
      t.x = sx.x; t.vx = sx.v; t.y = sy.x; t.vy = sy.v;
      if (Math.abs(t.x - t.tx) > 0.01 || Math.abs(t.y - t.ty) > 0.01 || Math.abs(t.vx) > 0.05 || Math.abs(t.vy) > 0.05) busy = true;
      if (bookRef.current) bookRef.current.style.transform = `rotateY(${t.x.toFixed(2)}deg) rotateX(${t.y.toFixed(2)}deg)`;

      if (busy) raf.current = requestAnimationFrame(loop);
      else last.current = 0;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [total, step],
  );

  const wake = useCallback(() => {
    if (calm) return;
    if (!raf.current) raf.current = requestAnimationFrame(loop);
  }, [calm, loop]);

  useEffect(() => {
    wake();
  }, [page, wake]);
  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current);
      raf.current = 0; // sem isso, a próxima montagem acharia que o loop ainda está rodando
    },
    [],
  );

  const turnTo = useCallback(
    (next: number) => {
      const n = Math.max(0, Math.min(total - 1, next));
      if (n === pageRef.current) return;
      pageRef.current = n;
      setPage(n);
      wake();
    },
    [total, wake],
  );

  // ---------- Abrir a partir do cartão e voltar para ele ----------
  const flipFrom = useCallback(() => {
    const flip = flipRef.current;
    const book = bookRef.current;
    if (!flip || !book || !origin) return null;
    const o = origin.getBoundingClientRect();
    const b = book.getBoundingClientRect();
    const f = flip.getBoundingClientRect();
    if (!o.width || !b.width) return null;
    flip.style.transformOrigin = `${b.left - f.left + b.width / 2}px ${b.top - f.top + b.height / 2}px`;
    return {
      x: o.left + o.width / 2 - (b.left + b.width / 2),
      y: o.top + o.height / 2 - (b.top + b.height / 2),
      scale: o.height / b.height,
    };
  }, [origin]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const flip = flipRef.current;
    if (!overlay || !flip) return;
    if (calm) {
      animate(overlay, { opacity: [0, 1] }, { duration: 0.2 });
      return;
    }
    const from = flipFrom();
    animate(overlay, { opacity: [0, 1] }, { duration: 0.3 });
    if (from) {
      animate(
        flip,
        { x: [from.x, 0], y: [from.y, 0], scale: [from.scale, 1], opacity: [0.4, 1] },
        { type: 'spring', bounce: 0, duration: 0.5 },
      );
    }
  }, [calm, flipFrom]);

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const overlay = overlayRef.current;
    const flip = flipRef.current;
    if (!overlay || !flip || calm) {
      if (overlay) animate(overlay, { opacity: 0 }, { duration: 0.15 }).then(onClose);
      else onClose();
      return;
    }
    // Fecha o livro (folhas voltam) e ele encolhe de volta para o cartão pelo mesmo caminho
    pageRef.current = 0;
    setPage(0);
    wake();
    const to = flipFrom();
    animate(overlay, { opacity: 0 }, { duration: 0.35, delay: 0.1 });
    if (to) {
      animate(flip, { x: to.x, y: to.y, scale: to.scale, opacity: 0.3 }, { type: 'spring', bounce: 0, duration: 0.45 }).then(onClose);
    } else {
      animate(flip, { opacity: 0, scale: 0.9 }, { duration: 0.25 }).then(onClose);
    }
  }, [calm, flipFrom, onClose, wake]);

  // Trava a rolagem da página enquanto o livro está aberto e devolve o foco ao sair
  useEffect(() => {
    const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
    const before = document.activeElement as HTMLElement | null;
    lenis?.stop();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      lenis?.start();
      document.body.style.overflow = prevOverflow;
      before?.focus?.({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
      else if (e.key === 'ArrowRight') turnTo(pageRef.current + 1);
      else if (e.key === 'ArrowLeft') turnTo(pageRef.current - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turnTo, requestClose]);

  // Inclinação com o mouse: as camadas em profundidade se deslocam (efeito 2,5D)
  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || calm) return;
    tilt.current.tx = (e.clientX / window.innerWidth - 0.5) * 12;
    tilt.current.ty = -(e.clientY / window.innerHeight - 0.5) * 10;
    wake();
  };
  const onLeave = () => {
    tilt.current.tx = 0;
    tilt.current.ty = 0;
    wake();
  };

  // ---------- Arrastar a folha ----------
  const onDown = (e: React.PointerEvent) => {
    if (closing.current) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, decided: false, j: -1, c0: 1, x0: 1, limit: false, hist: [] };
    if (calm) return;
    // Uma folha ainda em movimento? Agarra essa, do ângulo em que está
    const busy = ang.current.findIndex((a, i) => Math.abs(a - targetOf(i)) > 1);
    if (busy >= 0) begin(e, busy, false);
  };

  const begin = (e: React.PointerEvent, j: number, limit: boolean) => {
    const d = drag.current;
    const book = bookRef.current;
    if (!d || !book) return;
    const r = book.getBoundingClientRect();
    const theta = (-ang.current[j] * Math.PI) / 178; // 0 = deitada à direita, π = virada
    d.decided = true;
    d.j = j;
    d.limit = limit;
    d.c0 = Math.cos(theta);
    d.x0 = Math.max(r.width * 0.5, e.clientX - r.left); // distância da lombada até onde você pegou
    d.x = e.clientX;
    d.hist = [{ a: ang.current[j], t: e.timeStamp }];
    vel.current[j] = 0;
    try {
      book.setPointerCapture(e.pointerId);
    } catch {
      /* ponteiro já solto */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.decided) {
      if (Math.hypot(dx, dy) < 10) return; // só decide depois de 10 px
      if (Math.abs(dy) > Math.abs(dx)) {
        drag.current = null;
        return;
      }
      const p = pageRef.current;
      if (dx < 0) begin(e, Math.min(p, total - 1), p >= total - 1);
      else if (p > 0) begin(e, p - 1, false);
      else {
        drag.current = null;
        return;
      }
    }
    const j = d.j;
    let a: number;
    if (d.limit) {
      // Última página: resiste e não vira
      const over = Math.max(0, -(e.clientX - d.x));
      a = -(rubberband(over, d.x0 * 2) / (d.x0 * 2)) * 70;
    } else {
      const c = Math.max(-1, Math.min(1, d.c0 + (e.clientX - d.x) / d.x0));
      a = (-Math.acos(c) * 178) / Math.PI;
    }
    ang.current[j] = a;
    d.hist.push({ a, t: e.timeStamp });
    if (d.hist.length > 8) d.hist.shift();
    wake();
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || closing.current) return;
    if (!d.decided) {
      // Toque: lado direito avança, esquerdo volta
      const r = bookRef.current?.getBoundingClientRect();
      if (r) turnTo(pageRef.current + (e.clientX > r.left + r.width / 2 ? 1 : -1));
      return;
    }
    const j = d.j;
    // Velocidade angular dos últimos ~100 ms (graus/s)
    const endP = d.hist[d.hist.length - 1];
    const startP = d.hist.find((h) => endP.t - h.t <= 100) ?? d.hist[0];
    // Dedo parado antes de soltar (mais de 80 ms): velocidade zero
    const still = e.timeStamp - endP.t > 80;
    const v = e.type === 'pointercancel' || still ? 0 : ((endP.a - startP.a) / Math.max(1, endP.t - startP.t)) * 1000;
    vel.current[j] = v;
    zeta.current[j] = Math.abs(v) > 200 ? 0.85 : 1; // leve quique só quando a folha foi arremessada
    if (!d.limit) {
      // Decide pela direção do gesto; parado, decide pela metade do caminho
      const turned = v < -60 ? true : v > 60 ? false : ang.current[j] < TURNED / 2;
      const next = turned ? j + 1 : j;
      pageRef.current = next;
      setPage(next);
    }
    wake();
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
        <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-white/70 font-bold">Lendas & Histórias</span>
      </div>
      <div className="layer-3 absolute left-7 right-7 bottom-20 space-y-3">
        <p className="text-xs uppercase tracking-[0.14em] text-red-400 font-bold">{item.artist}</p>
        <h3 className="text-3xl sm:text-4xl font-black leading-tight text-white">{item.title}</h3>
        {(item.origin || item.year) && <p className="text-xs uppercase tracking-widest text-gray-300">{[item.origin, item.year].filter(Boolean).join(' · ')}</p>}
      </div>
      <p className="layer-1 absolute bottom-6 right-7 text-xs uppercase tracking-widest text-white/60 flex items-center gap-1">
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
      <p className="layer-1 absolute top-7 left-14 right-7 text-[0.6875rem] uppercase tracking-[0.14em] text-[#C8102E] font-bold truncate">{item.artist}</p>
      <p className="layer-2 absolute top-16 left-14 right-8 bottom-14 text-[17px] sm:text-lg leading-[32px] overflow-hidden">{body}</p>
      <p className="layer-1 absolute bottom-6 left-14 right-7 flex justify-between text-xs text-[#4A4458]">
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
          className="glass glass-red flex items-center justify-center gap-2 rounded-full px-5 py-3 text-xs font-bold uppercase tracking-wider text-white cursor-pointer"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          {isPlaying ? 'Pausar a rádio' : 'Ouvir a Antena Rock'}
        </button>
        <button onClick={requestClose} className="glass rounded-full px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-100 hover:text-white cursor-pointer">
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
        <span className="absolute bottom-6 left-7 text-xs text-gray-400 tabular-nums">{n + 1}</span>
      </div>
    </div>
  );

  const faces = [cover, ...text.map((t, i) => paper(t, i + 1)), ending];

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.artist}: ${item.title}`}
      data-section="lendas"
      data-lenis-prevent
      className="book-overlay fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-5 px-4"
      style={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && requestClose()}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      <button ref={closeRef} onClick={requestClose} aria-label="Fechar a história" className="glass absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer">
        <X className="w-5 h-5 text-white" />
      </button>

      <div ref={flipRef} className="flex flex-col items-center gap-5" onClick={(e) => e.target === e.currentTarget && requestClose()}>
        {/* No computador o livro abre em duas páginas; no celular, uma */}
        <div
          className="book-stage relative w-[var(--pw)] lg:w-[calc(var(--pw)*2)] h-[var(--ph)]"
          style={{ ['--pw' as string]: 'min(400px, 88vw)', ['--ph' as string]: 'min(570px, 72dvh)' }}
        >
          <div
            ref={bookRef}
            className="book absolute top-0 right-0 w-[var(--pw)] h-full select-none touch-pan-y cursor-pointer"
            onPointerDown={onDown}
            onPointerMove={onPointerMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            {faces.map((face, i) => {
              // Cada folha fica 3 px atrás da anterior; virada, a ordem se inverte sozinha.
              // O ângulo e o que aparece na tela são escritos pela física (loop), não pelo React.
              const style: React.CSSProperties = calm
                ? { opacity: i === page ? 1 : 0, pointerEvents: i === page ? undefined : 'none' }
                : {
                    transform: `rotateY(${(ang.current[i] ?? 0).toFixed(2)}deg) translateZ(${-i * 3}px)`,
                    visibility: i === page || i === page - 1 ? 'visible' : 'hidden',
                  };
              return (
                <div
                  key={i}
                  ref={(el) => {
                    pageEls.current[i] = el;
                  }}
                  className={`book-page ${i === page ? 'is-current' : ''}`}
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
            className="glass w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-default"
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
            className="glass w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
