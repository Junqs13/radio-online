'use client';

import { useState, useEffect, useRef } from "react"
import { Music, Sparkles, X } from "lucide-react"

interface RockStarItem {
    id?: string;
    title: string;       
    artist: string;      
    src: string;         
    description?: string;
}

// ARQUIVOS LOCAIS: Aponte para a pasta /public/images/ do seu projeto
const DEFAULT_ROCK_STARS: RockStarItem[] = [
    {
        title: "Bohemian Rhapsody",
        artist: "Freddie Mercury",
        src: "/images/rock1.jpg", 
        description: "A obra-prima operística que redefiniu os limites do rock nos anos 70, liderada pela voz incomparável de Freddie Mercury."
    },
    {
        title: "Stairway to Heaven",
        artist: "Led Zeppelin",
        src: "/images/rock2.jpg",
        description: "O hino definitivo do rock clássico que consagrou Jimmy Page e Robert Plant na história eterna da música."
    },
    {
        title: "Smells Like Teen Spirit",
        artist: "Nirvana",
        src: "/images/rock3.jpg",
        description: "O grito de geração grunge de Kurt Cobain que implodiu a indústria musical no início dos anos 90."
    },
    {
        title: "Back in Black",
        artist: "AC/DC",
        src: "/images/rock4.jpg",
        description: "Um tributo estrondoso a Bon Scott que se tornou um dos álbuns mais vendidos de todos os tempos."
    },
    {
        title: "Purple Haze",
        artist: "Jimi Hendrix",
        src: "/images/rock5.jpg",
        description: "A revolução psicodélica da guitarra elétrica que transformou Jimi Hendrix em uma lenda mística."
    }
];

