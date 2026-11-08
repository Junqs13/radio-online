'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  BarChart3,
  RefreshCw,
  Users,
  Fingerprint,
  Clock,
  Layers,
  Headphones,
  Timer,
  Newspaper,
  Music2,
  MousePointerClick,
  type LucideIcon,
} from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';
import { AreaChart, Barra, Delta, Donut, Funil, Heatmap, Ranking, Sparkline, duracao, fmt } from './charts';

const Mapa = dynamic(() => import('./Mapa'), { ssr: false, loading: () => <div className="aspect-[800/520] rounded-2xl bg-white/[0.03] animate-pulse" /> });

interface Item {
  label: string;
  n: number;
  section?: string;
  visits?: number;
}
interface Totais {
  sessions: number;
  visitors: number;
  uniqueIps: number;
  pageviews: number;
  pagesPerVisit: number;
  avgDuration: number;
  listeners: number;
  playRate: number;
  avgListen: number;
  listenHours: number;
  bounces: number;
  bounceRate: number;
  articleViews: number;
  articleSessions: number;
  avgRead: number;
  requests: number;
  returning?: number;
}
interface Summary {
  days: number;
  totals: Totais & { returning: number };
  previous: Totais;
  series: { t: string; sessions: number; visitors: number; ips: number; listeners: number; pageviews: number }[];
  heat: number[][];
  points: { lat: number; lon: number; label: string; n: number }[];
  cities: Item[];
  regions: Item[];
  countries: Item[];
  devices: Item[];
  os: Item[];
  browsers: Item[];
  referrers: Item[];
  landing: Item[];
  pages: Item[];
  materias: { path: string; title: string | null; views: number; people: number; avgRead: number; avgScroll: number; finishedRate: number }[];
  clicks: Item[];
  sections: Item[];
  plays: Item[];
  legends: Item[];
  likes: Item[];
  shares: Item[];
  recent: {
    startedAt: string;
    place: string;
    device: string;
    os: string;
    browser: string;
    referrer: string;
    landing: string;
    pageviews: number;
    listenSeconds: number;
    duration: number;
  }[];
}
interface Live {
  active: number;
  listening: number;
  today: { sessions: number; visitors: number; ips: number };
  visits: { place: string; device: string; path: string; played: boolean; since: string }[];
}

const RANGES = [
  { days: 1, label: 'Hoje' },
  { days: 7, label: '7 dias' },
  { days: 30, label: '30 dias' },
  { days: 90, label: '90 dias' },
];

