import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Newspaper } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/materias/SiteFooter';
import MateriaCard from '@/components/materias/MateriaCard';
import { CATEGORIAS, categoria, isCategoria, listarMaterias, totalDePaginas, type Categoria, type MateriaResumo } from '@/lib/materias';

// Busca de novo no Supabase a cada 5 minutos: matéria publicada ou retirada no painel aparece ou some sozinha
export const revalidate = 300;

type Props = { searchParams: Promise<{ categoria?: string; pagina?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { categoria: cat, pagina } = await searchParams;
  const nome = isCategoria(cat) ? categoria(cat).nome : '';
  const n = Number(pagina) > 1 ? ` (página ${Number(pagina)})` : '';
  const description = 'Matérias curtas sobre rock, música, filmes, séries, games e cultura pop, da equipe da Antena Rock.';
  return {
    title: nome ? `Matérias de ${nome}${n}` : `Matérias${n}`,
    description,
    alternates: { canonical: `/materias${isCategoria(cat) ? `?categoria=${cat}` : ''}` },
    openGraph: { type: 'website', url: '/materias', title: 'Matérias | Antena Rock', description, images: ['/og.png'] },
  };
}

const href = (cat?: Categoria, pagina = 1) => {
  const q = new URLSearchParams();
  if (cat) q.set('categoria', cat);
  if (pagina > 1) q.set('pagina', String(pagina));
  const s = q.toString();
  return s ? `/materias?${s}` : '/materias';
};

export default async function MateriasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const cat = isCategoria(sp.categoria) ? sp.categoria : undefined;
  const pagina = Math.max(1, Math.floor(Number(sp.pagina)) || 1);

  let itens: MateriaResumo[] = [];
  let total = 0;
  let falhou = false;
  try {
    ({ itens, total } = await listarMaterias({ categoria: cat, pagina }));
  } catch {
    falhou = true;
  }
  const paginas = totalDePaginas(total);
  const [primeira, ...resto] = pagina === 1 ? itens : [];
  const grade = pagina === 1 ? resto : itens;

  return (
    <div className="min-h-screen bg-[#050507] text-white selection:bg-red-600 selection:text-white font-sans overflow-x-hidden relative">
      <SiteHeader current="materias" />
      <div className="absolute w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none -top-40 -left-40" aria-hidden />

      <main className="relative z-10 max-w-7xl mx-auto px-6 lg:px-16 pt-36 xl:pt-32 pb-16">
        <h1 className="text-xs uppercase tracking-[0.14em] text-red-500 font-bold mb-2">Matérias</h1>
        <p className="text-3xl sm:text-5xl font-black tracking-tight max-w-3xl">Rock, música e cultura pop</p>

        {/* Filtro por categoria. Música vem logo depois de "Todas", em vermelho */}
        <nav aria-label="Categorias" className="mt-8 -mx-6 px-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:mx-0 sm:px-0">
          <Link
            href={href()}
            aria-current={!cat ? 'page' : undefined}
            className={`glass flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${!cat ? 'is-on text-white' : 'text-gray-300 hover:text-white'}`}
          >
            Todas
          </Link>
          {CATEGORIAS.map((c) => {
            const on = cat === c.id;
            const musica = c.id === 'musica';
            return (
              <Link
                key={c.id}
                href={href(c.id)}
                aria-current={on ? 'page' : undefined}
                className={`glass flex-shrink-0 rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 ${
                  musica ? 'glass-red text-white' : on ? 'is-on text-white' : 'text-gray-300 hover:text-white'
                } ${musica && on ? 'ring-2 ring-red-400/70' : ''}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: musica ? '#fff' : c.cor }} aria-hidden />
                {c.nome}
              </Link>
            );
          })}
        </nav>

        {falhou ? (
          <Vazio titulo="As matérias não carregaram agora" texto="Tente de novo em alguns minutos. A rádio continua no ar enquanto isso." />
        ) : itens.length === 0 ? (
          pagina > 1 ? (
            <Vazio titulo="Essa página não existe" texto="Volte para a primeira página para ver as matérias mais recentes." link={href(cat)} />
          ) : cat ? (
            <Vazio
              titulo={`Ainda não tem matéria de ${categoria(cat).nome}`}
              texto="Assim que sair a primeira, ela aparece aqui. Enquanto isso, veja as outras categorias."
              link={href()}
            />
          ) : (
            <Vazio
              titulo="As primeiras matérias estão chegando"
              texto="Em breve aqui vão aparecer notícias curtas sobre rock, música e cultura pop. Enquanto isso, a rádio está tocando."
            />
          )
        ) : (
          <>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {primeira && <MateriaCard m={primeira} destaque priority />}
              {grade.map((m) => (
                <MateriaCard key={m.id} m={m} />
              ))}
            </div>

            {paginas > 1 && (
              <nav aria-label="Páginas" className="mt-12 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.14em] font-semibold">
                {pagina > 1 ? (
                  <Link href={href(cat, pagina - 1)} rel="prev" className="glass rounded-full px-4 py-2.5 flex items-center gap-2">
                    <ArrowLeft className="w-3.5 h-3.5" /> Mais recentes
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 text-gray-600 flex items-center gap-2" aria-hidden>
                    <ArrowLeft className="w-3.5 h-3.5" /> Mais recentes
                  </span>
                )}
                <span className="text-gray-400 tabular-nums normal-case tracking-normal">
                  {pagina} de {paginas}
                </span>
                {pagina < paginas ? (
                  <Link href={href(cat, pagina + 1)} rel="next" className="glass rounded-full px-4 py-2.5 flex items-center gap-2">
                    Mais antigas <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="px-4 py-2.5 text-gray-600 flex items-center gap-2" aria-hidden>
                    Mais antigas <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </nav>
            )}
          </>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Vazio({ titulo, texto, link }: { titulo: string; texto: string; link?: string }) {
  return (
    <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-gradient-to-br from-white/[0.03] to-transparent px-6 py-16 sm:py-20 text-center flex flex-col items-center gap-4">
      <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
        <Newspaper className="w-6 h-6" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold">{titulo}</h2>
      <p className="text-gray-400 max-w-md leading-relaxed">{texto}</p>
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {link && (
          <Link href={link} className="glass rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-semibold">
            Ver todas as matérias
          </Link>
        )}
        <Link href="/#player" className="glass glass-red rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-semibold text-white">
          Ouvir a rádio
        </Link>
      </div>
    </div>
  );
}