export default function RockMagneticCarousel(props: any) {
    const [items, setItems] = useState<RockStarItem[]>(DEFAULT_ROCK_STARS);

    const collapsedWidth = props.collapsedWidth || 110;
    const hoverWidth = props.hoverWidth || 220;
    const collapsedHeight = props.collapsedHeight || 380;
    const hoverHeight = props.hoverHeight || 440;
    const openSize = props.openSize || 600;
    const gap = props.gap || 16;
    const influence = props.influence || 220;
    const blur = props.blur || 2;

    const count = items.length;
    const containerRef = useRef<HTMLDivElement>(null);
    const [factors, setFactors] = useState<number[]>(() => items.map(() => 0));
    const [open, setOpen] = useState<number | null>(null);
    const [closing, setClosing] = useState(false);

    const targetRef = useRef<number[]>(items.map(() => 0));
    const curRef = useRef<number[]>(items.map(() => 0));
    const loopRef = useRef(0);
    const closeTimer = useRef<any>(0);

    useEffect(() => {
        targetRef.current = items.map(() => 0);
        curRef.current = items.map(() => 0);
        setFactors(items.map(() => 0));
    }, [count]);

    useEffect(() => () => {
        cancelAnimationFrame(loopRef.current);
        clearTimeout(closeTimer.current);
    }, []);

    const startLoop = () => {
        if (loopRef.current) return;
        const step = () => {
            const tgt = targetRef.current;
            const cur = curRef.current;
            let moving = false;
            for (let i = 0; i < cur.length; i++) {
                const d = (tgt[i] ?? 0) - cur[i];
                if (Math.abs(d) > 0.001) {
                    cur[i] += d * 0.2;
                    moving = true;
                } else {
                    cur[i] = tgt[i] ?? 0;
                }
            }
            setFactors([...cur]);
            loopRef.current = moving ? requestAnimationFrame(step) : 0;
        };
        loopRef.current = requestAnimationFrame(step);
    };

    const setTargetFromCursor = (clientX: number) => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = clientX - rect.left;
        const n = items.length;

        const totalBase = n * collapsedWidth + (n - 1) * gap;
        const startX = (rect.width - totalBase) / 2;
        targetRef.current = items.map((_, i) => {
            const center = startX + i * (collapsedWidth + gap) + collapsedWidth / 2;
            const dist = Math.abs(cx - center);
            const f = Math.max(0, 1 - dist / influence);
            return f * f * (3 - 2 * f);
        });
        startLoop();
    };

    const onMove = (e: React.MouseEvent) => {
        if (open !== null) return;
        setTargetFromCursor(e.clientX);
    };

    const onLeave = () => {
        if (open !== null) return;
        targetRef.current = items.map(() => 0);
        startLoop();
    };

    const close = () => {
        targetRef.current = items.map(() => 0);
        curRef.current = items.map(() => 0);
        setFactors(items.map(() => 0));
        setClosing(true);
        clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setClosing(false), 300);
        setOpen(null);
    };

    const sizeFor = (i: number) => {
        if (open !== null) {
            return i === open
                ? { width: openSize, height: openSize }
                : { width: collapsedWidth, height: collapsedHeight };
        }
        const f = factors[i] ?? 0;
        return {
            width: collapsedWidth + (hoverWidth - collapsedWidth) * f,
            height: collapsedHeight + (hoverHeight - collapsedHeight) * f,
        };
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-12 flex flex-col">
            <div className="mb-8 space-y-2">
                <span className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Arquivos Secretos do Rock
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">Lendas & Histórias</h2>
                <p className="text-gray-400 text-xs sm:text-sm">Passe o mouse para explorar e clique em uma lenda para revelar sua história.</p>
            </div>

            <div
                ref={containerRef}
                style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap,
                    position: "relative",
                    overflow: "visible",
                    minHeight: "440px"
                }}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
            >
                {/* Backdrop escuro ao abrir */}
                {open !== null && (
                    <div
                        className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 transition-opacity"
                        onClick={close}
                    />
                )}

                {items.map((item, i) => {
                    const { width, height } = sizeFor(i);
                    const isOpen = open === i;
                    const blurred = open !== null && !isOpen;

                    return (
                        <div
                            key={item.id || i}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isOpen) close();
                                else setOpen(i);
                            }}
                            style={{
                                flex: "none",
                                width,
                                height,
                                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                willChange: "width, height",
                                position: isOpen ? "fixed" : "relative",
                                zIndex: isOpen ? 50 : 2,
                                filter: blurred ? `blur(${blur}px)` : "none",
                                opacity: blurred ? 0.4 : 1,
                            }}
                            className={`rounded-3xl overflow-hidden cursor-pointer shadow-2xl border border-white/10 relative group ${
                                isOpen ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''
                            }`}
                        >
                            {/* Imagem Local ou de Fundo */}
                            <div 
                                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105 bg-[#111]"
                                style={{ backgroundImage: `url(${item.src})` }}
                            />

                            {/* Gradiente Escuro para Legibilidade */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            {/* Conteúdo do Card (Colapsado / Hover) */}
                            {!isOpen && (
                                <div className="absolute bottom-6 left-6 right-6 z-10">
                                    <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold block mb-1">Ícone</span>
                                    <h4 className="text-white font-black text-sm truncate">{item.artist}</h4>
                                </div>
                            )}

                            {/* Conteúdo Expandido (Modo Storytelling Cinematográfico) */}
                            {isOpen && (
                                <div className="absolute inset-0 p-8 lg:p-12 flex flex-col justify-between z-10 text-white animate-fade-in">
                                    <div className="flex justify-between items-start">
                                        <div className="inline-flex items-center gap-2 bg-red-600/30 border border-red-500/40 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase text-red-400 backdrop-blur-md">
                                            <Music className="w-3.5 h-3.5" /> História em Destaque
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); close(); }}
                                            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-red-600 transition-colors"
                                        >
                                            <X className="w-5 h-5 text-white" />
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-w-lg">
                                        <span className="text-xs uppercase tracking-[0.2em] text-red-400 font-bold block">{item.artist}</span>
                                        <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{item.title}</h3>
                                        <p className="text-gray-300 text-sm sm:text-base leading-relaxed font-light">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}