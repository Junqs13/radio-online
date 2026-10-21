'use client';

import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Clock, GripVertical, Trash2, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';

export interface BoardSlot {
  id: number;
  programId: number;
  program_title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  transitionType: string;
  jingleEnabled: boolean;
  color: string;
  mediaFolder?: string | null;
}

export interface BoardProgram {
  id: number;
  title: string;
  color?: string;
}

const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
// Semana começando na segunda, como a grade é pensada
const ORDER = [1, 2, 3, 4, 5, 6, 0];

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
function duration(s: BoardSlot) {
  let m = toMin(s.endTime) - toMin(s.startTime);
  if (m <= 0) m += 24 * 60;
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`;
}

function SlotCard({ slot, onRemove, overlay = false }: { slot: BoardSlot; onRemove?: (id: number) => void; overlay?: boolean }) {
  const id = `slot-${slot.id}`;
  const drag = useDraggable({ id, data: { kind: 'slot', slot }, disabled: overlay });
  const drop = useDroppable({ id, data: { kind: 'slot', slot }, disabled: overlay });
  const setRef = (el: HTMLElement | null) => {
    drag.setNodeRef(el);
    drop.setNodeRef(el);
  };
  const dragging = drag.isDragging && !overlay;
  const target = drop.isOver && !drag.isDragging;

  return (
    <div
      ref={overlay ? undefined : setRef}
      {...(overlay ? {} : drag.attributes)}
      {...(overlay ? {} : drag.listeners)}
      className={`relative overflow-hidden rounded-xl border p-3 pl-4 space-y-1 select-none touch-manipulation cursor-grab active:cursor-grabbing transition ${
        target ? 'border-red-500 bg-red-500/10 scale-[1.02]' : 'border-white/10 bg-black/50'
      } ${dragging ? 'opacity-30' : ''} ${overlay ? 'shadow-2xl shadow-black/60 rotate-2 border-red-500/60 bg-[#111]' : ''}`}
    >
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: slot.color }} />
      <div className="flex items-center justify-between text-[11px] text-gray-400 gap-2">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {slot.startTime} - {slot.endTime}
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-500">{duration(slot)}</span>
          {onRemove && !overlay && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRemove(slot.id)}
              aria-label={`Tirar ${slot.program_title} da grade`}
              className="text-gray-500 hover:text-red-400 cursor-pointer p-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      </div>
      <h4 className="text-xs font-bold text-white flex items-start gap-1">
        <GripVertical className="w-3.5 h-3.5 text-gray-600 flex-shrink-0 mt-px" />
        <span>{slot.program_title}</span>
      </h4>
    </div>
  );
}

function ProgramChip({ program, overlay = false }: { program: BoardProgram; overlay?: boolean }) {
  const drag = useDraggable({ id: `prog-${program.id}`, data: { kind: 'program', program }, disabled: overlay });
  return (
    <div
      ref={overlay ? undefined : drag.setNodeRef}
      {...(overlay ? {} : drag.attributes)}
      {...(overlay ? {} : drag.listeners)}
      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-200 select-none touch-manipulation cursor-grab active:cursor-grabbing ${
        drag.isDragging && !overlay ? 'opacity-30' : ''
      } ${overlay ? 'shadow-2xl shadow-black/60 border-red-500/60 bg-[#111]' : ''}`}
    >
      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: program.color ?? '#dc2626' }} />
      {program.title}
    </div>
  );
}

export default function ScheduleBoard({
  slots,
  programs,
  onChanged,
  onRemove,
}: {
  slots: BoardSlot[];
  programs: BoardProgram[];
  onChanged: () => void;
  onRemove: (id: number) => void;
}) {
  const [local, setLocal] = useState<BoardSlot[] | null>(null);
  const [active, setActive] = useState<{ kind: 'slot'; slot: BoardSlot } | { kind: 'program'; program: BoardProgram } | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const view = local ?? slots;

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // No celular, segurar um instante antes de arrastar; um toque rápido continua rolando a página
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const onDragStart = (e: DragStartEvent) => setActive((e.active.data.current as typeof active) ?? null);

  const onDragEnd = async (e: DragEndEvent) => {
    setActive(null);
    const from = e.active.data.current as { kind: string; slot?: BoardSlot; program?: BoardProgram } | undefined;
    const to = e.over?.data.current as { kind: string; slot?: BoardSlot } | undefined;
    if (!from || !to?.slot) return;
    const target = to.slot;

    if (from.kind === 'slot' && from.slot && from.slot.id !== target.id) {
      const a = from.slot;
      // Mostra a troca na hora; a grade volta do servidor logo depois
      const swap = (s: BoardSlot): BoardSlot =>
        s.id === a.id
          ? { ...s, programId: target.programId, program_title: target.program_title, color: target.color, transitionType: target.transitionType, jingleEnabled: target.jingleEnabled }
          : s.id === target.id
            ? { ...s, programId: a.programId, program_title: a.program_title, color: a.color, transitionType: a.transitionType, jingleEnabled: a.jingleEnabled }
            : s;
      setLocal(view.map(swap));
      const res = await apiFetch(`${API_URL}/schedule/slots/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: a.id, b: target.id }),
      });
      setMsg(
        res.ok
          ? { text: `Trocado: ${a.program_title} foi para ${DAYS[target.dayOfWeek]} ${target.startTime} e ${target.program_title} para ${DAYS[a.dayOfWeek]} ${a.startTime}.`, ok: true }
          : { text: (await res.json().catch(() => ({}))).error ?? 'Não deu para trocar.', ok: false },
      );
    } else if (from.kind === 'program' && from.program && from.program.id !== target.programId) {
      const p = from.program;
      setLocal(view.map((s) => (s.id === target.id ? { ...s, programId: p.id, program_title: p.title, color: p.color ?? s.color } : s)));
      const res = await apiFetch(`${API_URL}/schedule/slots/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId: p.id }),
      });
      setMsg(
        res.ok
          ? { text: `${DAYS[target.dayOfWeek]} ${target.startTime} agora é ${p.title}.`, ok: true }
          : { text: (await res.json().catch(() => ({}))).error ?? 'Não deu para trocar.', ok: false },
      );
    } else {
      return;
    }
    onChanged();
    setLocal(null);
  };

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)}>
      <div className="space-y-4">
        <p className="text-xs text-gray-400 flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-red-500 flex-shrink-0" />
          Arraste um bloco sobre outro para trocar os dois de lugar. Para pôr um programa num horário, arraste ele da lista abaixo até o bloco.
          No celular, segure o dedo um instante antes de arrastar.
        </p>

        <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Programas">
          {programs.map((p) => (
            <ProgramChip key={p.id} program={p} />
          ))}
        </div>

        {msg && (
          <div role="status" className={`p-3 rounded-xl text-sm flex items-center gap-2 ${msg.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {msg.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />} {msg.text}
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-4 snap-x">
          {ORDER.map((day) => {
            const daySlots = view.filter((s) => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={day} className="snap-start flex-shrink-0 w-[230px] bg-white/[0.02] border border-white/10 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-red-400">{DAYS[day]}</span>
                  <span className="text-[11px] text-gray-500">{daySlots.length} blocos</span>
                </div>
                {daySlots.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">Auto-DJ o dia todo</p>
                ) : (
                  daySlots.map((slot) => <SlotCard key={slot.id} slot={slot} onRemove={onRemove} />)
                )}
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {active?.kind === 'slot' && <SlotCard slot={active.slot} overlay />}
        {active?.kind === 'program' && <ProgramChip program={active.program} overlay />}
      </DragOverlay>
    </DndContext>
  );
}
