"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

const DEFAULTS = {
  padding: "20px",
  columns: 5,
  rows: 1,
  gap: 8,
  rounded: 12,
  logoScale: 2.5,
  cardFill: "#0a0a0f",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  shadow: false,
  cardShadow: "rgba(239, 68, 68, 0.3)",
  glow: true,
  glowStart: "rgba(239, 68, 68, 0.4)",
  glowEnd: "#ef4444",
  glowIntensity: 40,
  perspective: 1200,
  rotateX: 0,
  rotateY: 0,
};

// Ícones de Redes Sociais e Plataformas de Streaming em SVG otimizados
const SOCIAL_ICONS = [
  { name: "YouTube", src: "https://api.iconify.design/lucide:youtube.svg?color=%23ef4444", url: "https://youtube.com" },
  { name: "Instagram", src: "https://api.iconify.design/lucide:instagram.svg?color=%23ec4899", url: "https://instagram.com" },
  { name: "Spotify", src: "https://api.iconify.design/lucide:headphones.svg?color=%2322c55e", url: "https://spotify.com" },
  { name: "GitHub", src: "https://api.iconify.design/lucide:github.svg?color=%23ffffff", url: "https://github.com" },
  { name: "Twitter/X", src: "https://api.iconify.design/lucide:twitter.svg?color=%2338bdf8", url: "https://twitter.com" },
];

const MAX_GLOW_BLUR = 16;
const DURATION = 200;
const LEAVE_DELAY = 200;
const NS = "framer-animate-grid";

const CSS = `
.${NS}-card {
  transition: all ${DURATION}ms cubic-bezier(0.16, 1, 0.3, 1);
}
.${NS}-shadow {
  box-shadow: 2px 2px 5px var(--ag-shadow), 3px 3px 10px var(--ag-shadow);
}
.${NS}-card img {
  opacity: 0.6;
  transition: all ${DURATION}ms;
}
.${NS}-card:hover img { opacity: 1; filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.6)); }

.${NS}-small {
  transform: scale(1.08) translateY(-4px) translateZ(0);
  border-color: rgba(239, 68, 68, 0.3) !important;
}
.${NS}-big {
  transform: scale(1.18) translateY(-10px) translateZ(15px);
  border-color: rgba(239, 68, 68, 0.7) !important;
  background: #14141c !important;
}

.${NS}-glow-big {
  animation: ${NS}-glow 1.5s ease-in-out infinite alternate;
}
.${NS}-glow-small {
  animation: ${NS}-glow-small 1.5s ease-in-out infinite alternate;
}
@keyframes ${NS}-glow {
  0%  { filter: drop-shadow(0 0 2px var(--ag-glow-start)); }
  to  { filter: drop-shadow(0 2px var(--ag-glow-blur) var(--ag-glow-end)); }
}
@keyframes ${NS}-glow-small {
  0%  { filter: drop-shadow(0 0 1px var(--ag-glow-start)); }
  to  { filter: drop-shadow(0 1px var(--ag-glow-blur-small) var(--ag-glow-start)); }
}
`;

interface InteractiveGridProps {
  items?: typeof SOCIAL_ICONS;
  padding?: string;
  columns?: number;
  rows?: number;
  gap?: number;
  rounded?: number;
  logoScale?: number;
  cardFill?: string;
  cardBorder?: string;
  shadow?: boolean;
  cardShadow?: string;
  glow?: boolean;
  glowStart?: string;
  glowEnd?: string;
  glowIntensity?: number;
  perspective?: number;
  rotateX?: number;
  rotateY?: number;
  style?: CSSProperties;
}

export default function InteractiveGrid(props: Partial<InteractiveGridProps>) {
  const {
    items = SOCIAL_ICONS,
    padding = DEFAULTS.padding,
    columns = DEFAULTS.columns,
    rows = DEFAULTS.rows,
    gap = DEFAULTS.gap,
    rounded = DEFAULTS.rounded,
    logoScale = DEFAULTS.logoScale,
    cardFill = DEFAULTS.cardFill,
    cardBorder = DEFAULTS.cardBorder,
    shadow = DEFAULTS.shadow,
    cardShadow = DEFAULTS.cardShadow,
    glow = DEFAULTS.glow,
    glowStart = DEFAULTS.glowStart,
    glowEnd = DEFAULTS.glowEnd,
    glowIntensity = DEFAULTS.glowIntensity,
    perspective = DEFAULTS.perspective,
    rotateX = DEFAULTS.rotateX,
    rotateY = DEFAULTS.rotateY,
    style,
  } = props;

  const count = items.length;
  const cols = Math.min(count, Math.max(1, Math.round(columns)));
  const rowCount = Math.max(1, Math.round(rows));

  const [hovered, setHovered] = useState<number | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  const neighbours = useMemo(() => {
    if (hovered === null) return [];
    const out: number[] = [];
    if (hovered % cols !== 0) out.push(hovered - 1);
    if (hovered % cols !== cols - 1) out.push(hovered + 1);
    out.push(hovered - cols);
    out.push(hovered + cols);
    return out.filter((n) => n >= 0 && n < count);
  }, [hovered, cols, count]);

  const onEnter = (i: number) => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHovered(i);
  };
  const onLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(null), LEAVE_DELAY);
  };

  const glowBlur = (Math.min(100, Math.max(0, glowIntensity)) / 100) * MAX_GLOW_BLUR;
  const logoPct = Math.min(10, Math.max(1, Math.round(logoScale))) * 15;

  return (
    <div
      style={
        {
          ...style,
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding,
          boxSizing: "border-box",
          "--ag-shadow": cardShadow,
          "--ag-glow-start": glowStart,
          "--ag-glow-end": glowEnd,
          "--ag-glow-blur": `${glowBlur.toFixed(1)}px`,
          "--ag-glow-blur-small": `${(glowBlur / 2).toFixed(1)}px`,
        } as CSSProperties
      }
    >
      <style>{CSS}</style>
      <div
        onPointerLeave={onLeave}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, minmax(60px, 90px))`,
          gridTemplateRows: `repeat(${rowCount}, minmax(60px, 90px))`,
          gap,
          transform: `perspective(${perspective}px) rotateX(${rotateY}deg) rotateY(${rotateX}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        {items.map((item, i) => {
          const isBig = hovered === i;
          const isSmall = !isBig && neighbours.includes(i);
          return (
            <a
              key={i}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onPointerEnter={() => onEnter(i)}
              className={[
                `${NS}-card`,
                shadow && `${NS}-shadow`,
                isBig && `${NS}-big`,
                isSmall && `${NS}-small`,
                glow && isBig && `${NS}-glow-big`,
                glow && isSmall && `${NS}-glow-small`,
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px",
                background: cardFill,
                border: `1px solid ${cardBorder}`,
                borderRadius: rounded,
                boxSizing: "border-box",
                cursor: "pointer",
                overflow: "visible",
                zIndex: isBig ? count + 1 : i + 1,
                textDecoration: "none",
              }}
              title={item.name}
            >
              <img
                src={item.src}
                alt={item.name}
                draggable={false}
                style={{
                  width: `${logoPct}%`,
                  height: `${logoPct}%`,
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}