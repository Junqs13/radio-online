"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties } from "react"

// Adicionamos 'alt?: string' para aceitar a propriedade dos objetos de imagem
type ImageValue = string | { src?: string; alt?: string } | null | undefined

type ImageInput = ImageValue | { image?: ImageValue; offsetY?: number }

interface Slide {
    src: string | null
    offsetY: number
    alt?: string
}

export interface SmoothScrollSliderProps {
    images?: ImageInput[]
    slideWidth?: number
    slideHeight?: number
    spacing?: number
    direction?: "right" | "left"
    smoothness?: number
    radius?: number
    dim?: number
    background?: string
    sensitivity?: number
    loop?: boolean
    style?: CSSProperties
}

const PLACEHOLDER_COUNT = 8
const MAX_SCALE = 2.5
const MIN_SCALE = 0.1

function wrap(value: number, span: number): number {
    return ((value % span) + span) % span
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

function resolveSrc(value: ImageValue): string | null {
    if (!value) return null
    if (typeof value === "string") return value || null
    const src = value.src
    return typeof src === "string" && src ? src : null
}

function imageOf(item: ImageInput): string | null {
    if (item && typeof item === "object" && "image" in item)
        return resolveSrc(item.image)
    return resolveSrc(item as ImageValue)
}

function offsetOf(item: ImageInput): number {
    if (item && typeof item === "object" && "offsetY" in item) {
        const offset = item.offsetY
        return typeof offset === "number" && isFinite(offset) ? offset : 0
    }
    return 0
}

function placeholderFill(index: number): string {
    const hue = (index * 47 + 210) % 360
    return `linear-gradient(150deg, hsl(${hue} 42% 34%), hsl(${
        (hue + 45) % 360
    } 55% 10%))`
}

interface Frame {
    count: number
    step: number
    slideWidth: number
    width: number
    ease: number
    maxScale: number
    minScale: number
    dim: number
    loop: boolean
    flip: boolean
}

export default function SmoothScrollSlider({
    images = [
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1557747357-b3302a733ae4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTMxfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1637961239801-d0dfcc1a9340?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjEyfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1579205149708-f5b24c5a04e5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fFVzZXIlMjBwcm9maWxlJTIwaW1hZ2UlMjB2aWJyYW50fGVufDB8MHwwfHx8Mg%3D%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1748572495955-4f301f8e93ba?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzB8fFVzZXIlMjBwcm9maWxlJTIwaW1hZ2UlMjB2aWJyYW50fGVufDB8MHwwfHx8Mg%3D%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1664705792423-89f2016228eb?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fFVzZXIlMjBwcm9maWxlJTIwaW1hZ2UlMjB2aWJyYW50fGVufDB8MHwwfHx8Mg%3D%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1758600433991-933fb663161f?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjZ8fFVzZXIlMjBwcm9maWxlJTIwaW1hZ2UlMjB2aWJyYW50fGVufDB8MHwwfHx8Mg%3D%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1643325297990-cbdde391d7c8?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njd8fFVzZXIlMjBwcm9maWxlJTIwaW1hZ2UlMjB2aWJyYW50fGVufDB8MHwwfHx8Mg%3D%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1601233750964-940fc7080ba5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAwfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1748154228682-4be26335c713?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTk1fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"},"offsetY":0},
        {"image":{"alt":"","src":"https://images.unsplash.com/photo-1631700010907-eeca2d4f2a39?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjA5fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"},"offsetY":0},
    ],
    slideWidth = 400,
    slideHeight = 400,
    spacing = 2,
    direction = "right",
    smoothness = 10,
    radius = 16,
    dim = 10,
    background = "#050507",
    sensitivity = 5,
    loop = true,
    style,
}: SmoothScrollSliderProps) {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const nodes = useRef<(HTMLDivElement | null)[]>([])
    const target = useRef(0)
    const current = useRef(0)
    const [width, setWidth] = useState(0)

    const source = useMemo<Slide[]>(() => {
        const resolved: Slide[] = []
        for (const item of images ?? []) {
            const src = imageOf(item)
            if (src) resolved.push({ src, offsetY: offsetOf(item) })
        }
        return resolved.length
            ? resolved
            : Array.from({ length: PLACEHOLDER_COUNT }, () => ({
                  src: null,
                  offsetY: 0,
              }))
    }, [images])

    const step = slideWidth + clamp(spacing, 0, 10) * 20
    const ease = 0.15 - (clamp(smoothness, 0, 10) / 10) * 0.13
    const dimAmount = (clamp(dim, 0, 10) / 10) * 0.85
    const wheelMultiplier = 0.4 + (clamp(sensitivity, 0, 10) / 10) * 1.2

    const flip = direction === "left"

    const repeats = useMemo(() => {
        if (!loop || width <= 0 || step <= 0) return 1
        return Math.max(1, Math.ceil((width + step * 2) / (source.length * step)))
    }, [loop, width, step, source.length])

    const slides = useMemo(() => {
        const out: Slide[] = []
        for (let r = 0; r < repeats; r += 1) out.push(...source)
        return out
    }, [source, repeats])

    const frame = useRef<Frame>({
        count: 0,
        step: 0,
        slideWidth: 0,
        width: 0,
        ease: 0.075,
        maxScale: MAX_SCALE,
        minScale: MIN_SCALE,
        dim: 0,
        loop: true,
        flip: false,
    })
    frame.current = {
        count: slides.length,
        step,
        slideWidth,
        width,
        ease,
        maxScale: MAX_SCALE,
        minScale: MIN_SCALE,
        dim: dimAmount,
        loop,
        flip,
    }

    const input = useRef({ wheelMultiplier, flip })
    input.current = { wheelMultiplier, flip }

    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        const observer = new ResizeObserver((entries) => {
            setWidth(entries[0].contentRect.width)
        })
        observer.observe(node)
        setWidth(node.getBoundingClientRect().width)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        nodes.current.length = slides.length
    }, [slides.length])

    // Movimento da galeria: posição (x) e velocidade (v) andam numa mola.
    // Arrastando, a galeria cola no dedo (1:1). Ao soltar, ela segue na velocidade
    // do gesto, calcula onde o arremesso pararia e assenta na foto mais próxima dali.
    const motion = useRef({ v: 0, dragging: false, zeta: 1, wake: () => {} })

    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
        let raf = 0
        let last = 0
        let visible = false
        const m = motion.current

        const render = () => {
            const c = frame.current
            const pad = (c.width - c.slideWidth) / 2
            const half = c.width / 2
            const span = c.count * c.step
            for (let i = 0; i < c.count; i += 1) {
                const el = nodes.current[i]
                if (!el) continue
                const raw = i * c.step - current.current + pad
                const x = c.loop ? wrap(raw + c.step, span) - c.step : raw
                const distance = x + c.slideWidth / 2 - half
                let scale: number
                let push: number
                if (distance > 0) {
                    scale = Math.min(c.maxScale, 1 + distance / c.width)
                    push = (scale - 1) * c.slideWidth * 0.75
                } else {
                    scale = Math.max(c.minScale, 1 + distance / c.width)
                    push = 0
                }
                const left = c.flip ? c.width - c.slideWidth - (x + push) : x + push
                el.style.transform = `translate3d(${left}px, -50%, 0) scale(${scale})`
                // Escurece as laterais com uma camada de opacidade (mais leve que filtro)
                const shade = el.firstElementChild as HTMLElement | null
                if (shade) {
                    const t = c.dim > 0 && scale < 1 ? (1 - scale) / Math.max(0.001, 1 - c.minScale) : 0
                    shade.style.opacity = String(t * c.dim)
                }
            }
        }

        const tick = (now: number) => {
            raf = 0
            const c = frame.current
            const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60
            last = now
            if (!c.count || c.step <= 0 || c.width <= 0) return

            const span = c.count * c.step
            if (c.loop) {
                if (current.current > span || current.current < -span) {
                    const shift = Math.trunc(current.current / span) * span
                    current.current -= shift
                    target.current -= shift
                }
            } else {
                target.current = clamp(target.current, 0, (c.count - 1) * c.step)
            }

            if (m.dragging || calm) {
                current.current = target.current
            } else {
                // Mola com "response" de 0,4 s (padrão da Apple para mover coisas)
                const response = 0.4
                const k = Math.pow((2 * Math.PI) / response, 2)
                const damp = (4 * Math.PI * m.zeta) / response
                let left = dt
                while (left > 0) {
                    const h = Math.min(left, 1 / 240)
                    const a = k * (target.current - current.current) - damp * m.v
                    m.v += a * h
                    current.current += m.v * h
                    left -= h
                }
            }
            render()

            const settled = !m.dragging && Math.abs(target.current - current.current) < 0.05 && Math.abs(m.v) < 1
            if (settled) {
                current.current = target.current
                m.v = 0
                render()
                last = 0
                return
            }
            if (visible) raf = requestAnimationFrame(tick)
        }

        m.wake = () => {
            if (!raf && visible) raf = requestAnimationFrame(tick)
        }

        // Só anima enquanto a galeria está na tela
        const io = new IntersectionObserver(([e]) => {
            visible = e.isIntersecting
            if (visible) {
                last = 0
                m.wake()
            } else if (raf) {
                cancelAnimationFrame(raf)
                raf = 0
            }
        })
        io.observe(node)
        return () => {
            io.disconnect()
            cancelAnimationFrame(raf)
        }
    }, [])

    // Encaixa na foto mais próxima de um ponto
    const snapTo = (value: number) => {
        const c = frame.current
        if (c.step <= 0) return value
        const snapped = Math.round(value / c.step) * c.step
        return c.loop ? snapped : clamp(snapped, 0, (c.count - 1) * c.step)
    }

    // Roda do mouse: só o movimento lateral (trackpad) mexe na galeria.
    // A rolagem vertical passa direto para a página, que não fica mais presa aqui.
    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        let settle: ReturnType<typeof setTimeout> | null = null
        const onWheel = (event: WheelEvent) => {
            if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
            event.preventDefault()
            target.current += event.deltaX * input.current.wheelMultiplier
            motion.current.zeta = 1
            motion.current.wake()
            if (settle) clearTimeout(settle)
            settle = setTimeout(() => {
                target.current = snapTo(target.current)
                motion.current.wake()
            }, 140)
        }
        node.addEventListener("wheel", onWheel, { passive: false })
        return () => {
            node.removeEventListener("wheel", onWheel)
            if (settle) clearTimeout(settle)
        }
    }, [])

    // Arrastar: cola no dedo desde o ponto agarrado e, ao soltar, entrega a velocidade à mola
    useEffect(() => {
        const node = containerRef.current
        if (!node) return
        let pointer: number | null = null
        let lastX = 0
        let history: { x: number; t: number }[] = []

        const onDown = (event: PointerEvent) => {
            if (pointer !== null) return
            pointer = event.pointerId
            lastX = event.clientX
            history = [{ x: current.current, t: event.timeStamp }]
            node.setPointerCapture(event.pointerId)
            // Agarrou no meio do movimento: para onde está, sem pulo
            target.current = current.current
            motion.current.dragging = true
            motion.current.v = 0
            node.style.cursor = "grabbing"
        }
        const onMove = (event: PointerEvent) => {
            if (pointer !== event.pointerId) return
            const dx = event.clientX - lastX
            lastX = event.clientX
            target.current += input.current.flip ? dx : -dx
            history.push({ x: target.current, t: event.timeStamp })
            if (history.length > 8) history.shift()
            motion.current.wake()
        }
        const onUp = (event: PointerEvent) => {
            if (pointer !== event.pointerId) return
            pointer = null
            if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId)
            node.style.cursor = "grab"
            // Velocidade dos últimos ~100 ms do gesto, em px/s
            const end = history[history.length - 1]
            const start = history.find((h) => end.t - h.t <= 100) ?? history[0]
            const ms = Math.max(1, end.t - start.t)
            const still = event.timeStamp - end.t > 80 // dedo parado antes de soltar
            const v = event.type === "pointercancel" || still ? 0 : ((end.x - start.x) / ms) * 1000
            // Onde o arremesso pararia (desaceleração de rolagem da Apple) e a foto mais perto dali
            const d = 0.998
            const projected = current.current + ((v / 1000) * d) / (1 - d)
            target.current = snapTo(projected)
            const m = motion.current
            m.dragging = false
            m.v = v
            m.zeta = Math.abs(v) > 400 ? 0.85 : 1 // um leve quique só quando houve arremesso
            m.wake()
        }

        node.addEventListener("pointerdown", onDown)
        node.addEventListener("pointermove", onMove)
        node.addEventListener("pointerup", onUp)
        node.addEventListener("pointercancel", onUp)
        return () => {
            node.removeEventListener("pointerdown", onDown)
            node.removeEventListener("pointermove", onMove)
            node.removeEventListener("pointerup", onUp)
            node.removeEventListener("pointercancel", onUp)
        }
    }, [])

    // Mudou o tamanho da tela: redesenha no lugar
    useEffect(() => {
        motion.current.wake()
    }, [width, slides.length])

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background,
                cursor: "grab",
                touchAction: "pan-y",
                opacity: width > 0 ? 1 : 0,
                transition: "opacity 0.35s ease",
                ...style,
            }}
        >
            {slides.map((slide, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        nodes.current[i] = el
                    }}
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: 0,
                        width: slideWidth,
                        height: slideHeight,
                        borderRadius: radius,
                        overflow: "hidden",
                        background: slide.src ? "#111" : placeholderFill(i),
                        willChange: "transform",
                        transform: "translate3d(0, -50%, 0)",
                        pointerEvents: "none",
                    }}
                >
                    <div aria-hidden style={{ position: "absolute", inset: 0, background: "#000", opacity: 0, zIndex: 1, pointerEvents: "none" }} />
                    {slide.src ? (
                        <img
                            src={slide.src}
                            alt={slide.alt || ""}
                            draggable={false}
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                objectPosition: `50% calc(50% + ${slide.offsetY}px)`,
                                display: "block",
                                userSelect: "none",
                            }}
                        />
                    ) : null}
                </div>
            ))}
        </div>
    )
}