"use client";

import { memo, useEffect, useRef } from "react";

type Flake = { x: number; y: number; r: number; vy: number; phase: number; sway: number; a: number };

function SnowfallImpl({ intensity = 1 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);

  useEffect(() => {
    intensityRef.current = intensity;
  }, [intensity]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    const flakes: Flake[] = [];

    const make = (anywhere: boolean): Flake => {
      const depth = Math.random();
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -6,
        r: 0.6 + depth * depth * 3,
        vy: 0.3 + depth * 1.2,
        phase: Math.random() * Math.PI * 2,
        sway: 0.4 + Math.random(),
        a: 0.3 + depth * 0.65,
      };
    };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth;
      h = innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.min(450, Math.round((w * h) / 4800));
      while (flakes.length < target) flakes.push(make(true));
      flakes.length = target;
    };
    resize();
    addEventListener("resize", resize);

    let t = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67) * (reduce ? 0.35 : 1);
      last = now;
      t += 0.01 * dt;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#fff";
      const wind = Math.sin(t * 0.6) * 0.6 + Math.sin(t * 0.17) * 0.5;
      const visible = Math.round(flakes.length * Math.max(0, Math.min(1, intensityRef.current)));
      for (let i = 0; i < visible; i++) {
        const f = flakes[i];
        f.y += f.vy * dt;
        f.x += (wind * f.r * 0.3 + Math.sin(t * 2.2 * f.sway + f.phase) * 0.35) * dt;
        if (f.y > h + 6) Object.assign(f, make(false));
        if (f.x > w + 6) f.x = -6;
        else if (f.x < -6) f.x = w + 6;
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[2] h-full w-full" />;
}

export const Snowfall = memo(SnowfallImpl);
