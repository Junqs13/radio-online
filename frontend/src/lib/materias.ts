import { API_URL } from './config';
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
  updated_at?: string;
  fixada?: boolean; // fixada pelo painel do site: aparece primeiro
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

const RESUMO = 'id,titulo,slug,linha_fina,categoria,imagem_url,publicada_em,updated_at';

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

// ---------- Ajustes do painel do site ----------
// O painel do site guarda no banco dele: edições por cima das matérias do geek-news (título, texto, foto,
// tags, categoria, ocultar, fixar) e as matérias escritas no próprio site. O Supabase do geek-news só é lido.
interface Ajuste {
  slug: string;
  origem: 'geek' | 'site';
  titulo: string | null;
  linhaFina: string | null;
  corpoMd: string | null;
  categoria: string | null;
  tags: string[] | null;
  imagemUrl: string | null;
  semFoto: boolean;
  oculta: boolean;
  fixada: boolean;
  publicadaEm: string | null;
  updatedAt: string;
}

// No servidor, o Next fala com a API pela rede interna do Docker; no navegador, pelo domínio
const API_SITE = typeof window === 'undefined' ? process.env.INTERNAL_API_URL || API_URL : API_URL;
/** Foto enviada pelo painel do site (/api/content/images/...) vira endereço completo */
export const urlImagem = (u: string | null) => (u && u.startsWith('/api/') ? API_URL.replace(/\/api\/?$/, '') + u : u);

async function ajustes(): Promise<Map<string, Ajuste>> {
  try {
    const res = await fetch(`${API_SITE}/materias/ajustes`, { cache: 'no-store' });
    if (!res.ok) throw new Error(String(res.status));
    const { materias } = (await res.json()) as { materias: Ajuste[] };
    return new Map(materias.map((a) => [a.slug, a]));
  } catch {
    return new Map(); // API fora do ar: o site mostra as do geek-news como vieram
  }
}

/** Aplica o ajuste do painel numa matéria do geek-news */
function aplicar<T extends MateriaResumo & Partial<Materia>>(m: T, a?: Ajuste): T {
  if (!a) return m;
  return {
    ...m,
    titulo: a.titulo ?? m.titulo,
    linha_fina: a.linhaFina ?? m.linha_fina,
    categoria: a.categoria ?? m.categoria,
    imagem_url: a.semFoto ? null : (urlImagem(a.imagemUrl) ?? m.imagem_url),
    publicada_em: a.publicadaEm ?? m.publicada_em,
    updated_at: a.updatedAt > (m.updated_at ?? '') ? a.updatedAt : m.updated_at,
    fixada: a.fixada,
    ...(m.corpo_md !== undefined ? { corpo_md: a.corpoMd ?? m.corpo_md } : {}),
    ...(a.tags ? { tags: a.tags } : {}),
  };
}

/** Matéria escrita no painel do site, no mesmo formato das do geek-news */
const doSite = (a: Ajuste): Materia => ({
  id: -1,
  slug: a.slug,
  titulo: a.titulo ?? '',
  linha_fina: a.linhaFina,
  corpo_md: a.corpoMd ?? '',
  categoria: a.categoria ?? 'outros',
  tags: a.tags ?? [],
  imagem_url: a.semFoto ? null : urlImagem(a.imagemUrl),
  publicada_em: a.publicadaEm ?? a.updatedAt,
  updated_at: a.updatedAt,
  fixada: a.fixada,
});

/** Todas as matérias que estão no ar, já com os ajustes: fixadas primeiro, depois da mais nova para a mais antiga */
async function todas(guardar = false): Promise<MateriaResumo[]> {
  const [lista, aj] = await Promise.all([
    consulta(new URLSearchParams({ select: RESUMO, order: 'publicada_em.desc', limit: '2000' }), {}, guardar).then((r) => r.json() as Promise<MateriaResumo[]>),
    ajustes(),
  ]);
  const geek = lista.map((m) => aplicar(m, aj.get(m.slug))).filter((m) => !aj.get(m.slug)?.oculta);
  const site = [...aj.values()].filter((a) => a.origem === 'site').map(doSite);
  return [...geek, ...site].sort(
    (a, b) => Number(!!b.fixada) - Number(!!a.fixada) || +new Date(b.publicada_em) - +new Date(a.publicada_em),
  );
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
  const lista = (await todas()).filter((m) => !cat || m.categoria === cat);
  return { itens: lista.slice(inicio, inicio + limite), total: lista.length };
}

export async function buscarMateria(slug: string): Promise<Materia | null> {
  const [aj, lista] = await Promise.all([
    ajustes(),
    consulta(new URLSearchParams({ select: '*', slug: `eq.${slug}`, limit: '1' })).then((r) => r.json() as Promise<Materia[]>),
  ]);
  const a = aj.get(slug);
  if (a?.origem === 'site') return doSite(a);
  const m = lista[0];
  if (!m || a?.oculta) return null;
  return aplicar(m, a);
}

/** "Leia também": as mais recentes da mesma categoria, sem repetir a que está aberta */
export async function relacionadas(cat: string, slugAtual: string, quantas = 3) {
  return (await todas())
    .filter((m) => m.categoria === cat && m.slug !== slugAtual)
    .sort((a, b) => +new Date(b.publicada_em) - +new Date(a.publicada_em))
    .slice(0, quantas);
}

/** As mais recentes, para o feed RSS */
export async function paraFeed(quantas = 30) {
  return (await todas(true))
    .sort((a, b) => +new Date(b.publicada_em) - +new Date(a.publicada_em))
    .slice(0, quantas)
    .map((m) => ({ ...m, updated_at: m.updated_at ?? m.publicada_em }));
}

/** Tudo que precisa entrar no sitemap */
export async function slugsParaSitemap() {
  return (await todas(true)).map((m) => ({ slug: m.slug, updated_at: m.updated_at ?? m.publicada_em, imagem_url: m.imagem_url }));
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
