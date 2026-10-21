import { localTime } from './Schedule.js';

/**
 * Regras das vinhetas pela subpasta dentro de "Vinhetas":
 *
 *   Vinhetas/Geral/...               toca a qualquer hora, em qualquer programa
 *   Vinhetas/Especial Elvis Presley/ só no programa com esse nome (sem acento/maiúscula importa)
 *   Vinhetas/Almoco 11h-14h/         só das 11h às 14h
 *   Vinhetas/Sexta/                  só às sextas
 *   Vinhetas/Promo Elvis seg-sex 06h-11h/   de segunda a sexta, das 6h às 11h
 *
 * Ler a regra pelo nome da pasta (e não por um vínculo no banco) faz a regra
 * continuar valendo mesmo quando a grade é apagada e montada de novo.
 */

export interface JingleRule {
  program: string | null; // nome do programa normalizado, se a pasta for de um programa
  hours: [number, number] | null; // [início, fim) em minutos do dia
  days: Set<number> | null; // 0 = domingo
}

const DAY_IDX: Record<string, number> = { dom: 0, seg: 1, ter: 2, qua: 3, qui: 4, sex: 5, sab: 6 };

export const norm = (s: string) =>
  s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

export function ruleFor(filename: string, programTitles: string[]): JingleRule {
  const parts = filename.split('/');
  const sub = parts.length >= 3 ? norm(parts[1]) : '';
  const rule: JingleRule = { program: null, hours: null, days: null };
  if (!sub || sub === 'geral') return rule;

  if (programTitles.map(norm).includes(sub)) {
    rule.program = sub;
    return rule;
  }

  const h = sub.match(/(\d{1,2})h?\s*-\s*(\d{1,2})h/);
  if (h) rule.hours = [Number(h[1]) * 60, Number(h[2]) * 60];

  const range = sub.match(/\b(dom|seg|ter|qua|qui|sex|sab)\s*-\s*(dom|seg|ter|qua|qui|sex|sab)\b/);
  if (range) {
    rule.days = new Set();
    for (let d = DAY_IDX[range[1]]; ; d = (d + 1) % 7) {
      rule.days.add(d);
      if (d === DAY_IDX[range[2]]) break;
    }
  } else {
    const singles = [...sub.matchAll(/\b(dom|seg|ter|qua|qui|sex|sab)\w*/g)].map((m) => DAY_IDX[m[1]]);
    if (singles.length) rule.days = new Set(singles);
  }
  // Pasta sem horário nem dia é pasta de programa, mesmo que o programa não exista
  // agora na grade. Assim ela nunca toca fora do lugar.
  if (!rule.hours && !rule.days) rule.program = sub;
  return rule;
}

/** A vinheta pode tocar agora, no programa que está no ar? */
export function allowed(rule: JingleRule, currentProgram: string | null, now = new Date()) {
  if (rule.program && rule.program !== (currentProgram ? norm(currentProgram) : null)) return false;
  const { day, minute } = localTime(now);
  if (rule.days && !rule.days.has(day)) return false;
  if (rule.hours) {
    const [a, b] = rule.hours;
    const inside = a <= b ? minute >= a && minute < b : minute >= a || minute < b; // "22h-02h" vira a noite
    if (!inside) return false;
  }
  return true;
}

/** Vinheta com regra (de programa, horário ou dia) é mais específica que a geral. */
export const isSpecific = (r: JingleRule) => Boolean(r.program || r.hours || r.days);
