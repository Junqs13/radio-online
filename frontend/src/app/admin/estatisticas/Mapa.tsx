'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import { fmt } from './charts';

type P = { lat: number; lon: number; label: string; n: number };

const W = 800;
const H = 520;

/** Mapa com um ponto por cidade. O enquadramento segue os pontos: se quase todo mundo é do Brasil, mostra o Brasil. */
export default function Mapa({ points }: { points: P[] }) {
  const [paises, setPaises] = useState<GeoPermissibleObjects[] | null>(null);
  const [hover, setHover] = useState<P | null>(null);
  const [mundo, setMundo] = useState(false);

  useEffect(() => {
    let vivo = true;
    import('world-atlas/countries-50m.json').then((m) => {
      const topo = (m.default ?? m) as unknown as Topology<{ countries: GeometryCollection }>;
      const fc = feature(topo, topo.objects.countries) as unknown as { features: GeoPermissibleObjects[] };
      if (vivo) setPaises(fc.features);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const { path, proj } = useMemo(() => {
    const proj = geoMercator();
    // 90% das visitas definem a área; um ponto solto fora não puxa o mapa para o mundo todo
    const ordenados = [...points].sort((a, b) => b.n - a.n);
    const total = points.reduce((a, b) => a + b.n, 0);
    let acc = 0;
    const foco = ordenados.filter((p) => (acc += p.n) - p.n < total * 0.9);
    const base = mundo || !foco.length ? [] : foco;
    const lons = base.map((p) => p.lon);
    const lats = base.map((p) => p.lat);
    // Sem pontos ou no modo mundo: mundo inteiro. Com pontos: a caixa deles, com folga e no mínimo do tamanho do Brasil
    const caixa = base.length
      ? (() => {
          let [x0, x1, y0, y1] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
          const cx = (x0 + x1) / 2;
          const cy = (y0 + y1) / 2;
          const dx = Math.max(x1 - x0, 32) * 0.65;
          const dy = Math.max(y1 - y0, 30) * 0.65;
          [x0, x1, y0, y1] = [cx - dx, cx + dx, cy - dy, cy + dy];
          return { type: 'MultiPoint', coordinates: [[x0, y0], [x1, y1]] } as GeoPermissibleObjects;
        })()
      : ({ type: 'Sphere' } as GeoPermissibleObjects);
    proj.fitExtent([[10, 10], [W - 10, H - 10]], caixa);
    return { path: geoPath(proj), proj };
  }, [points, mundo]);

  const max = Math.max(1, ...points.map((p) => p.n));
  const raio = (n: number) => 4 + Math.sqrt(n / max) * 22;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto rounded-2xl bg-[radial-gradient(80%_80%_at_50%_40%,rgba(124,58,237,.10),transparent_70%)]">
        <defs>
          <radialGradient id="ponto">
            <stop offset="0" stopColor="#ff4d5e" stopOpacity=".95" />
            <stop offset="1" stopColor="#E11D2E" stopOpacity=".25" />
          </radialGradient>
          <clipPath id="quadro">
            <rect width={W} height={H} rx="16" />
          </clipPath>
        </defs>
        <g clipPath="url(#quadro)">
          {paises?.map((f, i) => (
            <path key={i} d={path(f) ?? ''} fill="rgba(255,255,255,.045)" stroke="rgba(255,255,255,.14)" strokeWidth=".6" />
          ))}
          {[...points]
            .sort((a, b) => b.n - a.n)
            .map((p) => {
              const xy = proj([p.lon, p.lat]);
              if (!xy) return null;
              const r = raio(p.n);
              return (
                <g key={`${p.lat},${p.lon}`} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} className="cursor-default">
                  <circle cx={xy[0]} cy={xy[1]} r={r * 1.8} fill="#E11D2E" opacity=".08" />
                  <circle cx={xy[0]} cy={xy[1]} r={r} fill="url(#ponto)" stroke={hover === p ? '#fff' : 'rgba(255,255,255,.5)'} strokeWidth={hover === p ? 2 : 0.8} />
                </g>
              );
            })}
        </g>
      </svg>
      <div className="absolute top-3 left-3 flex gap-1 text-[0.6875rem]">
        {[
          [false, 'Onde estão'],
          [true, 'Mundo'],
        ].map(([v, t]) => (
          <button
            key={String(v)}
            onClick={() => setMundo(v as boolean)}
            className={`px-2.5 py-1 rounded-lg border cursor-pointer ${mundo === v ? 'bg-white/10 border-white/20 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
          >
            {t as string}
          </button>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 rounded-xl border border-white/10 bg-[#121018]/90 backdrop-blur px-3 py-2 text-xs min-h-[2.5rem] max-w-[70%]">
        {hover ? (
          <>
            <p className="font-semibold text-white truncate">{hover.label || 'Local não identificado'}</p>
            <p className="text-gray-400">{fmt(hover.n)} visitas</p>
          </>
        ) : (
          <p className="text-gray-500 pt-1">{points.length ? `${points.length} cidades. Passe o mouse num ponto.` : 'Nenhuma localização neste período.'}</p>
        )}
      </div>
    </div>
  );
}
