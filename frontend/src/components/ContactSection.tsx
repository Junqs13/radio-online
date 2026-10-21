'use client';

import { useState } from 'react';
import { Send, Mail, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { API_URL } from '@/lib/config';
import { SITE } from '@/lib/site';

const field =
  'w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-red-500 transition-colors';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatus(null);
    try {
      const res = await fetch(`${API_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ ok: true, text: 'Mensagem enviada. Obrigado por escrever para a Antena Rock.' });
        setForm({ name: '', email: '', subject: '', message: '', website: '' });
      } else {
        setStatus({ ok: false, text: data.error ?? 'Não deu para enviar agora. Tente de novo.' });
      }
    } catch {
      setStatus({ ok: false, text: 'Sem conexão com a rádio agora. Tente de novo em instantes.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold">Fale conosco</h2>
        <h3 className="text-3xl sm:text-4xl font-black tracking-tight">Manda um alô para a rádio</h3>
        <p className="text-gray-400 text-sm leading-relaxed">
          Sugestão de banda, ideia de programa, parceria ou só um recado. As mensagens chegam direto para a equipe da Antena Rock.
        </p>
        <div className="space-y-2 text-sm text-gray-300">
          <p className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-500" /> {SITE.city}, {SITE.state}
          </p>
          {SITE.email && (
            <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-white">
              <Mail className="w-4 h-4 text-red-500" /> {SITE.email}
            </a>
          )}
        </div>
      </div>

      <form onSubmit={submit} className="lg:col-span-3 border border-white/10 bg-white/[0.02] rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input value={form.name} onChange={set('name')} placeholder="Seu nome" aria-label="Seu nome" className={field} required minLength={2} maxLength={120} autoComplete="name" />
          <input value={form.email} onChange={set('email')} type="email" placeholder="Seu e-mail" aria-label="Seu e-mail" className={field} required maxLength={200} autoComplete="email" />
        </div>
        <input value={form.subject} onChange={set('subject')} placeholder="Assunto (opcional)" aria-label="Assunto" className={field} maxLength={150} />
        <textarea value={form.message} onChange={set('message')} placeholder="Sua mensagem" aria-label="Sua mensagem" className={`${field} min-h-[140px] resize-y`} required minLength={5} maxLength={4000} />
        {/* Campo escondido contra robôs: pessoas não veem nem preenchem */}
        <input value={form.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" name="website" />

        {status && (
          <div role="status" className={`p-3 rounded-xl text-sm flex items-center gap-2 ${status.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            {status.ok ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />} {status.text}
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-60 px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-4 h-4" /> {sending ? 'Enviando...' : 'Enviar mensagem'}
        </button>
      </form>
    </div>
  );
}
