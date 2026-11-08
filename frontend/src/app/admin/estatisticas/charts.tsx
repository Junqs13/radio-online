'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

// Gráficos do painel em SVG, sem biblioteca: leves e no visual do site.
export const CORES = ['#E11D2E', '#7C3AED', '#06B6D4', '#F59E0B', '#22C55E', '#EC4899', '#64748B'];
export const fmt = (n: number) => n.toLocaleString('pt-BR');

export function duracao(s: number) {
  if (!s) return '0 s';
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min${s % 60 ? ` ${s % 60} s` : ''}`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** Linha pequena dentro dos cartões de número */
export function Sparkline({ values, cor = '#E11D2E' }: { values: number[]; cor?: string }) {
  const id = useId().replace(/:/g, '');
  if (values.length < 2) return <div className="h-10" />;
  const w = 120;
  const h = 40;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - 3 - (v / max) * (h - 6)]);
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={cor} stopOpacity=".35" />
          <stop offset="1" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${w},${h}L0,${h}Z`} fill={`url(#s${id})`} />
      <path d={d} fill="none" stroke={cor} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Variação contra o período anterior */
export function Delta({ atual, anterior, inverso }: { atual: number; anterior: number; inverso?: boolean }) {
  if (!anterior) return atual ? <span className="text-[0.6875rem] text-gray-500">novo</span> : null;
  const p = Math.round(((atual - anterior) / anterior) * 100);
  if (!Number.isFinite(p)) return null;
  const bom = inverso ? p < 0 : p > 0;
  const cor = p === 0 ? 'text-gray-400 bg-white/5' : bom ? 'text-emerald-300 bg-emerald-500/10' : 'text-rose-300 bg-rose-500/10';
  return (
    <span className={`text-[0.6875rem] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap flex-shrink-0 ${cor}`} title="comparado com o período anterior">
      {p > 0 ? '▲' : p < 0 ? '▼' : '='} {Math.abs(p)}%
    </span>
  );
}

export interface Ponto {
  t: string;
  [k: string]: number | string;
}

/** Área com linha, eixo e dica ao passar o mouse */
export function AreaChart({
  rows,
  series,
  rotulo,
}: {
  rows: Ponto[];
  series: { key: string; nome: string; cor: string }[];
  rotulo: (t: string) => string;
}) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState<number | null>(null);
  // O SVG usa a largura real do cartão, assim o texto dos eixos fica sempre do mesmo tamanho
  const caixa = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(800);
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 500 ? 200 : 260;
  const pad = { l: 36, r: 12, t: 12, b: 26 };
  const max = Math.max(1, ...rows.flatMap((r) => series.map((s) => Number(r[s.key]) || 0)));
  const teto = Math.ceil(max / 4) * 4 || 4;
  const x = (i: number) => pad.l + (rows.length <= 1 ? (W - pad.l - pad.r) / 2 : (i / (rows.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + (1 - v / teto) * (H - pad.t - pad.b);
  const step = Math.max(1, Math.ceil(rows.length / Math.max(3, Math.floor(W / 90))));

  if (!rows.length) return <p className="text-xs text-gray-500 py-16 text-center">Sem dados neste período.</p>;
  return (
    <div className="relative" ref={caixa}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        className="block w-full h-auto select-none"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const b = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - b.left) / b.width) * W;
          const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (rows.length - 1));
          setHover(Math.max(0, Math.min(rows.length - 1, i)));
        }}
      >
        <defs>
          {series.map((s, k) => (
            <linearGradient key={s.key} id={`a${id}${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={s.cor} stopOpacity={k ? 0.18 : 0.4} />
              <stop offset="1" stopColor={s.cor} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(teto * f)} y2={y(teto * f)} stroke="rgba(255,255,255,.06)" />
            <text x={pad.l - 8} y={y(teto * f) + 4} textAnchor="end" fontSize="11" fill="#6b7280">
              {fmt(Math.round(teto * f))}
            </text>
          </g>
        ))}
        {rows.map((r, i) =>
          i % step === 0 || i === rows.length - 1 ? (
            <text key={r.t} x={x(i)} y={H - 6} textAnchor={i === rows.length - 1 && rows.length > 1 ? 'end' : i === 0 ? 'start' : 'middle'} fontSize="11" fill="#6b7280">
              {rotulo(r.t)}
            </text>
          ) : null,
        )}
        {[...series].reverse().map((s, kr) => {
          const k = series.length - 1 - kr;
          const d = rows.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Number(r[s.key]) || 0).toFixed(1)}`).join('');
          return (
            <g key={s.key}>
              <path d={`${d}L${x(rows.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={`url(#a${id}${k})`} />
              <path d={d} fill="none" stroke={s.cor} strokeWidth={k ? 1.6 : 2.4} strokeLinejoin="round" strokeDasharray={k ? '4 4' : undefined} />
            </g>
          );
        })}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="rgba(255,255,255,.25)" />
            {series.map((s) => (
              <circle key={s.key} cx={x(hover)} cy={y(Number(rows[hover][s.key]) || 0)} r="4" fill={s.cor} stroke="#0b0a10" strokeWidth="2" />
            ))}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 rounded-xl border border-white/10 bg-[#121018]/95 backdrop-blur px-3 py-2 text-xs shadow-xl"
          style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${x(hover) > W * 0.7 ? '-105%' : '8%'})` }}
        >
          <p className="font-semibold text-white mb-1">{rotulo(rows[hover].t)}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2 text-gray-300 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full" style={{ background: s.cor }} />
              {s.nome}: <b className="text-white">{fmt(Number(rows[hover][s.key]) || 0)}</b>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Dia da semana x hora */
export function Heatmap({ heat }: { heat: number[][] }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(1, ...heat.flat());
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: '2.25rem repeat(24, minmax(0, 1fr))' }}>
        {ordem.map((d) => (
          <div key={d} className="contents">
            <span className="text-[0.6875rem] text-gray-500 self-center">{DIAS[d]}</span>
            {heat[d].map((n, h) => {
              const f = n / max;
              return (
                <div
                  key={h}
                  onMouseEnter={() => setHover([d, h])}
                  onMouseLeave={() => setHover(null)}
                  className="aspect-square rounded-[4px] transition-transform hover:scale-125"
                  style={{
                    background: n ? `color-mix(in oklab, #7C3AED ${Math.round((1 - f) * 100)}%, #E11D2E)` : 'rgba(255,255,255,.04)',
                    opacity: n ? 0.25 + f * 0.75 : 1,
                  }}
                  title={`${DIAS[d]}, ${h}h: ${n} visitas`}
                />
              );
            })}
          </div>
        ))}
        <span />
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} className="text-[0.625rem] text-gray-600 text-center">
            {h % 3 === 0 ? h : ''}
          </span>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3 h-4">
        {hover ? `${DIAS[hover[0]]}, das ${hover[1]}h às ${hover[1] + 1}h: ${fmt(heat[hover[0]][hover[1]])} visitas` : 'Passe o mouse para ver cada horário.'}
      </p>
    </div>
  );
}

