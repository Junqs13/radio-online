'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Newspaper,
  Plus,
  Search,
  Pencil,
  Eye,
  EyeOff,
  Pin,
  PinOff,
  Trash2,
  RotateCcw,
  ExternalLink,
  RefreshCw,
  ImageOff,
  BarChart3,
} from 'lucide-react';
import { CATEGORIAS, categoria, dataCurta } from '@/lib/materias';
import { apagar, carregarLinhas, salvar, type Linha } from './dados';

const btn = 'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors';
const ESTADOS = [
  ['todas', 'Todas'],
  ['no-ar', 'No ar'],
  ['fixadas', 'Fixadas'],
  ['editadas', 'Editadas'],
  ['ocultas', 'Fora do site'],
  ['rascunhos', 'Rascunhos'],
] as const;

export default function AdminMateriasPage() {
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');
  const [cat, setCat] = useState('');
  const [origem, setOrigem] = useState<'' | 'geek' | 'site'>('');
  const [estado, setEstado] = useState<(typeof ESTADOS)[number][0]>('todas');
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');

  const carregar = useCallback(async () => {
    setErro('');
    try {
      setLinhas(await carregarLinhas());
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro ao carregar.');
    }
  }, []);
  useEffect(() => {
    carregar();
  }, [carregar]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return (linhas ?? []).filter((l) => {
      if (cat && l.categoria !== cat) return false;
      if (origem && l.origem !== origem) return false;
      if (estado === 'no-ar' && (l.oculta || l.rascunho || l.agendada)) return false;
      if (estado === 'fixadas' && !l.fixada) return false;
      if (estado === 'editadas' && !l.editada) return false;
      if (estado === 'ocultas' && !l.oculta) return false;
      if (estado === 'rascunhos' && !l.rascunho) return false;
      if (q && !`${l.titulo} ${l.linhaFina ?? ''} ${l.tags.join(' ')}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [linhas, busca, cat, origem, estado]);

  const contagem = useMemo(() => {
    const l = linhas ?? [];
    return {
      total: l.length,
      noAr: l.filter((x) => !x.oculta && !x.rascunho && !x.agendada).length,
      doSite: l.filter((x) => x.origem === 'site').length,
      ocultas: l.filter((x) => x.oculta).length,
    };
  }, [linhas]);

  const acao = async (l: Linha, fn: () => Promise<unknown>, texto: string) => {
    setOcupado(l.slug);
    try {
      await fn();
      setAviso(texto);
      await carregar();
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'Algo deu errado.');
    } finally {
      setOcupado(null);
      setTimeout(() => setAviso(''), 3500);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-4 sm:p-6 lg:p-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600/30 to-violet-600/20 border border-red-500/30 grid place-items-center text-red-400">
              <Newspaper className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wide">Matérias</h1>
              <p className="text-xs text-gray-400">
                As do geek-news chegam sozinhas. Aqui você edita, troca a foto, fixa no topo, tira do site ou escreve matérias novas. Aparece no site em segundos.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={carregar} className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`} aria-label="Atualizar">
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <Link href="/admin/materias/editar?nova=1" className={`${btn} bg-red-600 border-red-600 text-white hover:bg-red-500 !text-sm !px-4 !py-2`}>
              <Plus className="w-4 h-4" /> Nova matéria
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['No total', contagem.total],
            ['No ar', contagem.noAr],
            ['Escritas no site', contagem.doSite],
            ['Fora do site', contagem.ocultas],
          ].map(([t, n]) => (
            <div key={t} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
              <p className="text-[0.6875rem] uppercase tracking-widest text-gray-500">{t}</p>
              <p className="text-3xl font-black mt-1 tabular-nums">{linhas ? n : '–'}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="relative flex-1 min-w-[14rem]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por título, linha fina ou tag"
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-red-500"
              />
            </label>
            <select value={origem} onChange={(e) => setOrigem(e.target.value as typeof origem)} className="bg-black/40 border border-white/10 rounded-xl px-3 text-sm">
              <option value="">Todas as origens</option>
              <option value="geek">Do geek-news</option>
              <option value="site">Escritas no site</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ESTADOS.map(([v, t]) => (
              <button key={v} onClick={() => setEstado(v)} className={`${btn} ${estado === v ? 'bg-white/10 border-white/25 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>
                {t}
              </button>
            ))}
            <span className="w-px bg-white/10 mx-1" />
            <button onClick={() => setCat('')} className={`${btn} ${!cat ? 'bg-white/10 border-white/25 text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}>
              Todas as categorias
            </button>
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`${btn} ${cat === c.id ? 'text-white' : 'border-white/10 text-gray-400 hover:text-white'}`}
                style={cat === c.id ? { background: `${c.cor}33`, borderColor: c.cor } : undefined}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: c.cor }} />
                {c.nome}
              </button>
            ))}
          </div>
        </div>

        {aviso && <p className="text-sm rounded-xl border border-white/10 bg-white/5 px-4 py-2.5">{aviso}</p>}
        {erro && <p className="text-sm text-red-400">{erro}</p>}

        {!linhas ? (
          <p className="text-gray-400 text-center py-16">Carregando...</p>
        ) : !lista.length ? (
          <p className="text-gray-400 text-center py-16">Nenhuma matéria com esses filtros.</p>
        ) : (
          <ul className="space-y-2.5">
            {lista.map((l) => {
              const c = categoria(l.categoria);
              const fora = l.oculta || l.rascunho;
              return (
                <li
                  key={l.slug}
                  className={`flex flex-col sm:flex-row gap-4 rounded-2xl border p-3 transition ${fora ? 'border-white/5 bg-white/[0.01] opacity-60 hover:opacity-100' : 'border-white/10 bg-white/[0.025] hover:border-white/20'} ${ocupado === l.slug ? 'animate-pulse' : ''}`}
                >
                  <Link href={`/admin/materias/editar?slug=${l.slug}`} className="relative flex-shrink-0 w-full sm:w-40 aspect-[16/10] rounded-xl overflow-hidden bg-black/40">
                    {l.imagem ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imagem} alt="" className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full grid place-items-center" style={{ background: `radial-gradient(120% 90% at 15% 10%, ${c.cor}55, transparent 60%), #0b0a10` }}>
                        <ImageOff className="w-5 h-5 text-white/40" />
                      </div>
                    )}
                    {l.fixada && (
                      <span className="absolute top-1.5 left-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[0.625rem] font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3" /> FIXADA
                      </span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[0.6875rem]">
                      <span className="font-bold uppercase tracking-wider" style={{ color: c.cor }}>
                        {c.nome}
                      </span>
                      <span className="text-gray-600">·</span>
                      <span className="text-gray-400">{dataCurta(l.publicadaEm)}</span>
                      <Selo cor={l.origem === 'site' ? '#7C3AED' : '#64748B'}>{l.origem === 'site' ? 'Escrita no site' : 'geek-news'}</Selo>
                      {l.editada && <Selo cor="#F59E0B">Editada</Selo>}
                      {l.oculta && <Selo cor="#E11D2E">Fora do site</Selo>}
                      {l.rascunho && <Selo cor="#06B6D4">Rascunho</Selo>}
                      {l.agendada && !l.rascunho && <Selo cor="#22C55E">Agendada</Selo>}
                    </div>
                    <Link href={`/admin/materias/editar?slug=${l.slug}`} className="block font-bold text-white mt-1.5 leading-snug hover:text-red-200">
                      {l.titulo}
                    </Link>
                    {l.linhaFina && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{l.linhaFina}</p>}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {l.tags.slice(0, 6).map((t) => (
                        <span key={t} className="text-[0.6875rem] text-gray-400 bg-white/5 rounded-md px-1.5 py-0.5">
                          #{t}
                        </span>
                      ))}
                      <span className="text-[0.6875rem] text-gray-500 flex items-center gap-1 ml-auto">
                        <BarChart3 className="w-3 h-3" /> {l.vistas} vistas em 30 dias
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col flex-wrap gap-1.5 sm:w-36 flex-shrink-0">
                    <Link href={`/admin/materias/editar?slug=${l.slug}`} className={`${btn} border-white/15 text-white hover:bg-white/10`}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </Link>
                    {!fora && !l.agendada && (
                      <a href={`/materias/${l.slug}`} target="_blank" rel="noreferrer" className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}>
                        <ExternalLink className="w-3.5 h-3.5" /> Ver no site
                      </a>
                    )}
                    <button
                      disabled={!!ocupado}
                      onClick={() => acao(l, () => salvar(l.slug, { fixada: !l.fixada }), l.fixada ? 'Matéria solta do topo.' : 'Matéria fixada no topo da lista e da home.')}
                      className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}
                    >
                      {l.fixada ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />} {l.fixada ? 'Soltar' : 'Fixar no topo'}
                    </button>
                    <button
                      disabled={!!ocupado}
                      onClick={() => acao(l, () => salvar(l.slug, { oculta: !l.oculta }), l.oculta ? 'Matéria de volta ao site.' : 'Matéria tirada do site.')}
                      className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}
                    >
                      {l.oculta ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} {l.oculta ? 'Voltar ao site' : 'Tirar do site'}
                    </button>
                    {l.origem === 'geek' && l.registro && (
                      <button
                        disabled={!!ocupado}
                        onClick={() =>
                          confirm('Desfazer todas as mudanças desta matéria e voltar ao texto original do geek-news?') &&
                          acao(l, () => apagar(l.slug), 'Matéria voltou ao original do geek-news.')
                        }
                        className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Original
                      </button>
                    )}
                    {l.origem === 'site' && (
                      <button
                        disabled={!!ocupado}
                        onClick={() => confirm(`Excluir de vez "${l.titulo}"? Não dá para desfazer.`) && acao(l, () => apagar(l.slug), 'Matéria excluída.')}
                        className={`${btn} border-red-500/30 text-red-300 hover:bg-red-500/10`}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-gray-600 leading-relaxed">
          As matérias do geek-news continuam sendo criadas lá. O que você muda aqui fica no banco do site e vale só para o site: o geek-news não é alterado. Se o
          geek-news retirar uma matéria, ela sai do site mesmo que tenha sido editada aqui.
        </p>
      </div>
    </div>
  );
}

function Selo({ cor, children }: { cor: string; children: React.ReactNode }) {
  return (
    <span className="rounded-md px-1.5 py-0.5 font-semibold" style={{ background: `${cor}22`, color: cor }}>
      {children}
    </span>
  );
}
