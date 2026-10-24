'use client';

import { useEffect, useState } from 'react';
import { Clock, Radio } from 'lucide-react';
import { API_URL } from '@/lib/config';

interface Slot {
  id: number;
  programId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  program_title: string;
  host: string;
  category: string;
  color: string;
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** Dia da semana e minuto do dia no fuso da rádio, não no do ouvinte */
function radioNow(timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(
    new Date(),
  );
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return { day: WEEKDAY.indexOf(get('weekday')), minute: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Programação de hoje a partir de agora: o que está no ar e o que ainda vem. O que já passou some. */
export default function ProgramGrid() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [now, setNow] = useState<{ day: number; minute: number } | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/schedule`)
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => {
        if (d.timezone) setTimezone(d.timezone);
        setSlots(d.slots ?? []);
      })
      .catch(() => setSlots([]));
  }, []);

  // Atualiza a cada minuto: o programa que termina sai da lista e o próximo vira "no ar"
  useEffect(() => {
    setNow(radioNow(timezone));
    const t = setInterval(() => setNow(radioNow(timezone)), 60_000);
    return () => clearInterval(t);
  }, [timezone]);

  if (slots === null || now === null) return null;

  const yesterday = (now.day + 6) % 7;
  const upcoming = slots
    .filter((s) => s.dayOfWeek === now.day || s.dayOfWeek === yesterday)
    .map((s) => {
      let start = toMin(s.startTime);
      let end = toMin(s.endTime);
      if (end <= start) end += 24 * 60; // "23:30 às 01:00" e "às 00:00" vão até depois da meia-noite
      if (s.dayOfWeek === yesterday) {
        // De ontem só interessa o bloco que atravessou a meia-noite e ainda está no ar
        start -= 24 * 60;
        end -= 24 * 60;
      }
      return { ...s, start, end, live: start <= now.minute && now.minute < end };
    })
    .filter((s) => s.end > now.minute)
    .sort((a, b) => a.start - b.start);

  if (upcoming.length === 0) {
    return <p className="text-sm text-gray-400">A grade de hoje já terminou. A rádio segue no Auto-DJ, com o acervo inteiro em rotação.</p>;
  }

  return (
    <div data-reveal-stagger="tilt" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {upcoming.map((s) => (
        <div
          key={s.id}
          className={`border p-6 rounded-3xl transition-colors ${
            s.live ? 'border-emerald-500/50 bg-emerald-500/[0.07] shadow-lg shadow-emerald-500/10' : 'border-white/10 bg-white/[0.02]'
          }`}
        >
          <div className={`text-xs font-bold tracking-widest mb-3 flex items-center gap-2 ${s.live ? 'text-emerald-400' : 'text-red-400'}`}>
            <Clock className="w-4 h-4" /> {s.startTime} - {s.endTime}
            {s.live && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <Radio className="w-3 h-3" /> no ar
              </span>
            )}
          </div>
          <h4 className="text-xl font-black mb-2">{s.program_title}</h4>
          <p className="text-xs text-gray-400 mb-4">Com {s.host}</p>
          <span className="inline-block text-[11px] uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-gray-300 font-semibold">
            {s.category}
          </span>
        </div>
      ))}
    </div>
  );
}