/** Rosca com legenda */
export function Donut({ items, centro, sub }: { items: { label: string; n: number }[]; centro?: string; sub?: string }) {
  const total = items.reduce((a, b) => a + b.n, 0);
  const [hover, setHover] = useState<number | null>(null);
  const arcos = useMemo(() => {
    let acc = 0;
    return items.map((it) => {
      const ini = acc / total;
      acc += it.n;
      return [ini, acc / total] as const;
    });
  }, [items, total]);
  if (!total) return <p className="text-xs text-gray-500">Sem dados neste período.</p>;
  const R = 42;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-5">
      <div className="relative w-32 h-32 flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="12" />
          {arcos.map(([a, b], i) => (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={CORES[i % CORES.length]}
              strokeWidth={hover === i ? 15 : 12}
              strokeDasharray={`${Math.max(0, (b - a) * C - 1.2)} ${C}`}
              strokeDashoffset={-a * C}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="transition-all"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center pointer-events-none">
          <div>
            <p className="text-lg font-black leading-none">{hover !== null ? `${Math.round((items[hover].n / total) * 100)}%` : centro ?? fmt(total)}</p>
            <p className="text-[0.625rem] text-gray-500 mt-1 max-w-[5.5rem] truncate">{hover !== null ? items[hover].label : sub}</p>
          </div>
        </div>
      </div>
      <ul className="space-y-1.5 min-w-0 flex-1">
        {items.slice(0, 6).map((it, i) => (
          <li key={it.label} className="flex items-center gap-2 text-xs" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CORES[i % CORES.length] }} />
            <span className="truncate text-gray-300">{it.label}</span>
            <span className="ml-auto text-gray-500 tabular-nums">{Math.round((it.n / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lista com barra proporcional */
export function Ranking({
  items,
  empty = 'Sem dados neste período.',
  cor = '#E11D2E',
  limite = 10,
}: {
  items: { label: string; n: number; extra?: string }[];
  empty?: string;
  cor?: string;
  limite?: number;
}) {
  if (!items.length) return <p className="text-xs text-gray-500">{empty}</p>;
  const max = Math.max(...items.map((i) => i.n), 1);
  return (
    <ul className="space-y-1.5">
      {items.slice(0, limite).map((it, i) => (
        <li key={`${it.label}-${i}`} className="relative group">
          <div className="absolute inset-y-0 left-0 rounded-lg transition-all group-hover:opacity-100 opacity-70" style={{ width: `${(it.n / max) * 100}%`, background: `linear-gradient(90deg, ${cor}40, ${cor}14)` }} />
          <div className="relative flex justify-between gap-3 px-2.5 py-1.5 text-xs">
            <span className="truncate text-gray-200" title={it.label}>
              {it.label}
            </span>
            <span className="text-gray-400 flex-shrink-0 tabular-nums">
              {it.extra && <span className="text-gray-600 mr-2">{it.extra}</span>}
              {fmt(it.n)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Funil de engajamento: cada etapa em relação às visitas */
export function Funil({ etapas }: { etapas: { label: string; n: number; nota?: string }[] }) {
  const topo = etapas[0]?.n || 1;
  return (
    <div className="space-y-3">
      {etapas.map((e, i) => {
        const f = e.n / topo;
        return (
          <div key={e.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-300">{e.label}</span>
              <span className="text-gray-400 tabular-nums">
                {fmt(e.n)} {i > 0 && <span className="text-gray-600">· {Math.round(f * 100)}%</span>}
              </span>
            </div>
            <div className="h-3 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, f * 100)}%`, background: `linear-gradient(90deg, #E11D2E, ${i % 2 ? '#7C3AED' : '#B91C5C'})` }} />
            </div>
            {e.nota && <p className="text-[0.6875rem] text-gray-600 mt-1">{e.nota}</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Barrinha de 0 a 100% */
export function Barra({ pct, cor = '#7C3AED' }: { pct: number; cor?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: cor }} />
      </div>
      <span className="tabular-nums text-gray-400">{pct}%</span>
    </div>
  );
}
