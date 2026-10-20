import { prisma } from '../lib/prisma.js';
import { config } from '../lib/config.js';

export const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DAY_MIN = 24 * 60;

export interface SlotLike {
  id?: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

const WEEKDAY: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Dia da semana e minuto do dia no fuso da rádio (não depende do fuso do servidor). */
export function localTime(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: config.timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { day: WEEKDAY[get('weekday')], minute: Number(get('hour')) * 60 + Number(get('minute')) };
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};
const fmt = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * Intervalos em minutos da semana (0 = domingo 00:00) que um bloco ocupa.
 * "22:00 - 02:00" atravessa a meia-noite e continua no dia seguinte. "00:00" no fim = meia-noite.
 */
export function slotRanges(slot: SlotLike): [number, number][] {
  const start = slot.dayOfWeek * DAY_MIN + toMin(slot.startTime);
  let end = slot.dayOfWeek * DAY_MIN + toMin(slot.endTime);
  if (end <= start) end += DAY_MIN;
  const week = 7 * DAY_MIN;
  return end <= week ? [[start, end]] : [[start, week], [0, end - week]];
}

export function overlaps(a: SlotLike, b: SlotLike) {
  return slotRanges(a).some(([s1, e1]) => slotRanges(b).some(([s2, e2]) => s1 < e2 && s2 < e1));
}

/** Horários de cada dia que nenhum programa cobre (nesses horários toca a rotação geral). */
export function findGaps(slots: SlotLike[]) {
  const covered = new Uint8Array(7 * DAY_MIN);
  for (const slot of slots) for (const [s, e] of slotRanges(slot)) covered.fill(1, s, e);

  return DAYS.flatMap((day, dayIndex) => {
    const ranges: string[] = [];
    let start = -1;
    for (let m = 0; m <= DAY_MIN; m++) {
      const free = m < DAY_MIN && !covered[dayIndex * DAY_MIN + m];
      if (free && start < 0) start = m;
      if (!free && start >= 0) {
        ranges.push(start === 0 && m === DAY_MIN ? 'Dia inteiro vago (00:00 - 24:00)' : `${fmt(start)} - ${fmt(m)}`);
        start = -1;
      }
    }
    return ranges.map((missingHours) => ({ day, dayIndex, missingHours }));
  });
}

/** Bloco da grade que está no ar agora, com o programa. null = rotação geral. */
export async function currentSlot(now = new Date()) {
  const { day, minute } = localTime(now);
  const point = day * DAY_MIN + minute;
  const slots = await prisma.programSlot.findMany({ include: { program: true } });
  return slots.find((s) => slotRanges(s).some(([a, b]) => point >= a && point < b)) ?? null;
}