const SECTION: Record<string, string> = {
  header: 'Topo',
  home: 'Início',
  player: 'Player',
  pedidos: 'Pedidos',
  lendas: 'Lendas',
  materias: 'Matérias',
  materia: 'Página da matéria',
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
const COUNTRY: Record<string, string> = {
  BR: 'Brasil',
  US: 'Estados Unidos',
  PT: 'Portugal',
  AR: 'Argentina',
  JP: 'Japão',
  DE: 'Alemanha',
  GB: 'Reino Unido',
  ES: 'Espanha',
  FR: 'França',
  IT: 'Itália',
  CA: 'Canadá',
  CL: 'Chile',
  UY: 'Uruguai',
  PY: 'Paraguai',
  MX: 'México',
};
const pais = (l: string) => l.replace(/(^|, )([A-Z]{2})$/, (_, a, cc) => `${a}${COUNTRY[cc] ?? cc}`);
const slugBonito = (p: string) =>
  p
    .replace(/^\/materias\//, '')
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());

export default function AdminStatsPage() {
  const [days, setDays] = useState(7);
  const [data, setData] = useState<Summary | null>(null);
  const [live, setLive] = useState<Live | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrica, setMetrica] = useState<'sessions' | 'visitors' | 'ips' | 'listeners' | 'pageviews'>('sessions');

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

  // Ao vivo: atualiza a cada 15 s enquanto a aba do painel está aberta
  useEffect(() => {
    let vivo = true;
    const buscar = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const res = await apiFetch(`${API_URL}/stats/live`);
        if (res.ok && vivo) setLive(await res.json());
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    };
    buscar();
    const t = setInterval(buscar, 15_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  const t = data?.totals;
  const p = data?.previous;
  const hoje = days === 1;
  const rotulo = useCallback(
    (s: string) => (s.includes('T') ? `${Number(s.slice(11, 13))}h` : `${s.slice(8, 10)}/${s.slice(5, 7)}`),
    [],
  );
  const serie = (k: keyof Summary['series'][number]) => (data?.series ?? []).map((r) => Number(r[k]) || 0);

  // Título de cada matéria, para mostrar nos rankings de páginas
  const titulos = useMemo(() => new Map((data?.materias ?? []).map((m) => [m.path, m.title || slugBonito(m.path)])), [data]);
  const nomePagina = useCallback(
    (path: string) =>
      path === '/' ? 'Início' : path === '/materias' ? 'Lista de matérias' : path.startsWith('/materias/') ? titulos.get(path) ?? slugBonito(path) : path,
    [titulos],
  );

  const METRICAS = [
    { key: 'sessions', nome: 'Visitas', cor: '#E11D2E' },
    { key: 'visitors', nome: 'Pessoas', cor: '#7C3AED' },
    { key: 'ips', nome: 'IPs diferentes', cor: '#06B6D4' },
    { key: 'listeners', nome: 'Deram play', cor: '#F59E0B' },
    { key: 'pageviews', nome: 'Páginas vistas', cor: '#22C55E' },
  ] as const;
  const atual = METRICAS.find((m) => m.key === metrica)!;

  return (
    <div className="min-h-screen bg-[#050507] text-white p-4 sm:p-6 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600/30 to-violet-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide">Métricas do site</h1>
              <p className="text-xs text-gray-400">Visitas, leitura das matérias, cliques e de onde vem o público. Fuso de Brasília.</p>
            </div>
          </div>
          <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-white/[0.03]">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer transition ${days === r.days ? 'bg-red-600 text-white shadow-[0_0_20px_rgba(225,29,46,.35)]' : 'text-gray-300 hover:bg-white/5'}`}
              >
                {r.label}
              </button>
            ))}
            <button onClick={load} className="px-2.5 py-1.5 rounded-lg text-gray-300 hover:bg-white/5 cursor-pointer" aria-label="Atualizar">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* AO VIVO */}
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-red-600/[0.12] via-white/[0.02] to-violet-600/[0.10] p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-10 gap-y-5">
            <div className="flex items-center gap-4">
              <span className="relative flex w-3 h-3">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                <span className="relative inline-flex w-3 h-3 rounded-full bg-red-500" />
              </span>
              <div>
                <p className="text-[0.6875rem] uppercase tracking-[0.25em] text-red-400 font-bold">Agora no site</p>
                <p className="text-5xl font-black leading-none mt-1 tabular-nums">{live ? fmt(live.active) : '–'}</p>
              </div>
            </div>
            <Mini label="Deram play nesta visita" valor={live ? fmt(live.listening) : '–'} />
            <Mini label="Visitas hoje" valor={live ? fmt(live.today.sessions) : '–'} />
            <Mini label="Pessoas hoje" valor={live ? fmt(live.today.visitors) : '–'} />
            <Mini label="IPs diferentes hoje" valor={live ? fmt(live.today.ips) : '–'} />
          </div>
          {!!live?.visits.length && (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {live.visits.map((v, i) => (
                <div key={i} className="flex-shrink-0 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs min-w-[11rem]">
                  <p className="font-semibold text-gray-100 truncate">{v.place}</p>
                  <p className="text-gray-400 truncate">{nomePagina(v.path)}</p>
                  <p className="text-gray-600 mt-0.5">
                    {v.device}
                    {v.played && <span className="text-red-400"> · ouvindo</span>}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {!data || !t || !p ? (
          <p className="text-center text-gray-400 py-16">{loading ? 'Carregando...' : 'Não deu para carregar as métricas.'}</p>
        ) : t.sessions === 0 ? (
          <p className="text-center text-gray-400 py-16">Nenhuma visita registrada neste período ainda.</p>
        ) : (
          <>
            {/* NÚMEROS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Kpi icon={Users} label="Visitas" valor={fmt(t.sessions)} atual={t.sessions} anterior={p.sessions} spark={serie('sessions')} hint={`${fmt(t.visitors)} pessoas diferentes`} />
              <Kpi
                icon={Fingerprint}
                label={hoje ? 'IPs diferentes' : 'IPs diferentes por dia'}
                valor={fmt(hoje ? t.uniqueIps : Math.round(t.uniqueIps / Math.max(1, data.series.length)))}
                atual={t.uniqueIps}
                anterior={p.uniqueIps}
                spark={serie('ips')}
                cor="#06B6D4"
                hint={hoje ? 'conexões diferentes hoje' : `média; ${fmt(t.uniqueIps)} somando os dias`}
              />
              <Kpi icon={Clock} label="Tempo médio no site" valor={duracao(t.avgDuration)} atual={t.avgDuration} anterior={p.avgDuration} cor="#7C3AED" hint={`${t.bounceRate}% saíram em menos de 10 s`} />
              <Kpi icon={Layers} label="Páginas por visita" valor={t.pagesPerVisit.toLocaleString('pt-BR')} atual={t.pagesPerVisit} anterior={p.pagesPerVisit} spark={serie('pageviews')} cor="#22C55E" hint={`${fmt(t.pageviews)} páginas vistas`} />
              <Kpi icon={Headphones} label="Deram play" valor={`${t.playRate.toLocaleString('pt-BR')}%`} atual={t.playRate} anterior={p.playRate} spark={serie('listeners')} cor="#F59E0B" hint={`${fmt(t.listeners)} visitas ouviram a rádio`} />
              <Kpi icon={Timer} label="Tempo médio ouvindo" valor={duracao(t.avgListen)} atual={t.avgListen} anterior={p.avgListen} cor="#EC4899" hint={`${t.listenHours.toLocaleString('pt-BR')} h ouvidas pelo site`} />
              <Kpi icon={Newspaper} label="Matérias lidas" valor={fmt(t.articleViews)} atual={t.articleViews} anterior={p.articleViews} cor="#E11D2E" hint={`leitura média de ${duracao(t.avgRead)}`} />
              <Kpi icon={Music2} label="Pedidos de música" valor={fmt(t.requests)} atual={t.requests} anterior={p.requests} cor="#7C3AED" hint={`${fmt(t.returning)} pessoas voltaram ao site`} />
            </div>

            {/* GRÁFICO PRINCIPAL */}
            <Card
              titulo={hoje ? 'Hora a hora' : 'Dia a dia'}
              acao={
                <div className="flex flex-wrap gap-1">
                  {METRICAS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMetrica(m.key)}
                      className={`text-[0.6875rem] px-2.5 py-1 rounded-lg border cursor-pointer flex items-center gap-1.5 ${metrica === m.key ? 'border-white/25 bg-white/10 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: m.cor }} />
                      {m.nome}
                    </button>
                  ))}
                </div>
              }
            >
              <AreaChart
                rows={data.series}
                rotulo={rotulo}
                series={metrica === 'sessions' ? [atual, { key: 'listeners', nome: 'Deram play', cor: '#F59E0B' }] : [atual]}
              />
            </Card>

            {/* MATÉRIAS */}
            <Card titulo="Matérias mais acessadas" sub="Vistas, pessoas, tempo lendo e quanto do texto foi lido">
              {data.materias.length ? (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs">
                    <thead className="text-gray-500 text-left">
                      <tr>
                        <th className="p-2 font-normal w-8">#</th>
                        <th className="p-2 font-normal">Matéria</th>
                        <th className="p-2 font-normal text-right">Vistas</th>
                        <th className="p-2 font-normal text-right">Pessoas</th>
                        <th className="p-2 font-normal text-right whitespace-nowrap">Tempo lendo</th>
                        <th className="p-2 font-normal">Quanto leram</th>
                        <th className="p-2 font-normal text-right whitespace-nowrap">Até o fim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.materias.map((m, i) => {
                        const max = data.materias[0].views || 1;
                        return (
                          <tr key={m.path} className="border-t border-white/5 text-gray-200 hover:bg-white/[0.02]">
                            <td className={`p-2 font-black ${i < 3 ? 'text-red-500' : 'text-gray-600'}`}>{i + 1}</td>
                            <td className="p-2 min-w-[14rem]">
                              <a href={m.path} target="_blank" rel="noreferrer" className="hover:text-white hover:underline">
                                {m.title || slugBonito(m.path)}
                              </a>
                              <div className="h-1 mt-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-red-600 to-violet-600" style={{ width: `${(m.views / max) * 100}%` }} />
                              </div>
                            </td>
                            <td className="p-2 text-right tabular-nums font-semibold">{fmt(m.views)}</td>
                            <td className="p-2 text-right tabular-nums">{fmt(m.people)}</td>
                            <td className="p-2 text-right whitespace-nowrap">{m.avgRead ? duracao(m.avgRead) : '–'}</td>
                            <td className="p-2">{m.avgScroll ? <Barra pct={m.avgScroll} /> : <span className="text-gray-600">–</span>}</td>
                            <td className="p-2 text-right tabular-nums">{m.finishedRate ? `${m.finishedRate}%` : '–'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Nenhuma matéria aberta neste período.</p>
              )}
            </Card>

            {/* MAPA + CIDADES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card titulo="De onde acessam" className="lg:col-span-2">
                <Mapa points={data.points} />
              </Card>
              <Card titulo="Cidades">
                <Ranking items={data.cities.map((c) => ({ ...c, label: pais(c.label) }))} limite={12} />
              </Card>
            </div>

            {/* QUANDO + ENGAJAMENTO */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card titulo="Quando as pessoas chegam" sub="Dia da semana e hora" className="lg:col-span-2">
                <Heatmap heat={data.heat} />
              </Card>
              <Card titulo="Engajamento">
                <Funil
                  etapas={[
                    { label: 'Visitas', n: t.sessions },
                    { label: 'Ficaram mais de 10 s', n: t.sessions - t.bounces },
                    { label: 'Deram play na rádio', n: t.listeners },
                    { label: 'Abriram uma matéria', n: t.articleSessions },
                    { label: 'Pedidos de música', n: t.requests, nota: 'contados pelos pedidos recebidos' },
                  ]}
                />
              </Card>
            </div>

            {/* ROSCAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card titulo="Aparelho">
                <Donut items={data.devices} sub="visitas" />
              </Card>
              <Card titulo="Público">
                <Donut
                  items={[
                    { label: 'Primeira vez', n: Math.max(0, t.visitors - t.returning) },
                    { label: 'Já tinham vindo', n: t.returning },
                  ]}
                  centro={fmt(t.visitors)}
                  sub="pessoas"
                />
              </Card>
              <Card titulo="De onde vieram">
                <Donut items={data.referrers.map((r) => ({ ...r, label: r.label === 'direto' ? 'Direto' : r.label }))} sub="visitas" />
              </Card>
            </div>

            {/* CLIQUES E PÁGINAS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card titulo="O que mais clicam" icone={MousePointerClick}>
                <Ranking items={data.clicks.map((c) => ({ ...c, extra: sectionName(c.section) }))} limite={12} />
              </Card>
              <Card titulo="Partes da página mais clicadas">
                <Ranking items={data.sections.map((s) => ({ ...s, label: sectionName(s.label) }))} cor="#7C3AED" />
              </Card>
              <Card titulo="Páginas mais vistas">
                <Ranking items={data.pages.map((pg) => ({ ...pg, label: nomePagina(pg.label) }))} cor="#06B6D4" />
                <p className="text-[0.6875rem] text-gray-500 mt-4 mb-2 uppercase tracking-widest">Por onde entraram</p>
                <Ranking items={data.landing.map((l) => ({ ...l, label: nomePagina(l.label) }))} cor="#22C55E" limite={5} />
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card titulo="Tocando quando deram play">
                <Ranking items={data.plays} empty="Ninguém deu play neste período." cor="#F59E0B" limite={8} />
              </Card>
              <Card titulo="Lendas mais abertas">
                <Ranking items={data.legends} empty="Nenhuma lenda aberta neste período." cor="#EC4899" limite={8} />
              </Card>
              <Card titulo="Curiosidades curtidas">
                <Ranking items={data.likes} empty="Nenhuma curtida neste período." limite={8} />
              </Card>
              <Card titulo="Curiosidades compartilhadas">
                <Ranking items={data.shares} empty="Nenhum compartilhamento neste período." cor="#7C3AED" limite={8} />
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card titulo="Estados">
                <Ranking items={data.regions.map((r) => ({ ...r, label: pais(r.label) }))} limite={8} />
              </Card>
              <Card titulo="Países">
                <Ranking items={data.countries.map((r) => ({ ...r, label: pais(r.label) }))} cor="#7C3AED" limite={8} />
              </Card>
              <Card titulo="Sistema">
                <Ranking items={data.os} cor="#06B6D4" limite={8} />
              </Card>
              <Card titulo="Navegador">
                <Ranking items={data.browsers} cor="#22C55E" limite={8} />
              </Card>
            </div>

            <Card titulo="Últimas visitas">
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-xs">
                  <thead className="text-gray-500 text-left">
                    <tr>
                      <th className="p-2 font-normal">Quando</th>
                      <th className="p-2 font-normal">Local</th>
                      <th className="p-2 font-normal">Aparelho</th>
                      <th className="p-2 font-normal">Veio de</th>
                      <th className="p-2 font-normal">Entrou por</th>
                      <th className="p-2 font-normal text-right">Páginas</th>
                      <th className="p-2 font-normal text-right">No site</th>
                      <th className="p-2 font-normal text-right">Ouvindo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((r, i) => (
                      <tr key={i} className="border-t border-white/5 text-gray-200 hover:bg-white/[0.02]">
                        <td className="p-2 whitespace-nowrap text-gray-400">
                          {new Date(r.startedAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })}
                        </td>
                        <td className="p-2">{pais(r.place)}</td>
                        <td className="p-2 whitespace-nowrap">
                          {r.device} <span className="text-gray-500">· {r.os} · {r.browser}</span>
                        </td>
                        <td className="p-2">{r.referrer}</td>
                        <td className="p-2 max-w-[14rem] truncate">{nomePagina(r.landing)}</td>
                        <td className="p-2 text-right tabular-nums">{r.pageviews}</td>
                        <td className="p-2 text-right whitespace-nowrap">{duracao(r.duration)}</td>
                        <td className="p-2 text-right whitespace-nowrap">{r.listenSeconds ? duracao(r.listenSeconds) : '–'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <p className="text-xs text-gray-600 leading-relaxed">
              O IP não é guardado. Para contar IPs diferentes, o servidor guarda só uma impressão embaralhada que muda todo dia e não permite voltar ao IP. A
              cidade é estimada pela conexão e pode apontar para a cidade do provedor. Localização por IP:{' '}
              <a href="https://db-ip.com" target="_blank" rel="noreferrer" className="underline">
                DB-IP
              </a>{' '}
              (CC BY 4.0). Quem usa &quot;Não rastrear&quot; no navegador não entra nos números. A comparação (▲▼) é com o mesmo número de dias logo antes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Mini({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-[0.6875rem] uppercase tracking-widest text-gray-500">{label}</p>
      <p className="text-2xl font-black mt-1 tabular-nums">{valor}</p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  valor,
  hint,
  atual,
  anterior,
  spark,
  cor = '#E11D2E',
}: {
  icon: LucideIcon;
  label: string;
  valor: string;
  hint?: string;
  atual: number;
  anterior: number;
  spark?: number[];
  cor?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] p-3 sm:p-4 hover:border-white/20 transition">
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-25" style={{ background: cor }} />
      <div className="relative flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-gray-400">
          <span className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: `${cor}22`, color: cor }}>
            <Icon className="w-3.5 h-3.5" />
          </span>
          <p className="text-[0.625rem] sm:text-[0.6875rem] uppercase tracking-wider sm:tracking-widest leading-tight">{label}</p>
        </div>
        <Delta atual={atual} anterior={anterior} />
      </div>
      <p className="relative text-[1.375rem] sm:text-3xl font-black mt-3 tabular-nums tracking-tight whitespace-nowrap">{valor}</p>
      {hint && <p className="relative text-[0.6875rem] text-gray-500 mt-1">{hint}</p>}
      <div className="relative mt-2 -mx-1">{spark ? <Sparkline values={spark} cor={cor} /> : <div className="h-10" />}</div>
    </div>
  );
}

function Card({
  titulo,
  sub,
  acao,
  icone: Icone,
  className = '',
  children,
}: {
  titulo: string;
  sub?: string;
  acao?: React.ReactNode;
  icone?: LucideIcon;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-[0.6875rem] uppercase tracking-[0.25em] text-red-500 font-bold flex items-center gap-2">
            {Icone && <Icone className="w-3.5 h-3.5" />}
            {titulo}
          </h2>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {acao}
      </div>
      {children}
    </section>
  );
}
