"use client";

import { memo, useEffect, useMemo, useRef } from "react";
import { useViewportWidth } from "@/lib/hooks";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { mulberry32 } from "@/lib/rng";

gsap.registerPlugin(useGSAP);

const COLORS = ["#ff4d5e", "#46e08d", "#ffcc4d", "#5ab0ff", "#ff8ad8"];

/** Icicles hanging off the top of the screen + a string of twinkling lights. */
function GarlandImpl({ level, dripping }: { level: number; dripping: boolean }) {
  const w = useViewportWidth();
  const root = useRef<HTMLDivElement>(null);
  const drips = useRef<HTMLDivElement>(null);

  const icicles = useMemo(() => {
    if (!w) return [];
    const rnd = mulberry32(7);
    const out: { x: number; len: number; width: number; melt: number }[] = [];
    for (let x = 6; x < w; x += 14 + rnd() * 22) {
      const long = rnd() < 0.18;
      out.push({ x, len: long ? 55 + rnd() * 45 : 14 + rnd() * 34, width: 6 + rnd() * 9, melt: rnd() * 0.35 });
    }
    return out;
  }, [w]);

  const lights = useMemo(() => {
    if (!w) return { path: "", bulbs: [] as { x: number; y: number; c: string }[] };
    const seg = Math.max(110, Math.min(170, w / 9));
    const n = Math.ceil(w / seg);
    const base = 6;
    const sag = 20;
    let path = `M -10 ${base}`;
    const bulbs: { x: number; y: number; c: string }[] = [];
    for (let i = 0; i < n; i++) {
      const x0 = i * seg - 10;
      const x2 = x0 + seg;
      const cx = (x0 + x2) / 2;
      const cy = base + sag * 2;
      path += ` Q ${cx} ${cy} ${x2} ${base}`;
      for (const t of [0.28, 0.72]) {
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x2;
        const y = (1 - t) ** 2 * base + 2 * (1 - t) * t * cy + t * t * base;
        bulbs.push({ x, y, c: COLORS[bulbs.length % COLORS.length] });
      }
    }
    return { path, bulbs };
  }, [w]);

  useGSAP(
    () => {
      if (!lights.bulbs.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.to(".bulb-glow", {
        opacity: "random(0.15, 0.95)",
        duration: "random(0.6, 1.8)",
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        stagger: { each: 0.08, from: "random" },
      });
    },
    { scope: root, dependencies: [lights], revertOnUpdate: true },
  );

  // melt water dripping off the icicle tips while things thaw
  const levelRef = useRef(level);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  useEffect(() => {
    if (!dripping || !icicles.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const layer = drips.current!;
    let call: gsap.core.Tween;
    const spawn = () => {
      const lv = levelRef.current;
      const ice = icicles[Math.floor(Math.random() * icicles.length)];
      const s = Math.max(0.08, Math.min(1, lv * 1.35 - ice.melt));
      const d = document.createElement("div");
      d.className = "drip";
      d.style.left = `${ice.x - 3}px`;
      d.style.top = `${ice.len * s - 2}px`;
      layer.appendChild(d);
      gsap
        .timeline({ onComplete: () => d.remove() })
        .fromTo(d, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: "power1.out", transformOrigin: "50% 0%" })
        .to(d, { y: innerHeight + 40, duration: 1.1, ease: "power2.in" }, "+=0.15")
        .to(d, { opacity: 0, duration: 0.3 }, "-=0.3");
      call = gsap.delayedCall(0.25 + Math.random() * 1.1, spawn);
    };
    call = gsap.delayedCall(0.5, spawn);
    return () => {
      call?.kill();
      layer.replaceChildren();
    };
  }, [dripping, icicles]);

  if (!w) return null;

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[25]">
      <svg width={w} height={130} viewBox={`0 0 ${w} 130`} className="absolute left-0 top-0 overflow-visible">
        <defs>
          <linearGradient id="ice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f4f9ff" stopOpacity=".95" />
            <stop offset=".6" stopColor="#cfe4ff" stopOpacity=".75" />
            <stop offset="1" stopColor="#a9cdfa" stopOpacity=".35" />
          </linearGradient>
          <filter id="bulbBlur" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>

        <rect x="0" y="-4" width={w} height="8" rx="4" fill="#eef5ff" opacity={0.25 + level * 0.6} style={{ transition: "opacity 1.5s" }} />
        {icicles.map((ice, i) => {
          const s = Math.max(0.06, Math.min(1, level * 1.35 - ice.melt));
          const { x, len, width } = ice;
          const x0 = x - width / 2;
          const x1 = x + width / 2;
          return (
            <path
              key={i}
              d={`M${x0} 0 C ${x0} ${len * 0.35}, ${x - 1} ${len * 0.7}, ${x} ${len} C ${x + 1} ${len * 0.7}, ${x1} ${len * 0.35}, ${x1} 0 Z`}
              fill="url(#ice)"
              stroke="#fff"
              strokeOpacity=".35"
              strokeWidth=".6"
              style={{
                transform: `scaleY(${s})`,
                transformOrigin: `${x}px 0px`,
                transition: "transform 2s cubic-bezier(.2,.8,.2,1)",
              }}
            />
          );
        })}

        <path d={lights.path} fill="none" stroke="#0e1a33" strokeWidth="2" />
        {lights.bulbs.map((b, i) => (
          <g key={i} transform={`translate(${b.x} ${b.y})`}>
            <circle className="bulb-glow" cy="11" r="9" fill={b.c} filter="url(#bulbBlur)" opacity=".7" />
            <rect x="-2.5" y="-1" width="5" height="5" rx="1" fill="#2a3550" />
            <ellipse cy="10" rx="4" ry="6.5" fill={b.c} />
            <ellipse cx="-1.3" cy="8" rx="1.1" ry="2.2" fill="#fff" opacity=".6" />
          </g>
        ))}
      </svg>
      <div ref={drips} className="absolute inset-0 h-screen" />
    </div>
  );
}

export const Garland = memo(GarlandImpl);
