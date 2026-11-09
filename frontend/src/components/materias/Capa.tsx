import Image from 'next/image';
import { BrandMark } from '@/components/BrandLogo';
import { categoria } from '@/lib/materias';

/**
 * Foto de capa da matéria. Sem foto, entra um fundo gráfico na cor da categoria
 * com a torre da Antena Rock, para o card manter o mesmo tamanho.
 */
export default function Capa({
  src,
  alt,
  cat,
  sizes,
  priority = false,
  className = '',
}: {
  src: string | null;
  alt: string;
  cat: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const c = categoria(cat);
  if (src) {
    return (
      <div className={`relative overflow-hidden bg-[#0c0c10] ${className}`}>
        {/* Fotos do Supabase passam pelo otimizador do Next; as enviadas pelo painel do site já vêm do nosso servidor */}
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={!src.includes('.supabase.co/')} className="object-cover capa-img" />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(120% 90% at 15% 10%, ${c.cor}55, transparent 60%), radial-gradient(90% 80% at 100% 100%, #7C3AED33, transparent 60%), #0b0a10`,
      }}
    >
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: `repeating-linear-gradient(-45deg, ${c.cor} 0 1px, transparent 1px 14px)` }}
      />
      <BrandMark size={160} tone="white" className="absolute -right-6 -bottom-8 w-2/5 h-auto opacity-[0.12] capa-img" />
      <span className="absolute left-5 bottom-4 font-brand font-extrabold uppercase tracking-[0.14em] text-white/80 text-sm">{c.nome}</span>
    </div>
  );
}
