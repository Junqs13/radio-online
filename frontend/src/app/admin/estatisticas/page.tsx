'use client';

import { useCallback, useEffect, useState } from 'react';
import { BarChart3, RefreshCw } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';

interface Item {
  label: string;
  n: number;
  section?: string;
}
interface Summary {
  days: number;
  totals: {
    sessions: number;
    visitors: number;
    returning: number;
    pageviews: number;
    avgDuration: number;
    listeners: number;
    avgListen: number;
    listenHours: number;
    bounces: number;
  };
  byDay: { day: string; sessions: number; visitors: number; listeners: number }[];
  byHour: number[];
  cities: Item[];
  regions: Item[];
  countries: Item[];
  devices: Item[];
  os: Item[];
  browsers: Item[];
  referrers: Item[];
  landing: Item[];
  clicks: Item[];
  sections: Item[];
  plays: Item[];
  legends: Item[];
  likes: Item[];
  shares: Item[];
  recent: { startedAt: string; place: string; device: string; referrer: string; pageviews: number; listenSeconds: number; duration: number }[];
}

const RANGES = [
  { days: 1, label: 'Hoje' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

// Nome das partes da página como aparecem para quem cuida do site
const SECTION: Record<string, string> = {
  header: 'Topo',
  home: 'Início',
  player: 'Player',
  pedidos: 'Pedidos',
  lendas: 'Lendas',
  curiosidade: 'Curiosidade',
  historia: 'Manifesto',
  programacao: 'Grade',
  'fale-conosco': 'Fale conosco',
  footer: 'Rodapé',
  nav: 'Menu',
  'barra-player': 'Barra do player',
  outro: 'Outras partes',
};
const sectionName = (s?: string) => (s ? SECTION[s] ?? s : '');

const COUNTRY: Record<string, string> = { BR: 'Brasil', US: 'Estados Unidos', PT: 'Portugal', AR: 'Argentina', JP: 'Japão', DE: 'Alemanha', GB: 'Reino Unido' };

function dur(s: number) {
  if (!s) return '0 s';
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${s % 60 ? `${s % 60} s` : ''}`.trim();
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '0%');

export default function AdminStatsPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/stats/summary?days=${days}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [days]);
  useEffect(() => {
    load();
  }, [load]);

  const t = data?.totals;

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-16">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider">Estatísticas do site</h1>
              <p className="text-xs text-gray-400">Visitas, cliques, tempo e de onde vêm os ouvintes. Horários no fuso de Brasília.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer ${days === r.days ? 'bg-red-600 border-red-600' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}
              >
                {r.label}
              </button>
            ))}
            <button onClick={load} className="text-xs px-3 py-2 rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 cursor-pointer" aria-label="Atualizar">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {!data || !t ? (
          <p className="text-center text-gray-400 py-16">{loading ? 'Carregando...' : 'Não deu para carregar as estatísticas.'}</p>
        ) : t.sessions === 0 ? (
          <p className="text-center text-gray-400 py-16">Nenhuma visita registrada neste período ainda.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi label="Visitas" value={t.sessions.toLocaleString('pt-BR')} hint={`${t.pageviews.toLocaleString('pt-BR')} páginas vistas`} />
              <Kpi label="Pessoas" value={t.visitors.toLocaleString('pt-BR')} hint={`${t.returning} já tinham vindo antes`} />
              <Kpi label="Tempo médio no site" value={dur(t.avgDuration)} hint={`${pct(t.bounces, t.sessions)} saíram em menos de 10 s`} />
              <Kpi label="Deram play" value={pct(t.listeners, t.sessions)} hint={`${t.listeners} visitas ouviram a rádio`} />
              <Kpi label="Tempo médio ouvindo" value={dur(t.avgListen)} hint="entre quem deu play" />
              <Kpi label="Horas ouvidas pelo site" value={t.listenHours.toLocaleString('pt-BR')} hint="soma de todas as visitas" />
            </div>

            <Card title="Visitas por dia">
              <DayChart rows={data.byDay} />
            </Card>

            <Card title="Horário em que as pessoas chegam">
              <HourChart hours={data.byHour} />
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card title="O que mais clicam">
                <Ranking items={data.clicks.map((c) => ({ ...c, label: c.section ? `${c.label} · ${sectionName(c.section)}` : c.label }))} />
              </Card>
              <Card title="Partes da página mais clicadas">
                <Ranking items={data.sections.map((s) => ({ ...s, label: sectionName(s.label) }))} />
              </Card>
              <Card title="Música tocando quando deram play">
                <Ranking items={data.plays} empty="Ninguém deu play neste período." />
              </Card>
              <Card title="Lendas mais abertas">
                <Ranking items={data.legends} empty="Nenhuma lenda aberta neste período." />
              </Card>
              <Card title="Curiosidades curtidas">
                <Ranking items={data.likes} empty="Nenhuma curtida neste período." />
              </Card>
              <Card title="Curiosidades compartilhadas">
                <Ranking items={data.shares} empty="Nenhum compartilhamento neste período." />
              </Card>
              <Card title="Cidades">
                <Ranking items={data.cities.map((c) => ({ ...c, label: c.label.replace(/, ([A-Z]{2})$/, (_, cc) => `, ${COUNTRY[cc] ?? cc}`) }))} />
              </Card>
              <Card title="Estados e países">
                <Ranking items={data.regions.map((c) => ({ ...c, label: c.label.replace(/, ([A-Z]{2})$/, (_, cc) => `, ${COUNTRY[cc] ?? cc}`) }))} />
              </Card>
              <Card title="De onde vieram">
                <Ranking items={data.referrers.map((r) => ({ ...r, label: r.label === 'direto' ? 'Direto (digitou o endereço, favorito ou app)' : r.label }))} />
              </Card>
              <Card title="Aparelho">
                <Ranking items={data.devices} />
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-[11px] text-gray-500 mb-2">Sistema</p>
                    <Ranking items={data.os} compact />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 mb-2">Navegador</p>
                    <Ranking items={data.browsers} compact />
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Últimas visitas">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs">
                  <thead className="text-gray-500 text-left">
                    <tr>
                      <th className="p-2 font-normal">Quando</th>
                      <th className="p-2 font-normal">Local</th>
                      <th className="p-2 font-normal">Aparelho</th>
                      <th className="p-2 font-normal">Veio de</th>
                      <th className="p-2 font-normal text-right">No site</th>
                      <th className="p-2 font-normal text-right">Ouvindo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r, i) => (
                      <tr key={i} className="border-t border-white/5 text-gray-200">
                        <td className="p-2 whitespace-nowrap">
                          {new Date(r.startedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </td>
                        <td className="p-2">{r.place}</td>
                        <td className="p-2 whitespace-nowrap">{r.device}</td>
                        <td className="p-2">{r.referrer}</td>
                        <td className="p-2 text-right whitespace-nowrap">{dur(r.duration)}</td>
                        <td className="p-2 text-right whitespace-nowrap">{r.listenSeconds ? dur(r.listenSeconds) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <p className="text-[11px] text-gray-600">
              A cidade é estimada pela conexão e pode apontar para a cidade do provedor de internet. Localização por IP:{' '}
              <a href="https://db-ip.com" target="_blank" rel="noreferrer" className="underline">
                DB-IP
              </a>{' '}
              (CC BY 4.0). Quem usa &quot;Não rastrear&quot; no navegador não entra nos números.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-4">
      <p className="text-[11px] uppercase tracking-widest text-gray-500">{label}</p>
      <p className="text-2xl font-black mt-1">{value}</p>
      {hint && <p className="text-[11px] text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-white/10 bg-white/[0.02] rounded-2xl p-5">
      <h2 className="text-xs uppercase tracking-[0.25em] text-red-500 font-bold mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Ranking({ items, empty = 'Sem dados neste período.', compact }: { items: Item[]; empty?: string; compact?: boolean }) {
  if (!items.length) return <p className="text-xs text-gray-500">{empty}</p>;
  const max = Math.max(...items.map((i) => i.n));
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={`${it.label}-${i}`} className="relative">
          <div className="absolute inset-y-0 left-0 rounded-md bg-red-600/15" style={{ width: `${(it.n / max) * 100}%` }} />
          <div className={`relative flex justify-between gap-3 px-2 ${compact ? 'py-0.5 text-[11px]' : 'py-1 text-xs'}`}>
            <span className="truncate text-gray-200" title={it.label}>
              {it.label}
            </span>
            <span className="text-gray-400 flex-shrink-0">{it.n.toLocaleString('pt-BR')}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DayChart({ rows }: { rows: Summary['byDay'] }) {
  if (!rows.length) return <p className="text-xs text-gray-500">Sem dados.</p>;
  const max = Math.max(...rows.map((r) => r.sessions), 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-40">
        {rows.map((r) => (
          <div key={r.day} className="flex-1 h-full flex flex-col justify-end items-center group relative" title={`${r.day}: ${r.sessions} visitas, ${r.listeners} deram play`}>
            <div className="w-full max-w-[36px] bg-red-600/70 rounded-t relative" style={{ height: `${(r.sessions / max) * 100}%` }}>
              <div className="absolute bottom-0 inset-x-0 bg-white/70 rounded-t" style={{ height: `${r.sessions ? (r.listeners / r.sessions) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {rows.map((r, i) => (
          <span key={r.day} className="flex-1 text-center text-[10px] text-gray-500">
            {rows.length <= 14 || i % Math.ceil(rows.length / 10) === 0 ? r.day.slice(8, 10) + '/' + r.day.slice(5, 7) : ''}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mt-3 flex gap-4">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-600/70" /> visitas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-white/70" /> deram play
        </span>
      </p>
    </div>
  );
}

function HourChart({ hours }: { hours: number[] }) {
  const max = Math.max(...hours, 1);
  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {hours.map((n, h) => (
          <div key={h} className="flex-1 h-full flex items-end" title={`${h}h: ${n} visitas`}>
            <div className="w-full bg-red-600/70 rounded-t" style={{ height: `${(n / max) * 100}%`, minHeight: n ? 2 : 0 }} />
          </div>
        ))}
      </div>
      <div className="flex gap-1 mt-1">
        {hours.map((_, h) => (
          <span key={h} className="flex-1 text-center text-[10px] text-gray-500">
            {h % 3 === 0 ? `${h}h` : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
