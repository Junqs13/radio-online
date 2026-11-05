import Link from 'next/link';
import { BrandMark, BrandWordmark } from '@/components/BrandLogo';
import { SITE } from '@/lib/site';

/** Rodapé curto das páginas de matérias */
export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 pt-12 pb-28 px-8 lg:px-16 text-center text-xs text-gray-400 space-y-5 relative z-10 bg-[#050507]/90">
      <Link href="/" className="inline-flex flex-col items-center gap-3">
        <BrandMark size={56} />
        <BrandWordmark />
      </Link>
      <p className="font-semibold text-[0.6875rem] tracking-[0.35em] text-[#CFC8DA] uppercase">{SITE.slogan}</p>
      <p>
        © {new Date().getFullYear()} Antena Rock · Sorocaba, SP · <Link href="/#fale-conosco" className="hover:text-white">Fale conosco</Link>
      </p>
    </footer>
  );
}
