import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { requireAdmin } from '../lib/auth.js';

/**
 * Matérias no banco do site (ver model Materia).
 * Pública: /api/materias/ajustes, que o site aplica por cima do geek-news.
 * Painel: criar, editar, ocultar, fixar, excluir.
 */
const router = Router();

const CATEGORIAS = new Set(['games', 'filmes', 'series', 'anime', 'quadrinhos', 'musica', 'tech', 'outros']);
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const opt = (v: unknown, max: number) => (v === null ? null : str(v, max) || null);
const okImagem = (u: string | null) => !u || u.startsWith('/api/content/images/') || /^https:\/\/[^\s"'<>]+$/.test(u);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(t: string) {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/, '');
}

const tagsDe = (v: unknown) =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split(',') : [])
    .map((t) => String(t).replace(/^#/, '').trim().slice(0, 40))
    .filter(Boolean)
    .filter((t, i, a) => a.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)
    .slice(0, 10);

/** Campos aceitos do painel. Em ajuste do geek-news, null volta ao original de lá. */
function dados(b: Record<string, unknown>) {
  const d: Prisma.MateriaUpdateInput = {};
  if (b.titulo !== undefined) d.titulo = opt(b.titulo, 200);
  if (b.linhaFina !== undefined) d.linhaFina = opt(b.linhaFina, 400);
  if (b.corpoMd !== undefined) d.corpoMd = b.corpoMd === null ? null : str(b.corpoMd, 40_000) || null;
  if (b.categoria !== undefined) d.categoria = b.categoria === null ? null : CATEGORIAS.has(String(b.categoria)) ? String(b.categoria) : 'outros';
  if (b.tags !== undefined) {
    if (b.tags === null) {
      d.tags = [];
      d.tagsDefinidas = false;
    } else {
      d.tags = tagsDe(b.tags);
      d.tagsDefinidas = true;
    }
  }
  if (b.imagemUrl !== undefined) {
    const u = opt(b.imagemUrl, 600);
    if (!okImagem(u)) throw new Error('Endereço de imagem inválido. Use um link https ou envie a foto.');
    d.imagemUrl = u;
  }
  for (const k of ['semFoto', 'oculta', 'fixada', 'rascunho'] as const) if (typeof b[k] === 'boolean') d[k] = b[k] as boolean;
  if (b.publicadaEm !== undefined) {
    const t = b.publicadaEm ? new Date(String(b.publicadaEm)) : null;
    if (t && Number.isNaN(t.getTime())) throw new Error('Data de publicação inválida.');
    d.publicadaEm = t;
  }
  return d;
}

const publico = (m: Awaited<ReturnType<typeof prisma.materia.findFirst>> & object) => ({
  slug: m.slug,
  origem: m.origem,
  titulo: m.titulo,
  linhaFina: m.linhaFina,
  corpoMd: m.corpoMd,
  categoria: m.categoria,
  tags: m.tagsDefinidas ? m.tags : null,
  imagemUrl: m.imagemUrl,
  semFoto: m.semFoto,
  oculta: m.oculta,
  fixada: m.fixada,
  publicadaEm: m.publicadaEm,
  updatedAt: m.updatedAt,
});

// ---------- Público ----------
// Ajustes das matérias do geek-news + matérias do site já publicadas (rascunhos e agendadas ficam de fora).
// Fica 10 s em memória (o site chama a cada página) e é limpo quando o painel salva algo.
let memoria: { ate: number; corpo: unknown } | null = null;
const limparMemoria = () => {
  memoria = null;
};
router.get('/ajustes', async (_req: Request, res: Response) => {
  if (!memoria || memoria.ate < Date.now()) {
    const rows = await prisma.materia.findMany({
      where: { OR: [{ origem: 'geek' }, { origem: 'site', rascunho: false, oculta: false, publicadaEm: { lte: new Date() } }] },
      orderBy: { id: 'asc' },
    });
    memoria = { ate: Date.now() + 10_000, corpo: { success: true, materias: rows.map(publico) } };
  }
  res.set('Cache-Control', 'public, max-age=10');
  res.json(memoria.corpo);
});

// ---------- Painel ----------
router.get('/admin', requireAdmin, async (_req: Request, res: Response) => {
  const rows = await prisma.materia.findMany({ orderBy: { updatedAt: 'desc' } });
  // Vistas nos últimos 30 dias, pelas estatísticas do site
  const desde = new Date(Date.now() - 30 * 86_400_000);
  const vistas = await prisma.$queryRaw<{ path: string; n: bigint }[]>`
    SELECT path, COUNT(*) AS n FROM stat_events
    WHERE type = 'pageview' AND path LIKE '/materias/_%' AND created_at >= ${desde}
    GROUP BY 1`;
  res.json({
    success: true,
    materias: rows.map((m) => ({ ...publico(m), id: m.id, rascunho: m.rascunho, tagsDefinidas: m.tagsDefinidas, createdAt: m.createdAt })),
    vistas: Object.fromEntries(vistas.map((v) => [v.path.replace('/materias/', ''), Number(v.n)])),
  });
});

// Nova matéria do site
router.post('/admin', requireAdmin, async (req: Request, res: Response) => {
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const titulo = str(b.titulo, 200);
    if (titulo.length < 5) throw new Error('Escreva um título com pelo menos 5 letras.');
    const d = dados(b) as Prisma.MateriaCreateInput;
    // Slug provisório; depois de criar, ganha o número da matéria no fim (como no geek-news), sem risco de repetir
    const criada = await prisma.materia.create({
      data: {
        ...d,
        titulo,
        origem: 'site',
        slug: `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        categoria: (d.categoria as string) ?? 'musica',
        publicadaEm: (d.publicadaEm as Date | null | undefined) ?? new Date(),
      },
    });
    const m = await prisma.materia.update({ where: { id: criada.id }, data: { slug: `${slugify(titulo) || 'materia'}-ar${criada.id}` } });
    limparMemoria();
    res.status(201).json({ success: true, materia: { ...publico(m), id: m.id, rascunho: m.rascunho } });
  } catch (err) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Não deu para criar.' });
  }
});

// Editar: matéria do site, ou ajuste de uma do geek-news (cria o ajuste na primeira vez)
router.put('/admin/:slug', requireAdmin, async (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  if (!SLUG.test(slug) || slug.length > 200) {
    res.status(400).json({ success: false, error: 'Endereço de matéria inválido.' });
    return;
  }
  try {
    const b = (req.body ?? {}) as Record<string, unknown>;
    const d = dados(b);
    const atual = await prisma.materia.findUnique({ where: { slug } });
    if (atual?.origem === 'site' && d.titulo === null) throw new Error('A matéria precisa de um título.');
    const m = atual
      ? await prisma.materia.update({ where: { slug }, data: d })
      : await prisma.materia.create({ data: { ...(d as Prisma.MateriaCreateInput), slug, origem: 'geek' } });
    limparMemoria();
    res.json({ success: true, materia: { ...publico(m), id: m.id, rascunho: m.rascunho } });
  } catch (err) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Não deu para salvar.' });
  }
});

// Excluir: a do site some de vez; a do geek-news perde os ajustes e volta ao original
router.delete('/admin/:slug', requireAdmin, async (req: Request, res: Response) => {
  const { count } = await prisma.materia.deleteMany({ where: { slug: String(req.params.slug) } });
  limparMemoria();
  res.status(count ? 200 : 404).json({ success: count > 0 });
});

export default router;
