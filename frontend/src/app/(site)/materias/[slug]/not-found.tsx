import Link from 'next/link';
import { Newspaper } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/materias/SiteFooter';

export default function MateriaNaoEncontrada() {
  return (
    <div className="min-h-screen bg-[#050507] text-white font-sans overflow-x-hidden relative">
      <SiteHeader current="materias" />
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-40 pb-24 text-center flex flex-col items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
          <Newspaper className="w-6 h-6" />
        </div>
        <p className="font-neon text-[#E11D2E] text-6xl">404</p>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Essa matéria saiu do ar</h1>
        <p className="text-gray-400 max-w-md leading-relaxed">O endereço pode estar errado, ou a matéria foi retirada. As mais recentes estão na lista.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <Link href="/materias" className="glass rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-semibold">
            Ver as matérias
          </Link>
          <Link href="/#player" className="glass glass-red rounded-full px-4 py-2.5 text-xs uppercase tracking-[0.14em] font-semibold text-white">
            Ouvir a rádio
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
