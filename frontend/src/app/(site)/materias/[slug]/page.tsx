import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { ArrowLeft } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/materias/SiteFooter';
import MateriaCard from '@/components/materias/MateriaCard';
import Capa from '@/components/materias/Capa';
import Quando from '@/components/materias/Quando';
import Markdown from '@/components/materias/Markdown';
import { buscarMateria, categoria, relacionadas, type MateriaResumo } from '@/lib/materias';
import { SITE } from '@/lib/site';

// Revalida a cada 5 minutos: edição feita no painel aparece, e matéria retirada do ar vira 404
export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

// Metadados e página pedem a mesma matéria: uma busca só por requisição
const materia = cache(async (slug: string) => buscarMateria(decodeURIComponent(slug)));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = await materia((await params).slug);
  if (!m) return { title: 'Matéria não encontrada', robots: { index: false } };
  const url = `/materias/${m.slug}`;
  const images = m.imagem_url ? [{ url: m.imagem_url, alt: m.titulo }] : ['/og.png'];
  return {
    title: m.titulo,
    description: m.linha_fina ?? undefined,
    keywords: m.tags ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE.name,
      locale: 'pt_BR',
      title: m.titulo,
      description: m.linha_fina ?? undefined,
      publishedTime: m.publicada_em,
      modifiedTime: m.updated_at,
      section: categoria(m.categoria).nome,
      tags: m.tags ?? undefined,
      images,
    },
    twitter: { card: 'summary_large_image', title: m.titulo, description: m.linha_fina ?? undefined, images: [m.imagem_url ?? '/og.png'] },
  };
}

export default async function MateriaPage({ params }: Props) {
  const m = await materia((await params).slug);
  if (!m) notFound();

  const c = categoria(m.categoria);
  let leia: MateriaResumo[] = [];
  try {
    leia = await relacionadas(m.categoria, m.slug);
  } catch {
    /* sem "Leia também" se a busca falhar; a matéria aparece igual */
  }

  const url = `${SITE.url}/materias/${m.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: m.titulo,
    description: m.linha_fina ?? undefined,
    image: m.imagem_url ? [m.imagem_url] : [`${SITE.url}/og.png`],
    datePublished: m.publicada_em,
    dateModified: m.updated_at,
    articleSection: c.nome,
    keywords: m.tags?.join(', '),
    inLanguage: 'pt-BR',
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    author: { '@type': 'Organization', name: SITE.name, url: SITE.url },
    publisher: { '@type': 'Organization', name: SITE.name, url: SITE.url, logo: { '@type': 'ImageObject', url: `${SITE.url}/icons/icon-512.png` } },
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-red-600 selection:text-white font-sans overflow-x-hidden relative">
      {/* "<" escapado para nenhum texto do banco fechar a tag de script */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <SiteHeader current="materias" />
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none -top-40 -left-40 opacity-25" style={{ background: c.cor }} aria-hidden />

      <main className="relative z-10 pt-36 xl:pt-32 pb-16">
        <article className="max-w-3xl mx-auto px-6">
          <Link href={`/materias?categoria=${c.id}`} className="inline-flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] font-bold hover:opacity-80" style={{ color: c.cor }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.cor }} aria-hidden />
            {c.nome}
          </Link>
          <h1 className="mt-4 text-3xl sm:text-5xl font-black tracking-tight leading-[1.08] [text-wrap:balance]">{m.titulo}</h1>
          {m.linha_fina && <p className="mt-5 text-lg sm:text-xl text-gray-300 font-light leading-relaxed [text-wrap:pretty]">{m.linha_fina}</p>}
          <p className="mt-6 text-xs text-gray-400 flex items-center gap-2">
            <span className="font-brand tracking-[0.12em] text-[#F4EDE0]">ANTENA ROCK</span>
            <span aria-hidden>·</span>
            <Quando iso={m.publicada_em} />
          </p>
        </article>

        <div className="max-w-5xl mx-auto px-0 sm:px-6 mt-8">
          <Capa src={m.imagem_url} alt={m.titulo} cat={m.categoria} priority sizes="(min-width: 1024px) 64rem, 100vw" className="aspect-[16/9] sm:rounded-3xl border-y sm:border border-white/10" />
        </div>

        <article className="max-w-3xl mx-auto px-6">
          <div className="mt-10 space-y-6 text-[1.0625rem] sm:text-lg leading-[1.75] text-gray-300 [text-wrap:pretty]">
            <Markdown source={m.corpo_md ?? ''} />
          </div>

          {!!m.tags?.length && (
            <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
              {m.tags.map((t) => (
                <li key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-gray-300">
                  #{t}
                </li>
              ))}
            </ul>
          )}

          <Link href="/materias" className="mt-10 inline-flex items-center gap-2 text-xs uppercase tracking-[0.14em] font-semibold text-gray-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> Todas as matérias
          </Link>
        </article>

        {leia.length > 0 && (
          <section className="max-w-7xl mx-auto px-6 lg:px-16 mt-16" aria-labelledby="leia-tambem">
            <h2 id="leia-tambem" className="text-xs uppercase tracking-[0.14em] text-red-500 font-bold mb-2">Leia também</h2>
            <p className="text-2xl font-black tracking-tight mb-6">Mais de {c.nome}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {leia.map((r, i) => (
                <MateriaCard key={r.id} m={r} className={i === 2 ? 'sm:hidden lg:flex' : ''} />
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
