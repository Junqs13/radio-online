'use client';

import { useEffect, useState } from 'react';
import { dataCurta, dataExtenso, quando } from '@/lib/materias';

/**
 * Data da matéria. O servidor manda a data fixa (05/11), que é igual em qualquer lugar;
 * no navegador ela vira "há 2 h", "ontem" etc. e se atualiza sozinha a cada minuto.
 */
export default function Quando({ iso, className = '' }: { iso: string; className?: string }) {
  const [texto, setTexto] = useState(() => dataCurta(iso));
  useEffect(() => {
    const tick = () => setTexto(quando(iso));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [iso]);
  return (
    <time dateTime={iso} title={dataExtenso(iso)} className={className}>
      {texto}
    </time>
  );
}
