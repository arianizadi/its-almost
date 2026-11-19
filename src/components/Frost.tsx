"use client";

import { memo, useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { mulberry32 } from "@/lib/rng";

gsap.registerPlugin(useGSAP);

type Ctx = CanvasRenderingContext2D;

function fern(ctx: Ctx, rnd: () => number, x: number, y: number, a: number, len: number, depth: number, width: number) {
  const ex = x + Math.cos(a) * len;
  const ey = y + Math.sin(a) * len;
  ctx.globalAlpha = 0.16 + depth * 0.09;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ex, ey);
  ctx.stroke();
  if (depth <= 0 || len < 5) return;
  const n = 2 + Math.floor(rnd() * 4);
  for (let k = 1; k <= n; k++) {
    const t = k / (n + 1) + (rnd() - 0.5) * 0.08;
    const bx = x + (ex - x) * t;
    const by = y + (ey - y) * t;
    const bl = len * (0.55 - 0.3 * t) * (0.7 + rnd() * 0.5);
    const spread = (Math.PI / 3) * (0.85 + rnd() * 0.3);
    fern(ctx, rnd, bx, by, a + spread, bl, depth - 1, width * 0.6);
    fern(ctx, rnd, bx, by, a - spread, bl * (0.8 + rnd() * 0.4), depth - 1, width * 0.6);
  }
}

function crystal(ctx: Ctx, x: number, y: number, r: number, rot: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI) / 3;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  ctx.stroke();
}

function drawFrost(canvas: HTMLCanvasElement) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = innerWidth;
  const h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const rnd = mulberry32(1337);
  const m = Math.min(w, h);

  // frosted haze hugging the edges
  const edge = m * 0.22;
  const haze = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, "rgba(225,238,255,.38)");
    g.addColorStop(1, "rgba(225,238,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  haze(0, 0, 0, edge, 0, 0, w, edge);
  haze(0, h, 0, h - edge, 0, h - edge, w, edge);
  haze(0, 0, edge, 0, 0, 0, edge, h);
  haze(w, 0, w - edge, 0, w - edge, 0, edge, h);

  ctx.strokeStyle = "rgb(236,245,255)";
  ctx.fillStyle = "rgb(240,247,255)";
  ctx.lineCap = "round";

  // speckled crystals, denser toward edges
  const n = Math.round((w * h) / 140);
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const e = Math.min(x, y, w - x, h - y) / (m * 0.5);
    const p = Math.pow(Math.max(0, 1 - e), 3.2);
    if (rnd() > p) continue;
    ctx.globalAlpha = 0.12 + rnd() * 0.5;
    const size = 0.4 + rnd() * 2.2 * p;
    if (size > 1.4 && rnd() < 0.25) {
      ctx.lineWidth = 0.6;
      crystal(ctx, x, y, size * 2.2, rnd() * Math.PI);
    } else {
      ctx.fillRect(x, y, size, size);
    }
  }

  // ice feathers growing in from every edge
  const scale = Math.max(0.6, Math.min(1.3, m / 800));
  const spacing = 64;
  for (let x = rnd() * spacing; x < w; x += spacing * (0.6 + rnd() * 0.8)) {
    fern(ctx, rnd, x, -2, Math.PI / 2 + (rnd() - 0.5) * 1.3, (25 + rnd() * 105) * scale, 3, 1.4);
    fern(ctx, rnd, x, h + 2, -Math.PI / 2 + (rnd() - 0.5) * 1.3, (25 + rnd() * 105) * scale, 3, 1.4);
  }
  for (let y = rnd() * spacing; y < h; y += spacing * (0.6 + rnd() * 0.8)) {
    fern(ctx, rnd, -2, y, (rnd() - 0.5) * 1.3, (25 + rnd() * 105) * scale, 3, 1.4);
    fern(ctx, rnd, w + 2, y, Math.PI + (rnd() - 0.5) * 1.3, (25 + rnd() * 105) * scale, 3, 1.4);
  }
  // big corner blooms
  const corners: [number, number, number][] = [
    [0, 0, Math.PI / 4],
    [w, 0, (3 * Math.PI) / 4],
    [0, h, -Math.PI / 4],
    [w, h, (-3 * Math.PI) / 4],
  ];
  for (const [cx, cy, a] of corners) {
    for (let k = 0; k < 5; k++) {
      fern(ctx, rnd, cx, cy, a + (rnd() - 0.5) * 1.2, (120 + rnd() * 120) * scale, 4, 2);
    }
  }
}

/**
 * The frozen-window overlay. `level` 1 = iced over, 0 = fully thawed.
 * The clear patch in the middle grows outward as things warm up.
 */
function FrostImpl({ level }: { level: number }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const setLevel = useRef<((v: number) => void) | null>(null);
  const initial = useRef(level);

  useEffect(() => {
    const c = canvas.current!;
    let id = 0;
    const redraw = () => {
      cancelAnimationFrame(id);
      id = requestAnimationFrame(() => drawFrost(c));
    };
    drawFrost(c);
    addEventListener("resize", redraw);
    return () => {
      cancelAnimationFrame(id);
      removeEventListener("resize", redraw);
    };
  }, []);

  useGSAP(
    () => {
      const el = root.current!;
      const proxy = { v: initial.current };
      const apply = () => el.style.setProperty("--frost", proxy.v.toFixed(4));
      apply();
      setLevel.current = gsap.quickTo(proxy, "v", { duration: 1.8, ease: "power2.out", onUpdate: apply });
    },
    { scope: root },
  );

  useEffect(() => {
    setLevel.current?.(level);
  }, [level]);

  return (
    <div ref={root} aria-hidden className="frost pointer-events-none fixed inset-0 z-20">
      <div className="frost-mask frost-glass absolute inset-0" />
      <canvas ref={canvas} className="frost-mask frost-crystals absolute inset-0 h-full w-full" />
    </div>
  );
}

export const Frost = memo(FrostImpl);
