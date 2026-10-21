/**
 * Escolha "do dia": a mesma para todo mundo no mesmo dia (horário de Brasília)
 * e diferente no dia seguinte. A lista é embaralhada em ciclos, então todos os
 * itens aparecem uma vez antes de algum se repetir.
 */

/** Número de dias desde 1970-01-01 no fuso de São Paulo. */
export function dayNumber(date = new Date()): number {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .split('-')
    .map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Índice do item de hoje numa lista de tamanho n. `salt` separa listas diferentes. */
export function dailyIndex(n: number, salt: number, day = dayNumber()): number {
  const cycle = Math.floor(day / n);
  const order = Array.from({ length: n }, (_, i) => i);
  const rand = mulberry32(cycle * 7919 + salt);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order[day % n];
}

export function pickDaily<T>(list: T[], salt: number, day?: number): T {
  return list[dailyIndex(list.length, salt, day)];
}
