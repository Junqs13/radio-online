'use client';

import AdminAuth from '@/components/AdminAuth';
import { API_URL } from '@/lib/config';
import Link from 'next/link';
import { BrandMark, BrandWordmark } from '@/components/BrandLogo';
import { usePathname } from 'next/navigation';
import { Radio, Music, Calendar, Inbox, LogOut, Mail, BookOpen, BarChart3 } from 'lucide-react';

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
    { name: 'Mensagens', href: '/admin/messages', icon: Mail },
    { name: 'Conteúdo', href: '/admin/conteudo', icon: BookOpen },
    { name: 'Estatísticas', href: '/admin/estatisticas', icon: BarChart3 },
  ];

  return (
    <AdminAuth>
      <div className="min-h-screen bg-[#050507] text-white flex flex-col">
        
        {/* BARRA DE NAVEGAÇÃO SUPERIOR DO PAINEL ADMIN */}
        <header className="border-b border-white/10 bg-[#050507]/90 backdrop-blur-md px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <BrandMark size={34} simple />
              <span className="flex flex-col leading-none gap-0.5">
                <BrandWordmark size="sm" />
                <span className="font-brand text-[8px] tracking-[0.4em] text-gray-500">PAINEL</span>
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

        {/* No celular, as abas do painel ficam numa barra logo abaixo do topo */}
        <nav className="md:hidden sticky top-[69px] z-40 flex gap-1 overflow-x-auto border-b border-white/10 bg-[#050507]/95 backdrop-blur-md px-4 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold ${
                  isActive ? 'bg-red-600 text-white' : 'text-gray-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* CONTEÚDO DA PÁGINA ATIVA (Requests, Schedule ou Media) */}
        <main className="flex-1">
          {children}
        </main>

      </div>
    </AdminAuth>
  );
}