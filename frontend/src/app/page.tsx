'use client';


import { useEffect, useRef } from 'react';
import { Radio, Sparkles } from 'lucide-react';
import SmoothScroll from '@/components/SmoothScroll';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import RecentTracks from '@/components/RecentTracks';
import RockMagneticCarousel from '@/components/RockMagneticCarousel';
import SmoothScrollSlider from '@/components/SmoothScrollSlider';
import InteractiveGrid from '@/components/InteractiveGrid';
import ScrollLineBackground from '@/components/ScrollLineBackground'; 
import SongRequestWidget from '@/components/SongRequestWidget';
import LivePlayer from '@/components/LivePlayer';
import StickyPlayer from '@/components/StickyPlayer';
import { PlayerProvider } from '@/components/PlayerContext';
import ProgramGrid from '@/components/ProgramGrid';
import ContactSection from '@/components/ContactSection';
import CuriosityPost from '@/components/CuriosityPost';

// Registra o plugin de ScrollTrigger no GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  // Referências para animações via ScrollTrigger
  const heroRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Animação do Hero Inicial
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current.children,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, stagger: 0.2, ease: 'power3.out' }
      );
    }

    // 3. Storytelling do Manifesto
    if (manifestoRef.current) {
      gsap.fromTo(
        manifestoRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          stagger: 0.3,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: manifestoRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

    // 4. Grade de Programas com efeito em cascata
    if (progRef.current) {
      gsap.fromTo(
        progRef.current.children,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: progRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }

  }, []);

  return (
    <PlayerProvider>
    <SmoothScroll>
      <div className="min-h-screen bg-[#050507] text-white selection:bg-red-600 selection:text-white font-sans overflow-x-hidden relative">
        
        {/* Linha Animada no Fundo */}
        <ScrollLineBackground />

        {/* HEADER REATIVO */}
        <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-[#050507]/70 border-b border-white/5 px-5 sm:px-8 lg:px-16 py-4 lg:py-5 flex flex-wrap items-center justify-between gap-y-3 transition-all">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-purple-600 flex items-center justify-center shadow-lg shadow-red-600/20 group-hover:scale-105 transition-transform">
              <Radio className="text-white w-5 h-5 animate-pulse" />
            </div>
            <span className="font-black tracking-[0.2em] text-sm lg:text-base">ANTENA<span className="text-red-600">ROCK</span></span>
          </div>

          <nav className="hidden lg:flex items-center gap-6 xl:gap-10 text-xs uppercase tracking-widest text-gray-400 font-medium">
            <a href="#home" className="hover:text-white transition-colors">Início</a>
            <a href="#player" className="hover:text-white transition-colors">Ao vivo</a>
            <a href="#pedidos" className="hover:text-white transition-colors">Pedidos</a>
            <a href="#historia" className="hover:text-white transition-colors">Manifesto</a>
            <a href="#programacao" className="hover:text-white transition-colors">Grade</a>
            <a href="#fale-conosco" className="hover:text-white transition-colors">Fale conosco</a>
          </nav>

          {/* Celular e tablet: links numa faixa que rola para o lado */}
          <nav className="lg:hidden w-full flex gap-4 sm:gap-6 overflow-x-auto text-[11px] uppercase tracking-wider text-gray-400 font-medium -mb-1 pb-1">
            <a href="#player" className="flex-shrink-0 hover:text-white">Ouvir</a>
            <a href="#pedidos" className="flex-shrink-0 hover:text-white">Pedidos</a>
            <a href="#programacao" className="flex-shrink-0 hover:text-white">Grade</a>
            <a href="#historia" className="flex-shrink-0 hover:text-white">Manifesto</a>
            <a href="#fale-conosco" className="flex-shrink-0 hover:text-white">Fale conosco</a>
          </nav>
        </header>

        {/* CENA 1: HERO */}
        <section id="home" className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-6 pt-20 pb-12 z-10">
          <div className="absolute w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none -top-32 -left-32 animate-pulse"></div>
          <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -bottom-32 -right-32"></div>

          <div ref={heroRef} className="max-w-4xl z-10 space-y-6">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-xs text-gray-300 backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-red-500" /> De Sorocaba, no ar 24 horas
            </div>
            
            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-tighter uppercase leading-[0.9]">
              Antena <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-purple-600">Rock</span>.
            </h1>
            
            <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
              Rock nacional e internacional, das décadas de 50 até hoje, tocando sem parar.
            </p>
          </div>
        </section>

        {/* PLAYER AO VIVO + O QUE TOCA AGORA */}
        <section id="player" className="py-6 px-6 lg:px-16 max-w-5xl mx-auto relative z-20 -mt-10">
          <LivePlayer />
        </section>

        {/* WIDGET DE PEDIDOS DE MÚSICA */}
        <section id="pedidos" className="py-8 px-6 lg:px-16 max-w-4xl mx-auto relative z-10">
          <SongRequestWidget />
        </section>

        {/* CARROSSEL MAGNÉTICO DE LENDAS DO ROCK */}
        <section className="py-10 bg-transparent relative">
          <RockMagneticCarousel />
        </section>

        {/* ÚLTIMAS TOCADAS + CURIOSIDADE DO DIA */}
        <section className="py-10 px-6 lg:px-16 max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <RecentTracks />
          <CuriosityPost />
        </section>

        {/* MANIFESTO */}
        <section id="historia" className="py-16 px-6 lg:px-16 max-w-5xl mx-auto text-center space-y-8 relative z-10">
          <div ref={manifestoRef} className="space-y-6">
            <h2 className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold">O Manifesto</h2>
            <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              De Sorocaba para o mundo, no volume que o rock merece.
            </h3>
            <p className="text-gray-400 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
              A Antena Rock é uma rádio feita em Sorocaba por quem gosta de rock alto. Aqui toca o riff que fez muita gente pegar numa guitarra e o refrão que um estádio inteiro canta junto.
            </p>
            <p className="text-gray-400 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
              Tem Raul e Legião, tem Iron Maiden e Elvis. A programação atravessa as décadas sem pedir licença, de dia e de madrugada. Esteja você aqui na cidade, do outro lado do país ou fora dele, aumenta o som. A gente toca para quem ouve.
            </p>
          </div>
        </section>

        {/* GRADE DE PROGRAMAS */}
        <section id="programacao" className="py-16 px-6 lg:px-16 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4">
            <div>
              <h2 className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold mb-2">Grade de Conteúdo</h2>
              <h3 className="text-3xl font-black tracking-tight">Programação de hoje</h3>
            </div>
          </div>

          <div ref={progRef}>
            <ProgramGrid />
          </div>
        </section>

        {/* FALE CONOSCO */}
        <section id="fale-conosco" className="py-16 px-6 lg:px-16 max-w-6xl mx-auto relative z-10 scroll-mt-24">
          <ContactSection />
        </section>

        {/* SMOOTH SCROLL SLIDER */}
        <section className="py-10 bg-transparent overflow-hidden relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 mb-6">
            <h2 className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold mb-1">Galeria Dinâmica</h2>
            <h3 className="text-2xl font-black tracking-tight">Destaques Visuais & Comunidade</h3>
          </div>
          <div className="w-full h-[380px]">
            <SmoothScrollSlider />
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="border-t border-white/10 pt-12 pb-28 px-8 lg:px-16 text-center text-xs text-gray-500 space-y-6 relative z-10 bg-[#050507]/90 backdrop-blur-md">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
              <Radio className="text-red-500 w-4 h-4" />
            </div>
            <span className="font-bold tracking-[0.2em] text-gray-300">ANTENA <span className="text-red-500">ROCK</span></span>
          </div>

          <div className="flex justify-center">
            <InteractiveGrid />
          </div>

          <p>© {new Date().getFullYear()} Antena Rock · Sorocaba, SP · <a href="#fale-conosco" className="hover:text-white">Fale conosco</a></p>
        </footer>

      </div>
    </SmoothScroll>
    <StickyPlayer />
    </PlayerProvider>
  );
}