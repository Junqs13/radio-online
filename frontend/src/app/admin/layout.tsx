'use client';

import AdminAuth from '@/components/AdminAuth';
import { API_URL } from '@/lib/config';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Music, Calendar, Inbox, LogOut } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    window.location.reload();
  };

  const navItems = [
    { name: 'Pedidos', href: '/admin/requests', icon: Inbox },
    { name: 'Programas', href: '/admin/programs', icon: Radio },
    { name: 'Grade', href: '/admin/schedule', icon: Calendar },
    { name: 'Acervo', href: '/admin/media', icon: Music },
  ];

  return (
    <AdminAuth>
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        
        {/* BARRA DE NAVEGAÇÃO SUPERIOR DO PAINEL ADMIN */}
        <header className="border-b border-white/10 bg-[#050507]/90 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <span className="font-black tracking-wider text-xs lg:text-sm">
                ADMIN <span className="text-red-600">ANTENA ROCK</span>
              </span>
            </div>

            {/* BOTÕES DE NAVEGAÇÃO ENTRE AS PÁGINAS DO PAINEL */}
            <nav className="hidden md:flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* BOTÃO DE SAÍDA / TERMINAR SESSÃO */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/5 hover:bg-red-600/20 border border-white/10 hover:border-red-500/30 px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-red-400 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </header>

        {/* CONTEÚDO DA PÁGINA ATIVA (Requests, Schedule ou Media) */}
        <main className="flex-1">
          {children}
        </main>

      </div>
    </AdminAuth>
  );
}