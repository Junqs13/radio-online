import Link from 'next/link';
import Capa from './Capa';
import Quando from './Quando';
import { categoria, type MateriaResumo } from '@/lib/materias';

/** Card de matéria usado na lista, no "Leia também" e na home */
export default function MateriaCard({
  m,
  destaque = false,
  priority = false,
  className = '',
}: {
  m: MateriaResumo;
  destaque?: boolean;
  priority?: boolean;
  className?: string;
}) {
  const c = categoria(m.categoria);
  return (
    <Link
      href={`/materias/${m.slug}`}
      className={`materia-card group flex flex-col rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent overflow-hidden hover:border-white/25 focus-visible:border-red-500 outline-none transition-colors ${
        destaque ? 'sm:col-span-2 lg:col-span-3 md:flex-row' : ''
      } ${className}`}
    >
      <Capa
        src={m.imagem_url}
        alt=""
        cat={m.categoria}
        priority={priority}
        sizes={destaque ? '(min-width: 768px) 55vw, 100vw' : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'}
        className={destaque ? 'aspect-[16/10] md:aspect-auto md:w-3/5 md:min-h-[20rem] flex-shrink-0' : 'aspect-[16/10]'}
      />
      <div className={`flex flex-col gap-2.5 p-5 sm:p-6 ${destaque ? 'md:justify-center md:p-8' : ''}`}>
        <div className="flex items-center gap-2 text-[0.6875rem] uppercase tracking-[0.14em] font-bold">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.cor }} aria-hidden />
          <span style={{ color: c.cor }}>{c.nome}</span>
          <span className="text-gray-500" aria-hidden>·</span>
          <Quando iso={m.publicada_em} className="text-gray-400 normal-case tracking-normal font-medium" />
        </div>
        <h3 className={`font-bold text-white leading-snug tracking-tight group-hover:text-red-100 transition-colors ${destaque ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>
          {m.titulo}
        </h3>
        {m.linha_fina && <p className={`text-sm text-gray-400 leading-relaxed ${destaque ? 'line-clamp-3' : 'line-clamp-2'}`}>{m.linha_fina}</p>}
      </div>
    </Link>
  );
}
