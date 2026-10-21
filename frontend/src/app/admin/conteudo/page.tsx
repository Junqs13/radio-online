'use client';

import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Lightbulb, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUpToLine, Upload, X, Save, ImageOff } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';
import { GRADIENTS, gradientClasses, imageSrc } from '@/lib/gradients';

interface Legend {
  id: number;
  artist: string;
  title: string;
  description: string;
  imageUrl: string | null;
  gradient: string;
  year: string | null;
  origin: string | null;
  enabled: boolean;
  createdAt: string;
}

interface Curiosity {
  id: number;
  text: string;
  tags: string[];
  enabled: boolean;
  createdAt: string;
}

const field =
  'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500';
const btn = 'inline-flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border cursor-pointer transition-colors';

const emptyLegend = { artist: '', title: '', description: '', imageUrl: '', gradient: 'vermelho', year: '', origin: '' };

export default function AdminContentPage() {
  const [tab, setTab] = useState<'legends' | 'curiosities'>('legends');
  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-16">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="border-b border-white/10 pb-6 space-y-4">
          <div>
            <h1 className="text-2xl font-black tracking-wider">Conteúdo do site</h1>
            <p className="text-xs text-gray-400">O que você salvar aqui aparece no site na hora, sem deploy.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTab('legends')}
              className={`${btn} ${tab === 'legends' ? 'bg-red-600 border-red-600 text-white' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}
            >
              <BookOpen className="w-4 h-4" /> Lendas & Histórias
            </button>
            <button
              onClick={() => setTab('curiosities')}
              className={`${btn} ${tab === 'curiosities' ? 'bg-red-600 border-red-600 text-white' : 'border-white/10 text-gray-300 hover:bg-white/5'}`}
            >
              <Lightbulb className="w-4 h-4" /> Curiosidades
            </button>
          </div>
        </header>
        {tab === 'legends' ? <Legends /> : <Curiosities />}
      </div>
    </div>
  );
}

/* ------------------------------ Lendas ------------------------------ */

function Legends() {
  const [list, setList] = useState<Legend[]>([]);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [form, setForm] = useState(emptyLegend);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const res = await apiFetch(`${API_URL}/content/admin/legends`);
    if (res.ok) setList((await res.json()).legends ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const active = list.filter((l) => l.enabled);
  const opener = active[0]?.id;
  const closer = active[1]?.id;

  const startNew = () => {
    setForm(emptyLegend);
    setEditing('new');
    setMsg(null);
  };
  const startEdit = (l: Legend) => {
    setForm({ artist: l.artist, title: l.title, description: l.description, imageUrl: l.imageUrl ?? '', gradient: l.gradient, year: l.year ?? '', origin: l.origin ?? '' });
    setEditing(l.id);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    const body = JSON.stringify({ ...form, imageUrl: form.imageUrl || null });
    const res =
      editing === 'new'
        ? await apiFetch(`${API_URL}/content/admin/legends`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        : await apiFetch(`${API_URL}/content/admin/legends/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: editing === 'new' ? 'Lenda criada. Ela é a mais recente e passa a abrir o carrossel.' : 'Alterações salvas.' });
      setEditing(null);
      load();
    } else setMsg({ ok: false, text: d.error ?? 'Não deu para salvar.' });
  };

  const patch = async (id: number, data: Record<string, unknown>) => {
    await apiFetch(`${API_URL}/content/admin/legends/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    load();
  };

  const remove = async (l: Legend) => {
    if (!confirm(`Apagar a lenda "${l.artist} - ${l.title}"?`)) return;
    await apiFetch(`${API_URL}/content/admin/legends/${l.id}`, { method: 'DELETE' });
    load();
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    const res = await apiFetch(`${API_URL}/content/admin/images`, { method: 'POST', body: fd });
    const d = await res.json().catch(() => ({}));
    setUploading(false);
    if (res.ok) setForm((f) => ({ ...f, imageUrl: d.url }));
    else setMsg({ ok: false, text: d.error ?? 'Não deu para enviar a imagem.' });
  };

  const preview = imageSrc(form.imageUrl);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-400 max-w-2xl">
          O carrossel mostra 6 cards. A lenda mais recente abre a fila, a segunda mais recente fecha, e as do meio são sorteadas a cada
          visita. Use &quot;Subir para o topo&quot; para trazer uma lenda antiga para a frente.
        </p>
        {editing === null && (
          <button onClick={startNew} className={`${btn} bg-red-600 border-red-600 text-white hover:bg-red-700`}>
            <Plus className="w-4 h-4" /> Nova lenda
          </button>
        )}
      </div>

      {msg && <p className={`text-sm p-3 rounded-xl ${msg.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{msg.text}</p>}

      {editing !== null && (
        <div className="border border-red-500/30 bg-white/[0.02] rounded-3xl p-5 sm:p-6 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
          <div className="space-y-3">
            <h2 className="font-bold">{editing === 'new' ? 'Nova lenda' : 'Editar lenda'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input className={field} placeholder="Banda ou artista" value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} maxLength={120} />
              <input className={field} placeholder="Música ou disco em destaque" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
              <input className={field} placeholder="Origem (ex: Londres, Inglaterra)" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} maxLength={120} />
              <input className={field} placeholder="Ano (opcional)" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} maxLength={20} />
            </div>
            <textarea
              className={`${field} min-h-[120px]`}
              placeholder="A história que aparece quando a pessoa abre o card"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={1200}
            />
            <p className="text-[11px] text-gray-500 text-right">{form.description.length}/1200</p>

            <div className="space-y-2">
              <p className="text-xs text-gray-400">Foto do card (opcional). Use só imagem que você tem direito de usar.</p>
              <div className="flex flex-wrap gap-2 items-center">
                <label className={`${btn} border-white/10 text-gray-200 hover:bg-white/5`}>
                  <Upload className="w-4 h-4" /> {uploading ? 'Enviando...' : 'Enviar foto'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                </label>
                <input
                  className={`${field} flex-1 min-w-[200px]`}
                  placeholder="ou cole um endereço https://"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                />
                {form.imageUrl && (
                  <button onClick={() => setForm({ ...form, imageUrl: '' })} className={`${btn} border-white/10 text-gray-300`} title="Tirar a foto">
                    <ImageOff className="w-4 h-4" /> Sem foto
                  </button>
                )}
              </div>
            </div>

            {!form.imageUrl && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">Sem foto, o card usa um degradê com o nome da banda. Escolha a cor:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(GRADIENTS).map(([k, g]) => (
                    <button
                      key={k}
                      onClick={() => setForm({ ...form, gradient: k })}
                      title={g.label}
                      aria-label={g.label}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.classes} cursor-pointer ${form.gradient === k ? 'ring-2 ring-white' : 'ring-1 ring-white/10'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={save} className={`${btn} bg-red-600 border-red-600 text-white hover:bg-red-700`}>
                <Save className="w-4 h-4" /> Salvar
              </button>
              <button onClick={() => setEditing(null)} className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}>
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>

          {/* Prévia do card como fica no site */}
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Prévia</p>
            <div className="relative w-[110px] h-[300px] rounded-3xl overflow-hidden border border-white/10 mx-auto">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses(form.gradient)}`}>
                  <span className="absolute inset-0 flex items-center justify-center font-black uppercase text-white/15 text-4xl" style={{ writingMode: 'vertical-rl' }}>
                    {form.artist || 'Banda'}
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[9px] uppercase tracking-widest text-red-400 font-bold block">Ícone</span>
                <span className="text-white font-black text-xs truncate block">{form.artist || 'Banda'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">
          {list.length} lendas · {active.length} no ar
        </p>
        {list.map((l) => (
          <div key={l.id} className={`flex gap-4 items-center border border-white/10 bg-white/[0.02] rounded-2xl p-3 ${l.enabled ? '' : 'opacity-50'}`}>
            <div className="w-12 h-16 rounded-xl overflow-hidden flex-shrink-0 relative border border-white/10">
              {l.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(l.imageUrl) ?? ''} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${gradientClasses(l.gradient)}`} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold truncate">
                {l.artist} <span className="text-gray-400 font-normal">· {l.title}</span>
              </p>
              <p className="text-xs text-gray-500 line-clamp-1">{l.description}</p>
              <div className="flex gap-2 mt-1">
                {l.id === opener && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-300">Abre o carrossel</span>}
                {l.id === closer && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/20 text-red-300">Fecha o carrossel</span>}
                {!l.enabled && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300">Escondida</span>}
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1 flex-shrink-0">
              <IconBtn label="Editar" onClick={() => startEdit(l)}>
                <Pencil className="w-4 h-4" />
              </IconBtn>
              {l.id !== opener && (
                <IconBtn label="Subir para o topo" onClick={() => patch(l.id, { bump: true })}>
                  <ArrowUpToLine className="w-4 h-4" />
                </IconBtn>
              )}
              <IconBtn label={l.enabled ? 'Esconder do site' : 'Mostrar no site'} onClick={() => patch(l.id, { enabled: !l.enabled })}>
                {l.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </IconBtn>
              <IconBtn label="Apagar" danger onClick={() => remove(l)}>
                <Trash2 className="w-4 h-4" />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------- Curiosidades ---------------------------- */

function Curiosities() {
  const [list, setList] = useState<Curiosity[]>([]);
  const [text, setText] = useState('');
  const [tags, setTags] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [filter, setFilter] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await apiFetch(`${API_URL}/content/admin/curiosities`);
    if (res.ok) setList((await res.json()).curiosities ?? []);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    const body = JSON.stringify({ text, tags });
    const res =
      editing === null
        ? await apiFetch(`${API_URL}/content/admin/curiosities`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
        : await apiFetch(`${API_URL}/content/admin/curiosities/${editing}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setMsg({ ok: true, text: editing === null ? 'Curiosidade criada.' : 'Alterações salvas.' });
      setText('');
      setTags('');
      setEditing(null);
      load();
    } else setMsg({ ok: false, text: d.error ?? 'Não deu para salvar.' });
  };

  const patch = async (id: number, data: Record<string, unknown>) => {
    await apiFetch(`${API_URL}/content/admin/curiosities/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    load();
  };
  const remove = async (c: Curiosity) => {
    if (!confirm('Apagar esta curiosidade?')) return;
    await apiFetch(`${API_URL}/content/admin/curiosities/${c.id}`, { method: 'DELETE' });
    load();
  };

  const norm = (t: string) => t.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const shown = list.filter((c) => norm(`${c.text} ${c.tags.join(' ')}`).includes(norm(filter)));

  return (
    <section className="space-y-6">
      <p className="text-sm text-gray-400 max-w-2xl">
        A cada visita o site sorteia uma curiosidade entre as que estão no ar, sem repetir a última que a pessoa viu.
      </p>

      <div className="border border-white/10 bg-white/[0.02] rounded-3xl p-5 sm:p-6 space-y-3">
        <h2 className="font-bold">{editing === null ? 'Nova curiosidade' : 'Editar curiosidade'}</h2>
        <textarea
          className={`${field} min-h-[100px]`}
          placeholder="Escreva a curiosidade como um post curto"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={600}
        />
        <div className="flex flex-wrap gap-3 items-center">
          <input className={`${field} flex-1 min-w-[220px]`} placeholder="Hashtags, separadas por espaço (ex: Queen Anos70)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <span className="text-[11px] text-gray-500">{text.length}/600</span>
        </div>
        {msg && <p className={`text-sm p-3 rounded-xl ${msg.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{msg.text}</p>}
        <div className="flex gap-2">
          <button onClick={save} disabled={text.trim().length < 10} className={`${btn} bg-red-600 border-red-600 text-white hover:bg-red-700 disabled:opacity-50`}>
            <Save className="w-4 h-4" /> {editing === null ? 'Publicar' : 'Salvar'}
          </button>
          {editing !== null && (
            <button
              onClick={() => {
                setEditing(null);
                setText('');
                setTags('');
              }}
              className={`${btn} border-white/10 text-gray-300 hover:bg-white/5`}
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-bold">
          {list.length} curiosidades · {list.filter((c) => c.enabled).length} no ar
        </p>
        <input className={`${field} sm:w-72`} placeholder="Procurar" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

      <div className="space-y-2">
        {shown.map((c) => (
          <div key={c.id} className={`flex gap-3 items-start border border-white/10 bg-white/[0.02] rounded-2xl p-4 ${c.enabled ? '' : 'opacity-50'}`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-100">{c.text}</p>
              {c.tags.length > 0 && <p className="text-xs text-red-400 mt-1">{c.tags.map((t) => `#${t}`).join(' ')}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <IconBtn
                label="Editar"
                onClick={() => {
                  setEditing(c.id);
                  setText(c.text);
                  setTags(c.tags.join(' '));
                  setMsg(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Pencil className="w-4 h-4" />
              </IconBtn>
              <IconBtn label={c.enabled ? 'Esconder do site' : 'Mostrar no site'} onClick={() => patch(c.id, { enabled: !c.enabled })}>
                {c.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </IconBtn>
              <IconBtn label="Apagar" danger onClick={() => remove(c)}>
                <Trash2 className="w-4 h-4" />
              </IconBtn>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`p-2 rounded-lg text-gray-400 cursor-pointer hover:bg-white/5 ${danger ? 'hover:text-red-400' : 'hover:text-white'}`}
    >
      {children}
    </button>
  );
}
