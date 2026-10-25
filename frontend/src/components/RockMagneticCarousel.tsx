'use client';

import { useState, useEffect, useRef } from "react"
import { Sparkles, BookOpen } from "lucide-react"
import LegendBook from "./LegendBook"
import { API_URL } from "@/lib/config"
import { gradientClasses, imageSrc } from "@/lib/gradients"
import { track } from "@/lib/analytics"

interface RockStarItem {
    id?: string | number;
    title: string;
    artist: string;
    src?: string | null;
    description?: string;
    gradient?: string;
    year?: string | null;
    origin?: string | null;
}

// Reserva caso a API não responda: os cards originais com foto
const DEFAULT_ROCK_STARS: RockStarItem[] = [
    { title: "Bohemian Rhapsody", artist: "Freddie Mercury", src: "/images/rock1.jpg", description: "A obra-prima operística que redefiniu os limites do rock nos anos 70, liderada pela voz incomparável de Freddie Mercury." },
    { title: "Stairway to Heaven", artist: "Led Zeppelin", src: "/images/rock2.jpg", description: "O hino definitivo do rock clássico que consagrou Jimmy Page e Robert Plant na história eterna da música." },
    { title: "Smells Like Teen Spirit", artist: "Nirvana", src: "/images/rock3.jpg", description: "O grito de geração grunge de Kurt Cobain que implodiu a indústria musical no início dos anos 90." },
    { title: "Back in Black", artist: "AC/DC", src: "/images/rock4.jpg", description: "Um tributo estrondoso a Bon Scott que se tornou um dos álbuns mais vendidos de todos os tempos." },
    { title: "Purple Haze", artist: "Jimi Hendrix", src: "/images/rock5.jpg", description: "A revolução psicodélica da guitarra elétrica que transformou Jimi Hendrix em uma lenda mística." },
];

interface ApiLegend {
    id: number;
    artist: string;
    title: string;
    description: string;
    imageUrl: string | null;
    gradient: string;
    year: string | null;
    origin: string | null;
}

