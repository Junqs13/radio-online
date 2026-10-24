'use client';


import { useEffect, useRef } from 'react';
import { BrandMark, BrandWordmark } from '@/components/BrandLogo';
import { SITE } from '@/lib/site';
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
import { startAnalytics } from '@/lib/analytics';
import { startReveal } from '@/lib/reveal';
import ProgramGrid from '@/components/ProgramGrid';
import ContactSection from '@/components/ContactSection';
import CuriosityPost from '@/components/CuriosityPost';

// Registra o plugin de ScrollTrigger no GSAP
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// Cada palavra vira um span para o manifesto "acender" palavra por palavra conforme a rolagem
function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span key={i} className="mf-word inline-block">
          {w}&nbsp;
        </span>
      ))}
    </>
  );
}

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const manifestoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startAnalytics(); // estatísticas próprias do site, sem cookie
    const stopReveal = startReveal(); // entradas no scroll (data-reveal)
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      // Abertura: selo, título e frase entram em sequência
      if (heroRef.current) {
        gsap.fromTo(
          heroRef.current.children,
          { opacity: 0, y: 60, filter: 'blur(10px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.3, stagger: 0.18, ease: 'power3.out' },
        );
      }
      if (calm) return;

      // Ao descer, o título do topo sobe mais devagar, encolhe e apaga (profundidade)
      gsap.to('#home h1', {
        yPercent: -35,
        scale: 0.86,
        opacity: 0.15,
        ease: 'none',
        scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('#home .hero-glow', {
        yPercent: 40,
        ease: 'none',
        scrollTrigger: { trigger: '#home', start: 'top top', end: 'bottom top', scrub: true },
      });

      // Manifesto: as palavras acendem uma a uma conforme a rolagem
      if (manifestoRef.current) {
        gsap.fromTo(
          manifestoRef.current.querySelectorAll('.mf-word'),
          { opacity: 0.12 },
          {
            opacity: 1,
            stagger: 0.04,
            ease: 'none',
            scrollTrigger: { trigger: manifestoRef.current, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
          },
        );
      }

      // Barra de progresso da página, logo abaixo do topo
      gsap.to('.scroll-progress', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    });

    return () => {
      stopReveal();
      ctx.revert();
    };
  }, []);

  return (
    <PlayerProvider>
    <SmoothScroll>
      <div className="min-h-screen bg-[#050507] text-white selection:bg-red-600 selection:text-white font-sans overflow-x-hidden relative">
        
        {/* Linha Animada no Fundo */}
        <ScrollLineBackground />

        {/* HEADER REATIVO */}
        <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-2xl bg-[#050507]/70 border-b border-white/5 px-5 sm:px-8 lg:px-16 py-4 lg:py-5 flex flex-wrap items-center justify-between gap-y-3 transition-all">
          <a href="#home" aria-label="Antena Rock, voltar ao início" className="flex items-center gap-2.5 group">
            <BrandMark size={40} simple className="group-hover:scale-105 transition-transform" />
            <BrandWordmark />
          </a>

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
          <div className="scroll-progress absolute left-0 right-0 -bottom-px h-[2px] bg-gradient-to-r from-red-600 via-rose-500 to-purple-600" aria-hidden />
        </header>

        {/* CENA 1: HERO */}
        <section id="home" className="relative min-h-[72vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-8 z-10">
          <div className="hero-glow absolute w-[600px] h-[600px] bg-red-600/15 rounded-full blur-[140px] pointer-events-none -top-32 -left-32 animate-pulse"></div>
          <div className="absolute w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none -bottom-32 -right-32"></div>

          <div ref={heroRef} className="max-w-4xl z-10 space-y-6">
            <BrandMark size={150} className="mx-auto w-28 h-28 sm:w-[150px] sm:h-[150px]" />

            <h1 className="flex flex-col items-center leading-none" aria-label="Antena Rock">
              <span className="font-brand font-extrabold text-[#F4EDE0] text-2xl sm:text-4xl tracking-[0.55em] pl-[0.55em]">ANTENA</span>
              <span className="font-neon text-[#E11D2E] text-[5.5rem] sm:text-[8rem] lg:text-[10rem] leading-[0.95]">ROCK</span>
            </h1>

            <p className="flex items-center justify-center gap-4 font-semibold text-xs sm:text-sm tracking-[0.35em] text-[#CFC8DA] uppercase">
              <span className="w-10 h-0.5 bg-[#E11D2E]" aria-hidden />
              {SITE.slogan}
              <span className="w-10 h-0.5 bg-[#7C3AED]" aria-hidden />
            </p>

            <p className="text-gray-400 text-base sm:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              Rock nacional e internacional, das décadas de 50 até hoje, tocando sem parar.
            </p>
          </div>
        </section>

        {/* PLAYER AO VIVO + O QUE TOCA AGORA */}
        <section id="player" className="py-4 px-6 lg:px-16 max-w-5xl mx-auto relative z-20 -mt-6">
          <div data-reveal="zoom">
            <LivePlayer />
          </div>
        </section>

        {/* WIDGET DE PEDIDOS DE MÚSICA */}
        <section id="pedidos" className="py-6 px-6 lg:px-16 max-w-4xl mx-auto relative z-10">
          <div data-reveal="tilt">
            <SongRequestWidget />
          </div>
        </section>

        {/* CARROSSEL MAGNÉTICO DE LENDAS DO ROCK */}
        <section className="py-2 bg-transparent relative">
          <RockMagneticCarousel />
        </section>

        {/* ÚLTIMAS TOCADAS + CURIOSIDADE DO DIA */}
        <section className="py-6 px-6 lg:px-16 max-w-6xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div data-reveal="left">
            <RecentTracks />
          </div>
          <div data-reveal="right">
            <CuriosityPost />
          </div>
        </section>

        {/* MANIFESTO */}
        <section id="historia" className="py-12 px-6 lg:px-16 max-w-5xl mx-auto text-center relative z-10">
          <div ref={manifestoRef} className="space-y-6">
            <h2 data-reveal="title" className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold">O Manifesto</h2>
            <h3 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              <Words text="De Sorocaba para o mundo, no volume que o rock merece." />
            </h3>
            <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
              <Words text="A Antena Rock é uma rádio feita em Sorocaba por quem gosta de rock alto. Aqui toca o riff que fez muita gente pegar numa guitarra e o refrão que um estádio inteiro canta junto." />
            </p>
            <p className="text-gray-300 text-base sm:text-lg font-light leading-relaxed max-w-3xl mx-auto">
              <Words text="Tem Raul e Legião, tem Iron Maiden e Elvis. A programação atravessa as décadas sem pedir licença, de dia e de madrugada. Esteja você aqui na cidade, do outro lado do país ou fora dele, aumenta o som. A gente toca para quem ouve." />
            </p>
          </div>
        </section>

        {/* GRADE DE PROGRAMAS */}
        <section id="programacao" className="py-10 px-6 lg:px-16 max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 gap-4">
            <div>
              <h2 data-reveal="title" className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold mb-2">Grade de Conteúdo</h2>
              <h3 data-reveal="up" className="text-3xl font-black tracking-tight">No ar e a seguir hoje</h3>
            </div>
          </div>

          <ProgramGrid />
        </section>

        {/* FALE CONOSCO */}
        <section id="fale-conosco" className="py-10 px-6 lg:px-16 max-w-6xl mx-auto relative z-10 scroll-mt-24">
          <div data-reveal="up">
            <ContactSection />
          </div>
        </section>

        {/* SMOOTH SCROLL SLIDER */}
        <section className="py-8 bg-transparent overflow-hidden relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-16 mb-6">
            <h2 data-reveal="title" className="text-xs uppercase tracking-[0.4em] text-red-500 font-bold mb-1">Galeria Dinâmica</h2>
            <h3 className="text-2xl font-black tracking-tight">Destaques Visuais & Comunidade</h3>
          </div>
          <div data-reveal="zoom" className="w-full h-[380px]">
            <SmoothScrollSlider />
          </div>
        </section>

        {/* RODAPÉ */}
        <footer className="border-t border-white/10 pt-12 pb-28 px-8 lg:px-16 text-center text-xs text-gray-500 space-y-6 relative z-10 bg-[#050507]/90 backdrop-blur-md">
          <div className="flex flex-col items-center gap-3">
            <BrandMark size={64} />
            <BrandWordmark />
            <p className="font-semibold text-[10px] tracking-[0.35em] text-[#CFC8DA] uppercase">{SITE.slogan}</p>
          </div>

          <div className="flex justify-center">
            <InteractiveGrid />
          </div>

          <p>© {new Date().getFullYear()} Antena Rock · Sorocaba, SP · <a href="#fale-conosco" className="hover:text-white">Fale conosco</a></p>
          <p className="text-[11px] text-gray-600 max-w-xl mx-auto">
            Contamos visitas, cliques e tempo ouvindo para melhorar a rádio. Não usamos cookies de anúncio, não guardamos seu IP e
            a cidade é estimada pela conexão. Se o seu navegador pede para não rastrear, nada é registrado.
          </p>
        </footer>

      </div>
    </SmoothScroll>
    <StickyPlayer />
    </PlayerProvider>
  );
}