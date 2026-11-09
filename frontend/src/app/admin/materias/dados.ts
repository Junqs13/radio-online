// Dados das matérias para o painel: junta o que vem do geek-news (só leitura) com o banco do site
import { API_URL, apiFetch } from '@/lib/config';
import { MATERIAS_KEY, MATERIAS_URL, urlImagem, type Materia } from '@/lib/materias';

export interface Registro {
  id: number;
  slug: string;
  origem: 'geek' | 'site';
  titulo: string | null;
  linhaFina: string | null;
  corpoMd: string | null;
  categoria: string | null;
  tags: string[] | null;
  tagsDefinidas: boolean;
  imagemUrl: string | null;
  semFoto: boolean;
  oculta: boolean;
  fixada: boolean;
  rascunho: boolean;
  publicadaEm: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Linha {
  slug: string;
  origem: 'geek' | 'site';
  titulo: string;
  linhaFina: string | null;
  categoria: string;
  tags: string[];
  imagem: string | null;
  publicadaEm: string;
  editada: boolean;
  oculta: boolean;
  fixada: boolean;
  rascunho: boolean;
  agendada: boolean;
  vistas: number;
  registro?: Registro;
}

/** Matérias do geek-news, direto da view pública (a mesma que o site lê) */
export async function doGeek(select = 'id,titulo,slug,linha_fina,categoria,imagem_url,publicada_em,updated_at,tags', filtro?: Record<string, string>) {
  const p = new URLSearchParams({ select, order: 'publicada_em.desc', limit: '2000', ...filtro });
  const res = await fetch(`${MATERIAS_URL}/rest/v1/materias_site?${p}`, { headers: { apikey: MATERIAS_KEY }, cache: 'no-store' });
  if (!res.ok) throw new Error('Não deu para ler as matérias do geek-news.');
  return (await res.json()) as Materia[];
}

export async function doSite() {
  const res = await apiFetch(`${API_URL}/materias/admin`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Não deu para ler as matérias do site.');
  return (await res.json()) as { materias: Registro[]; vistas: Record<string, number> };
}

export const editou = (r?: Registro) =>
  !!r && (r.titulo !== null || r.linhaFina !== null || r.corpoMd !== null || r.categoria !== null || r.tagsDefinidas || r.imagemUrl !== null || r.semFoto || r.publicadaEm !== null);

export async function carregarLinhas(): Promise<Linha[]> {
  const [geek, site] = await Promise.all([doGeek(), doSite()]);
  const reg = new Map(site.materias.map((r) => [r.slug, r]));
  const agora = Date.now();
  const linhas: Linha[] = geek.map((m) => {
    const r = reg.get(m.slug);
    return {
      slug: m.slug,
      origem: 'geek',
      titulo: r?.titulo ?? m.titulo,
      linhaFina: r?.linhaFina ?? m.linha_fina,
      categoria: r?.categoria ?? m.categoria,
      tags: (r?.tagsDefinidas ? r.tags : m.tags) ?? [],
      imagem: r?.semFoto ? null : (urlImagem(r?.imagemUrl ?? null) ?? m.imagem_url),
      publicadaEm: r?.publicadaEm ?? m.publicada_em,
      editada: editou(r),
      oculta: !!r?.oculta,
      fixada: !!r?.fixada,
      rascunho: false,
      agendada: false,
      vistas: site.vistas[m.slug] ?? 0,
      registro: r,
    };
  });
  for (const r of site.materias.filter((x) => x.origem === 'site')) {
    linhas.push({
      slug: r.slug,
      origem: 'site',
      titulo: r.titulo ?? '(sem título)',
      linhaFina: r.linhaFina,
      categoria: r.categoria ?? 'outros',
      tags: r.tags ?? [],
      imagem: r.semFoto ? null : urlImagem(r.imagemUrl),
      publicadaEm: r.publicadaEm ?? r.createdAt,
      editada: false,
      oculta: r.oculta,
      fixada: r.fixada,
      rascunho: r.rascunho,
      agendada: !!r.publicadaEm && +new Date(r.publicadaEm) > agora,
      vistas: site.vistas[r.slug] ?? 0,
      registro: r,
    });
  }
  return linhas.sort((a, b) => Number(b.fixada) - Number(a.fixada) || +new Date(b.publicadaEm) - +new Date(a.publicadaEm));
}

export async function salvar(slug: string | null, body: Record<string, unknown>) {
  const res = await apiFetch(slug ? `${API_URL}/materias/admin/${slug}` : `${API_URL}/materias/admin`, {
    method: slug ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error ?? 'Não deu para salvar.');
  return d.materia as Registro;
}

export async function apagar(slug: string) {
  const res = await apiFetch(`${API_URL}/materias/admin/${slug}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Não deu para excluir.');
}

export async function enviarFoto(file: File) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await apiFetch(`${API_URL}/content/admin/images`, { method: 'POST', body: fd });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error ?? 'Não deu para enviar a foto.');
  return d.url as string;
}