export default function RockMagneticCarousel(props: any) {
    // null = carregando. A API devolve o mais recente primeiro, o segundo mais recente
    // por último e o meio sorteado de novo a cada acesso.
    const [items, setItems] = useState<RockStarItem[] | null>(null);

    useEffect(() => {
        fetch(`${API_URL}/content/legends?limit=6`, { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((d) => {
                const list: ApiLegend[] = d.legends ?? [];
                setItems(list.length ? list.map((l) => ({
                    id: l.id, artist: l.artist, title: l.title, description: l.description,
                    src: imageSrc(l.imageUrl), gradient: l.gradient, year: l.year, origin: l.origin,
                })) : DEFAULT_ROCK_STARS);
            })
            .catch(() => setItems(DEFAULT_ROCK_STARS));
    }, []);

    const collapsedWidth = props.collapsedWidth || 110;
    const hoverWidth = props.hoverWidth || 220;
    const collapsedHeight = props.collapsedHeight || 380;
    const hoverHeight = props.hoverHeight || 440;
    const gap = props.gap || 16;
    const influence = props.influence || 220;

    const list = items ?? [];
    const count = list.length;
    const containerRef = useRef<HTMLDivElement>(null);
    const [factors, setFactors] = useState<number[]>(() => list.map(() => 0));
    const [open, setOpen] = useState<number | null>(null);

    const targetRef = useRef<number[]>(list.map(() => 0));
    const curRef = useRef<number[]>(list.map(() => 0));
    const loopRef = useRef(0);

    useEffect(() => {
        targetRef.current = list.map(() => 0);
        curRef.current = list.map(() => 0);
        setFactors(list.map(() => 0));
    }, [count]);

    useEffect(() => () => {
        cancelAnimationFrame(loopRef.current);
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
        const n = list.length;

        const totalBase = n * collapsedWidth + (n - 1) * gap;
        const startX = (rect.width - totalBase) / 2;
        targetRef.current = list.map((_, i) => {
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
        targetRef.current = list.map(() => 0);
        startLoop();
    };

    const close = () => {
        targetRef.current = list.map(() => 0);
        startLoop();
        setOpen(null);
    };

    const sizeFor = (i: number) => {
        const f = factors[i] ?? 0;
        return {
            width: collapsedWidth + (hoverWidth - collapsedWidth) * f,
            height: collapsedHeight + (hoverHeight - collapsedHeight) * f,
        };
    };

    return (
        <div data-section="lendas" className="w-full max-w-7xl mx-auto px-6 lg:px-16 py-6 flex flex-col relative z-10">
            <div className="mb-6 space-y-2">
                <span data-reveal="title" className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Arquivos Secretos do Rock
                </span>
                <h2 data-reveal="up" className="text-3xl sm:text-4xl font-black tracking-tight text-white">Lendas & Histórias</h2>
                <p className="text-gray-400 text-xs sm:text-sm">Toque numa lenda e a história abre como um livro. A cada visita aparecem lendas diferentes.</p>
            </div>

            <div data-reveal="zoom" className="-mx-6 px-6 overflow-x-auto lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                    minHeight: "440px",
                    minWidth: (count || 6) * collapsedWidth + ((count || 6) - 1) * gap,
                }}
                onMouseMove={onMove}
                onMouseLeave={onLeave}
            >
                {/* Enquanto carrega: cards vazios no lugar, para a página não pular */}
                {items === null && Array.from({ length: 6 }, (_, i) => (
                    <div key={`ph-${i}`} className="rounded-3xl border border-white/5 bg-white/[0.03] animate-pulse flex-none" style={{ width: collapsedWidth, height: collapsedHeight }} />
                ))}

                {list.map((item, i) => {
                    const { width, height } = sizeFor(i);

                    return (
                        <div
                            key={item.id || i}
                            role="button"
                            tabIndex={0}
                            aria-label={`Abrir a história: ${item.artist}`}
                            onClick={() => {
                                setOpen(i);
                                track("open", item.artist, { section: "lendas" });
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setOpen(i);
                                    track("open", item.artist, { section: "lendas" });
                                }
                            }}
                            style={{
                                flex: "none",
                                width,
                                height,
                                transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                                willChange: "width, height",
                                position: "relative",
                            }}
                            className="rounded-3xl overflow-hidden cursor-pointer shadow-2xl border border-white/10 relative group focus-visible:outline-2 focus-visible:outline-red-500"
                        >
                            {/* Foto, ou degradê com o nome da banda quando não há foto */}
                            {!item.src ? (
                                <div className={`absolute inset-0 bg-gradient-to-br ${gradientClasses(item.gradient)} transition-transform duration-700 group-hover:scale-105 overflow-hidden`}>
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 flex items-center justify-center font-black uppercase text-white/15 leading-none select-none whitespace-nowrap"
                                        style={{ fontSize: "3.2rem", writingMode: "vertical-rl" }}
                                    >
                                        {item.artist}
                                    </span>
                                </div>
                            ) : (
                                <div
                                    className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105 bg-[#111]"
                                    style={{ backgroundImage: `url(${item.src})` }}
                                />
                            )}

                            {/* Gradiente Escuro para Legibilidade */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                            {/* Nome da banda e o convite para abrir */}
                            <div className="absolute bottom-6 left-6 right-6 z-10">
                                <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold block mb-1">{i === 0 ? "Novidade" : "Ícone"}</span>
                                <h4 className="text-white font-black text-sm truncate">{item.artist}</h4>
                                <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/70 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
                                    <BookOpen className="w-3 h-3" /> Ler
                                </span>
                            </div>

                        </div>
                    );
                })}
            </div>
            </div>
            {open !== null && list[open] && <LegendBook item={list[open]} onClose={close} />}
        </div>
    );
}