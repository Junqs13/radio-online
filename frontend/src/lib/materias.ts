// Matérias do site. Quem escreve e publica é o sistema geek-news (painel de curadoria);
// o site só lê a view pública materias_site do Supabase dele, que traz apenas matérias publicadas.
// A chave abaixo é a publishable: só enxerga essa view, por isso pode ficar no front-end.
export const MATERIAS_URL = process.env.NEXT_PUBLIC_MATERIAS_SUPABASE_URL || 'https://kjvbngcouygwfuuylzsh.supabase.co';
export const MATERIAS_KEY = process.env.NEXT_PUBLIC_MATERIAS_SUPABASE_KEY || 'sb_publishable_XvcHgpqqn6vJOl58pxkOCw_OGG7PY6a';

/** Só o sitemap guarda a resposta (5 minutos). Lista e matéria buscam a cada visita, para bater com o painel na hora. */
export const MATERIAS_REVALIDATE = 300;
export const POR_PAGINA = 12;

export type Categoria = 'games' | 'filmes' | 'series' | 'anime' | 'quadrinhos' | 'musica' | 'tech' | 'outros';

export interface MateriaResumo {
  id: number;
  titulo: string;
  slug: string;
  linha_fina: string | null;
  categoria: Categoria | string;
  imagem_url: string | null;
  publicada_em: string;
}

export interface Materia extends MateriaResumo {
  corpo_md: string;
  tags: string[] | null;
  updated_at: string;
}

// Música primeiro: é a casa da rádio
export const CATEGORIAS: { id: Categoria; nome: string; cor: string }[] = [
  { id: 'musica', nome: 'Música', cor: '#E11D2E' },
  { id: 'filmes', nome: 'Filmes', cor: '#F59E0B' },
  { id: 'series', nome: 'Séries', cor: '#06B6D4' },
  { id: 'games', nome: 'Games', cor: '#7C3AED' },
  { id: 'anime', nome: 'Anime', cor: '#EC4899' },
  { id: 'quadrinhos', nome: 'Quadrinhos', cor: '#EAB308' },
  { id: 'tech', nome: 'Tech', cor: '#3B82F6' },
  { id: 'outros', nome: 'Cultura pop', cor: '#A78BFA' },
];

export function categoria(id: string) {
  return CATEGORIAS.find((c) => c.id === id) ?? { id: 'outros' as Categoria, nome: 'Cultura pop', cor: '#A78BFA' };
}

export const isCategoria = (v: unknown): v is Categoria => typeof v === 'string' && CATEGORIAS.some((c) => c.id === v);

const RESUMO = 'id,titulo,slug,linha_fina,categoria,imagem_url,publicada_em';

/** Consulta a view pelo REST do Supabase. Sem guardar resposta, a não ser que peça (o sitemap pede). */
async function consulta(params: URLSearchParams, extra: Record<string, string> = {}, guardar = false) {
  const init: RequestInit & { next?: { revalidate: number } } = {
    headers: { apikey: MATERIAS_KEY, Accept: 'application/json', ...extra },
  };
  if (guardar && typeof window === 'undefined') init.next = { revalidate: MATERIAS_REVALIDATE };
  else init.cache = 'no-store';
  const res = await fetch(`${MATERIAS_URL}/rest/v1/materias_site?${params}`, init);
  if (!res.ok) throw new Error(`Matérias: resposta ${res.status}`);
  return res;
}

/**
 * Página N da lista. A primeira traz uma a mais, porque a mais recente ocupa a linha inteira em destaque
 * e as outras 12 fecham a grade certinho. total = quantas existem ao todo, para a paginação.
 */
export const inicioDaPagina = (pagina: number) => (pagina <= 1 ? 0 : POR_PAGINA + 1 + (pagina - 2) * POR_PAGINA);
export const totalDePaginas = (total: number) => 1 + Math.ceil(Math.max(0, total - POR_PAGINA - 1) / POR_PAGINA);

export async function listarMaterias({ categoria: cat, pagina = 1, porPagina }: { categoria?: Categoria; pagina?: number; porPagina?: number } = {}) {
  const limite = porPagina ?? (pagina <= 1 ? POR_PAGINA + 1 : POR_PAGINA);
  const inicio = porPagina ? (pagina - 1) * porPagina : inicioDaPagina(pagina);
  const p = new URLSearchParams({ select: RESUMO, order: 'publicada_em.desc', limit: String(limite), offset: String(inicio) });
  if (cat) p.set('categoria', `eq.${cat}`);
  const res = await consulta(p, { Prefer: 'count=exact' });
  const itens = (await res.json()) as MateriaResumo[];
  const total = Number(res.headers.get('content-range')?.split('/')[1]) || itens.length;
  return { itens, total };
}

export async function buscarMateria(slug: string) {
  const p = new URLSearchParams({ select: '*', slug: `eq.${slug}`, limit: '1' });
  const [m] = (await (await consulta(p)).json()) as Materia[];
  return m ?? null;
}

/** "Leia também": as mais recentes da mesma categoria, sem repetir a que está aberta */
export async function relacionadas(cat: string, slugAtual: string, quantas = 3) {
  const p = new URLSearchParams({
    select: RESUMO,
    categoria: `eq.${cat}`,
    slug: `neq.${slugAtual}`,
    order: 'publicada_em.desc',
    limit: String(quantas),
  });
  return (await (await consulta(p)).json()) as MateriaResumo[];
}

/** Tudo que precisa entrar no sitemap */
export async function slugsParaSitemap() {
  const p = new URLSearchParams({ select: 'slug,updated_at', order: 'publicada_em.desc', limit: '5000' });
  return (await (await consulta(p, {}, true)).json()) as { slug: string; updated_at: string }[];
}

const dia = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
const diaAno = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' });
const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' });
const extenso = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Data fixa, igual no servidor e no navegador: 05/11 (ou 05/11/2025 se for de outro ano) */
export function dataCurta(iso: string, agora = new Date()) {
  const d = new Date(iso);
  return ymd.format(d).slice(0, 4) === ymd.format(agora).slice(0, 4) ? dia.format(d) : diaAno.format(d);
}

export const dataExtenso = (iso: string) => extenso.format(new Date(iso));

/** "agora", "há 12 min", "há 2 h", "ontem" ou a data curta */
export function quando(iso: string, agora = new Date()) {
  const d = new Date(iso);
  const min = Math.floor((agora.getTime() - d.getTime()) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const hoje = ymd.format(agora);
  if (ymd.format(d) === hoje) return `há ${Math.floor(min / 60)} h`;
  const ontem = ymd.format(new Date(agora.getTime() - 86400000));
  if (ymd.format(d) === ontem) return 'ontem';
  return dataCurta(iso, agora);
}
