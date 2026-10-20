'use client';

import { useState, useEffect } from 'react';
import { Lock, KeyRound } from 'lucide-react';
import { API_URL, UNAUTHORIZED_EVENT } from '@/lib/config';

interface AdminAuthProps {
  children: React.ReactNode;
}

type Status = 'checking' | 'out' | 'in';

export default function AdminAuth({ children }: AdminAuthProps) {
  const [status, setStatus] = useState<Status>('checking');
  const [user, setUser] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  // A sessão fica num cookie httpOnly que só a API lê. Aqui só perguntamos se ela é válida.
  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => setStatus(res.ok ? 'in' : 'out'))
      .catch(() => setStatus('out'));

    const onUnauthorized = () => setStatus('out');
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setPassword('');
        setStatus('in');
      } else {
        setError(data.error || 'Não foi possível entrar.');
      }
    } catch {
      setError('Sem conexão com o servidor.');
    } finally {
      setSending(false);
    }
  };

  if (status === 'checking') {
    return <div className="min-h-screen bg-[#050507]" />;
  }

  if (status === 'out') {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-white/10 bg-white/[0.02] p-8 rounded-3xl backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black tracking-wider uppercase">Área restrita</h1>
            <p className="text-xs text-gray-400">Entre com o usuário e a senha do painel.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Usuário"
              autoComplete="username"
              aria-label="Usuário"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              autoComplete="current-password"
              aria-label="Senha"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-red-500 text-white placeholder-gray-500"
              autoFocus
              required
            />

            {error && <p className="text-xs text-red-400 text-center font-semibold" role="alert">{error}</p>}

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" /> {sending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
