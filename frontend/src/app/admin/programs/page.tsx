'use client';

import { useState, useEffect, useCallback } from 'react';
import { Radio, PlusCircle, Mic, FolderOpen, Pencil, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';

interface Program {
  id: number;
  title: string;
  host: string;
  category: string;
  description: string | null;
  color: string;
  mediaFolder: string | null;
  _count?: { slots: number };
}

interface Folder {
  name: string;
  tracks: number;
  seconds: number;
}

const EMPTY = { title: '', host: '', category: '', description: '', color: '#dc2626', mediaFolder: '' };
const hours = (s: number) => `${Math.floor(s / 3600)}h${String(Math.round((s % 3600) / 60)).padStart(2, '0')}`;
const field =
  'bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500';

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, f] = await Promise.all([apiFetch(`${API_URL}/schedule/programs`), apiFetch(`${API_URL}/media/folders`)]);
      if (p.ok) setPrograms((await p.json()).programs ?? []);
      if (f.ok) setFolders((await f.json()).folders ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const startEdit = (p: Program) => {
    setEditing(p.id);
    setForm({
      title: p.title,
      host: p.host,
      category: p.category,
      description: p.description ?? '',
      color: p.color,
      mediaFolder: p.mediaFolder ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch(`${API_URL}/schedule/programs${editing ? `/${editing}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, mediaFolder: form.mediaFolder || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage({ text: editing ? 'Programa atualizado.' : 'Programa criado. Agora coloque ele na grade.', ok: true });
        setForm(EMPTY);
        setEditing(null);
        load();
      } else {
        setMessage({ text: data.error || 'Erro ao salvar o programa.', ok: false });
      }
    } catch {
      setMessage({ text: 'Sem conexão com o servidor.', ok: false });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: Program) => {
    if (!window.confirm(`Apagar "${p.title}" e os ${p._count?.slots ?? 0} horários dele na grade?`)) return;
    const res = await apiFetch(`${API_URL}/schedule/programs/${p.id}`, { method: 'DELETE' });
    setMessage(res.ok ? { text: 'Programa apagado.', ok: true } : { text: 'Não foi possível apagar.', ok: false });
    load();
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-16">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex items-center gap-3 border-b border-white/10 pb-6">
          <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-wider">Programas</h1>
            <p className="text-xs text-gray-400">
              Cada programa toca as músicas de uma pasta do acervo. Depois de criar, coloque ele num horário da grade.
            </p>
          </div>
        </header>

        <section className="border border-white/10 bg-white/[0.02] p-6 rounded-3xl space-y-6">
          <h2 className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> {editing ? 'Editar programa' : 'Novo programa'}
          </h2>

          {message && (
            <div
              role="status"
              className={`p-4 rounded-xl text-sm flex items-center gap-2 ${message.ok ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
            >
              {message.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input value={form.title} onChange={set('title')} placeholder="Nome do programa" aria-label="Nome do programa" className={field} required />
            <input value={form.host} onChange={set('host')} placeholder="Apresentador" aria-label="Apresentador" className={field} required />
            <input value={form.category} onChange={set('category')} placeholder="Estilo (ex: Rock nacional)" aria-label="Estilo" className={field} required />

            <label className="sm:col-span-2 flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-1">
              <FolderOpen className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-400 flex-shrink-0">Toca a pasta</span>
              <select value={form.mediaFolder} onChange={set('mediaFolder')} className="flex-1 bg-transparent py-2 text-sm text-white focus:outline-none cursor-pointer">
                <option value="" className="bg-[#050507]">Nenhuma (só faixas ligadas ao programa)</option>
                {folders.map((f) => (
                  <option key={f.name} value={f.name} className="bg-[#050507]">
                    {f.name} ({f.tracks} faixas, {hours(f.seconds)})
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl px-4 py-2">
              <span className="text-xs text-gray-400">Cor</span>
              <input type="color" value={form.color} onChange={set('color')} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer" />
            </label>

            <input value={form.description} onChange={set('description')} placeholder="Descrição curta (opcional)" aria-label="Descrição" className={`${field} sm:col-span-2 lg:col-span-3`} />

            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest cursor-pointer"
              >
                {saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Criar programa'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setForm(EMPTY);
                  }}
                  className="px-6 bg-white/5 border border-white/10 rounded-xl text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <h2 className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">Programas cadastrados</h2>
          {loading ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
          ) : programs.length === 0 ? (
            <div className="text-center py-16 border border-white/5 rounded-3xl text-gray-400 text-sm">
              Nenhum programa ainda. Enquanto isso, a rádio toca o acervo inteiro em rotação.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {programs.map((p) => (
                <div key={p.id} className="border border-white/10 bg-white/[0.02] p-5 rounded-2xl relative overflow-hidden space-y-3">
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: p.color }} />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-md text-gray-300 font-bold">{p.category}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(p)} aria-label={`Editar ${p.title}`} className="p-2 text-gray-400 hover:text-white cursor-pointer">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(p)} aria-label={`Apagar ${p.title}`} className="p-2 text-gray-400 hover:text-red-400 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-base font-black text-white">{p.title}</h3>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-red-500" /> {p.host}
                  </p>
                  <p className="text-xs text-gray-300 flex items-center gap-1">
                    <FolderOpen className="w-3.5 h-3.5" /> {p.mediaFolder || 'Sem pasta'} · {p._count?.slots ?? 0} horário(s) na grade
                  </p>
                  {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
