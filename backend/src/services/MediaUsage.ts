import { prisma } from '../lib/prisma.js';
import { toMin } from './Schedule.js';
import { ruleFor, norm, type JingleRule } from './JingleRules.js';

/**
 * Onde cada faixa do acervo é usada: em quais programas da grade ela pode tocar
 * e em que dias e horários. Usa as mesmas regras do Auto-DJ.
 */

const DAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** "Seg a Sex", "Sáb e Dom", "Todo dia", "Seg, Qua e Sex" */
export function daysLabel(days: number[]) {
  const set = [...new Set(days)].sort((a, b) => a - b);
  if (set.length === 7) return 'Todo dia';
  if (set.join() === '1,2,3,4,5') return 'Seg a Sex';
  if (set.join() === '0,6') return 'Sáb e Dom';
  // Sequência seguida (ex: Seg, Ter, Qua) vira "Seg a Qua"
  const contiguous = set.length >= 3 && set.every((d, i) => i === 0 || d === set[i - 1] + 1);
  if (contiguous) return `${DAY_SHORT[set[0]]} a ${DAY_SHORT[set[set.length - 1]]}`;
  const names = set.map((d) => DAY_SHORT[d]);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}` : names[0];
}

interface SlotLite {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** Junta os blocos de mesmo horário: "Seg a Sex 11:00–12:00 · Sáb 14:00–16:00" */
export function scheduleLabel(slots: SlotLite[]) {
  const byTime = new Map<string, number[]>();
  for (const s of slots) {
    const k = `${s.startTime}–${s.endTime}`;
    byTime.set(k, [...(byTime.get(k) ?? []), s.dayOfWeek]);
  }
  return [...byTime.entries()]
    .sort((a, b) => toMin(a[0].slice(0, 5)) - toMin(b[0].slice(0, 5)))
    .map(([time, days]) => `${daysLabel(days)} ${time}`);
}

function weeklyMinutes(slots: SlotLite[]) {
  return slots.reduce((acc, s) => {
    let d = toMin(s.endTime) - toMin(s.startTime);
    if (d <= 0) d += 24 * 60;
    return acc + d;
  }, 0);
}

function jingleLabel(rule: JingleRule) {
  if (!rule.program && !rule.hours && !rule.days) return 'Qualquer programa, a qualquer hora';
  const parts: string[] = [];
  if (rule.days) parts.push(daysLabel([...rule.days]));
  if (rule.hours) {
    const h = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}h`;
    parts.push(`das ${h(rule.hours[0])} às ${h(rule.hours[1])}`);
  }
  if (!rule.days && rule.hours) parts.unshift('Todo dia');
  if (rule.days && !rule.hours) parts.push('o dia todo');
  return parts.join(', ');
}

export async function mediaUsage() {
  const [programs, items] = await Promise.all([
    prisma.program.findMany({ include: { slots: true }, orderBy: { title: 'asc' } }),
    prisma.mediaItem.findMany({ select: { id: true, type: true, filename: true, programId: true, enabled: true } }),
  ]);

  const onAir = programs.filter((p) => p.slots.length > 0);
  const music = items.filter((m) => m.type === 'music' && m.enabled);

  // Acervo de cada programa: faixas vinculadas + pastas. Sem nenhuma faixa = toca o acervo inteiro
  const poolOf = new Map<number, Set<number>>();
  const wholeLibrary = new Set<number>();
  for (const p of onAir) {
    const folders = (p.mediaFolder ?? '').split('|').map((f) => f.trim()).filter(Boolean);
    const ids = music
      .filter((m) => m.programId === p.id || folders.some((f) => m.filename.startsWith(`${f}/`)))
      .map((m) => m.id);
    if (ids.length) poolOf.set(p.id, new Set(ids));
    else wholeLibrary.add(p.id);
  }

  const titles = programs.map((p) => p.title);
  const usage: Record<number, { programs: number[]; rule?: string }> = {};
  for (const m of items) {
    if (m.type === 'jingle') {
      const rule = ruleFor(m.filename, titles);
      const progs = onAir
        .filter((p) => (m.programId ? m.programId === p.id : rule.program ? norm(p.title) === rule.program : true))
        .map((p) => p.id);
      usage[m.id] = {
        programs: rule.program || m.programId ? progs : [],
        rule: rule.program || m.programId ? (progs.length ? 'Só neste programa' : 'Programa fora da grade: não toca') : jingleLabel(rule),
      };
    } else {
      usage[m.id] = { programs: onAir.filter((p) => poolOf.get(p.id)?.has(m.id)).map((p) => p.id) };
    }
  }

  return {
    programs: onAir.map((p) => ({
      id: p.id,
      title: p.title,
      color: p.color,
      schedule: scheduleLabel(p.slots),
      weeklyMinutes: weeklyMinutes(p.slots),
      wholeLibrary: wholeLibrary.has(p.id),
      tracks: poolOf.get(p.id)?.size ?? music.length,
    })),
    usage,
  };
}
