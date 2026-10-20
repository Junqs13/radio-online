'use client';

import { useEffect, useState } from 'react';
import { Calendar, Radio } from 'lucide-react';
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

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

/** Programação de hoje, vinda da grade cadastrada no painel. */
export default function ProgramGrid() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [onAirId, setOnAirId] = useState<number | null>(null);
  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  // "Hoje" no fuso da rádio, não no do ouvinte
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(new Date());
  const today = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);

  useEffect(() => {
    fetch(`${API_URL}/schedule`)
      .then((r) => (r.ok ? r.json() : { slots: [] }))
      .then((d) => {
        if (d.timezone) setTimezone(d.timezone);
        setSlots(d.slots ?? []);
      })
      .catch(() => setSlots([]));
    fetch(`${API_URL}/schedule/now`)
      .then((r) => (r.ok ? r.json() : { program: null }))
      .then((d: { program?: { id: number } | null }) => setOnAirId(d.program?.id ?? null))
      .catch(() => {});
  }, []);

  if (slots === null) return null;
  const todays = slots.filter((s) => s.dayOfWeek === today);

  if (todays.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        Hoje a rádio está no Auto-DJ o dia todo, com o acervo inteiro em rotação.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {todays.map((s) => {
        const live = s.programId === onAirId;
        return (
          <div
            key={s.id}
            className={`border p-6 rounded-3xl transition-all ${live ? 'border-red-500/50 bg-red-500/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}
          >
            <div className="text-xs text-red-400 font-bold tracking-widest mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {DAYS[s.dayOfWeek]} · {s.startTime} - {s.endTime}
              {live && (
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] bg-red-600 text-white px-2 py-0.5 rounded-full">
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
        );
      })}
    </div>
  );
}
