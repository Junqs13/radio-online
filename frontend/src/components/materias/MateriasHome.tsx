'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import MateriaCard from './MateriaCard';
import { listarMaterias, type MateriaResumo } from '@/lib/materias';

/** Bloco da home com as 4 matérias mais recentes. Enquanto não houver nenhuma publicada, não aparece. */
export default function MateriasHome() {
  const [itens, setItens] = useState<MateriaResumo[] | null>(null);

  useEffect(() => {
    listarMaterias({ porPagina: 4 })
      .then((r) => setItens(r.itens))
      .catch(() => setItens([]));
  }, []);

  if (!itens?.length) return null;
  const [primeira, ...resto] = itens;

  return (
    <section id="materias" className="py-10 px-6 lg:px-16 max-w-7xl mx-auto relative z-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
        <div>
          <h2 data-reveal="title" className="text-xs uppercase tracking-[0.14em] text-red-500 font-bold mb-2">Matérias</h2>
          <h3 data-reveal="up" className="text-3xl font-black tracking-tight">Rock, música e cultura pop</h3>
        </div>
        <Link href="/materias" className="glass rounded-full px-4 py-2 text-xs uppercase tracking-[0.14em] font-semibold text-gray-100 flex items-center gap-2">
          Ver todas <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
      <div data-reveal-stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <MateriaCard m={primeira} destaque />
        {/* Em duas colunas, a terceira ficaria sozinha na linha: só aparece com três colunas */}
        {resto.slice(0, 3).map((m, i) => (
          <MateriaCard key={m.id} m={m} className={i === 2 ? 'sm:hidden lg:flex' : ''} />
        ))}
      </div>
    </section>
  );
}
