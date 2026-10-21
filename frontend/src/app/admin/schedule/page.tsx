'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, AlertTriangle, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';
import ScheduleBoard, { type BoardSlot, type BoardProgram } from '@/components/ScheduleBoard';

type Slot = BoardSlot;

interface Gap {
  day: string;
  dayIndex: number;
  missingHours: string;
}

type Program = BoardProgram;

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const TRANSITIONS: Record<string, string> = { crossfade: 'Crossfade (5 s)', 'fade-in': 'Fade curto (2 s)', 'hard-cut': 'Corte seco' };
const field = 'bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500';

export default function AdminSchedulePage() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [gaps, setGaps] = useState<Gap[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [timezone, setTimezone] = useState('');
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [form, setForm] = useState({ programId: '', startTime: '08:00', endTime: '12:00', transitionType: 'crossfade', jingleEnabled: true });
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([apiFetch(`${API_URL}/schedule`), apiFetch(`${API_URL}/schedule/programs`)]);
      if (s.ok) {
        const d = await s.json();
        setSlots(d.slots ?? []);
        setGaps(d.gaps ?? []);
        setTimezone(d.timezone ?? '');
      }
      if (p.ok) setPrograms((await p.json()).programs ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Cria um bloco por dia marcado. Se algum conflitar, os outros entram e o erro aparece.
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.programId || days.length === 0) return;
    setSaving(true);
    const errors: string[] = [];
    for (const dayOfWeek of days) {
      const res = await apiFetch(`${API_URL}/schedule/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, programId: Number(form.programId), dayOfWeek }),
      });
      if (!res.ok) errors.push(`${DAYS[dayOfWeek]}: ${(await res.json().catch(() => ({}))).error ?? 'erro'}`);
    }
    setMessage(errors.length ? { text: errors.join(' · '), ok: false } : { text: 'Horários adicionados à grade.', ok: true });
    setSaving(false);
    load();
  };

  const removeSlot = async (id: number) => {
    await apiFetch(`${API_URL}/schedule/slots/${id}`, { method: 'DELETE' });
    load();
  };

  const toggleDay = (d: number) => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d].sort());

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-16">
      <div className="max-w-7xl mx-auto space-y-10">
        <header className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider">Grade de programação</h1>
            <p className="text-xs text-gray-400">
              Horários no fuso {timezone || 'da rádio'}. Fora dos blocos, o Auto-DJ toca o acervo inteiro.
            </p>
          </div>
        </header>

        <section className="border border-white/10 bg-white/[0.02] p-6 rounded-3xl space-y-5">
          <h2 className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Colocar programa na grade
          </h2>
          {programs.length === 0 && !loading ? (
            <p className="text-sm text-gray-400">
              Crie um programa primeiro na aba <a href="/admin/programs" className="text-red-400 underline">Programas</a>.
            </p>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })} aria-label="Programa" className={`${field} lg:col-span-2`} required>
                  <option value="" className="bg-[#050507]">Escolha o programa</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#050507]">{p.title}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  Início
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className={`${field} flex-1`} required />
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-400">
                  Fim
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className={`${field} flex-1`} required />
                </label>
                <select value={form.transitionType} onChange={(e) => setForm({ ...form, transitionType: e.target.value })} aria-label="Transição" className={field}>
                  {Object.entries(TRANSITIONS).map(([v, l]) => (
                    <option key={v} value={v} className="bg-[#050507]">{l}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {DAYS.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(i)}
                    aria-pressed={days.includes(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${days.includes(i) ? 'bg-red-600 border-red-600 text-white' : 'bg-white/5 border-white/10 text-gray-300'}`}
                  >
                    {d}
                  </button>
                ))}
                <label className="flex items-center gap-2 text-xs text-gray-300 ml-2">
                  <input type="checkbox" checked={form.jingleEnabled} onChange={(e) => setForm({ ...form, jingleEnabled: e.target.checked })} />
                  Tocar vinhetas
                </label>
              </div>
              {message && (
                <div role="status" className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {message.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {message.text}
                </div>
              )}
              <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-60 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer">
                {saving ? 'Salvando...' : 'Adicionar horários'}
              </button>
              <p className="text-xs text-gray-400">Um bloco que termina depois da meia-noite (ex: 22:00 até 02:00) continua no dia seguinte.</p>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.3em] text-yellow-300 font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Horários só com Auto-DJ
          </h2>
          {gaps.length === 0 ? (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl text-green-400 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> A semana inteira tem programa.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {gaps.map((g, i) => (
                <span key={i} className="text-xs bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 px-3 py-1.5 rounded-lg">
                  {g.day}: {g.missingHours}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">Semana</h2>
          <ScheduleBoard slots={slots} programs={programs} onChanged={load} onRemove={removeSlot} />
        </section>
      </div>
    </div>
  );
}
