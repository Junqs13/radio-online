'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mail, MailOpen, Trash2, RefreshCw, Reply } from 'lucide-react';
import { API_URL, apiFetch } from '@/lib/config';

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [onlyUnread, setOnlyUnread] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${API_URL}/contact`);
      if (res.ok) setMessages((await res.json()).messages ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setRead = async (m: Message, read: boolean) => {
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, read } : x)));
    await apiFetch(`${API_URL}/contact/${m.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read }),
    });
  };

  const remove = async (m: Message) => {
    if (!confirm(`Apagar a mensagem de ${m.name}?`)) return;
    await apiFetch(`${API_URL}/contact/${m.id}`, { method: 'DELETE' });
    setMessages((list) => list.filter((x) => x.id !== m.id));
  };

  const unread = messages.filter((m) => !m.read).length;
  const shown = onlyUnread ? messages.filter((m) => !m.read) : messages;

  return (
    <div className="min-h-screen bg-[#050507] text-white p-6 lg:p-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-wider">Mensagens</h1>
              <p className="text-xs text-gray-400">
                Recebidas pelo Fale conosco do site. {unread > 0 ? `${unread} sem ler.` : 'Nenhuma sem ler.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-300">
              <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} /> Só não lidas
            </label>
            <button onClick={load} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer hover:bg-white/10">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
            </button>
          </div>
        </header>

        {!loading && shown.length === 0 && <p className="text-sm text-gray-400 text-center py-12">Nenhuma mensagem por aqui.</p>}

        <div className="space-y-4">
          {shown.map((m) => (
            <article
              key={m.id}
              className={`border rounded-2xl p-5 space-y-3 ${m.read ? 'border-white/5 bg-white/[0.01]' : 'border-red-500/30 bg-red-500/[0.04]'}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-bold text-white flex items-center gap-2">
                    {!m.read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" aria-label="Não lida" />}
                    {m.subject || 'Sem assunto'}
                  </h2>
                  <p className="text-xs text-gray-400 break-all">
                    {m.name} · {m.email} · {when(m.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Sua mensagem para a Antena Rock'))}`}
                    onClick={() => !m.read && setRead(m, true)}
                    className="p-2 text-gray-400 hover:text-white"
                    aria-label={`Responder ${m.name} por e-mail`}
                    title="Responder por e-mail"
                  >
                    <Reply className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setRead(m, !m.read)}
                    className="p-2 text-gray-400 hover:text-white cursor-pointer"
                    aria-label={m.read ? 'Marcar como não lida' : 'Marcar como lida'}
                    title={m.read ? 'Marcar como não lida' : 'Marcar como lida'}
                  >
                    {m.read ? <Mail className="w-4 h-4" /> : <MailOpen className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(m)} className="p-2 text-gray-400 hover:text-red-400 cursor-pointer" aria-label="Apagar" title="Apagar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-200 whitespace-pre-wrap break-words">{m.message}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
