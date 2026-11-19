"use client";

import { memo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "motion/react";

gsap.registerPlugin(useGSAP);

const EMBERS = 14;

/** A little campfire. `power` 0..1 controls how big it burns. */
function FireImpl({ power, roaring = false }: { power: number; roaring?: boolean }) {
  const root = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const flick = (sel: string, sy: number, sk: number, d: [number, number]) =>
        gsap.to(sel, {
          scaleY: `random(${1 - sy}, ${1 + sy})`,
          scaleX: `random(${1 - sy / 2}, ${1 + sy / 2})`,
          skewX: `random(${-sk}, ${sk})`,
          duration: `random(${d[0]}, ${d[1]})`,
          transformOrigin: "50% 100%",
          ease: "sine.inOut",
          repeat: -1,
          repeatRefresh: true,
        });
      flick(".f-outer", 0.12, 6, [0.18, 0.34]);
      flick(".f-left", 0.2, 10, [0.14, 0.28]);
      flick(".f-right", 0.2, 10, [0.15, 0.3]);
      flick(".f-mid", 0.1, 5, [0.12, 0.24]);
      flick(".f-core", 0.08, 3, [0.1, 0.2]);
      gsap.to(".f-glow", { opacity: "random(0.55, 0.9)", duration: "random(0.1, 0.3)", repeat: -1, repeatRefresh: true });

      gsap.utils.toArray<SVGCircleElement>(".ember").forEach((el) => {
        const tl = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: Math.random() * 2.5 });
        tl.fromTo(
          el,
          { x: "random(-22, 22)", y: 0, scale: 1 },
          { x: "random(-60, 60)", y: "random(-190, -120)", scale: 0.2, duration: "random(1.4, 2.6)", ease: "power1.out" },
        )
          .fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2 }, 0)
          .to(el, { opacity: 0, duration: 0.7 }, "-=0.7");
      });
    },
    { scope: root },
  );

  const scale = roaring ? 1.25 : 0.5 + power * 0.65;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed bottom-[clamp(46px,7vh,80px)] left-1/2 z-[3] w-[clamp(150px,18vw,220px)] -translate-x-1/2"
      style={{ originY: 1 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale, opacity: 1 }}
      transition={{ type: "spring", stiffness: 60, damping: 14 }}
    >
      <svg ref={root} viewBox="0 0 220 240" className="w-full overflow-visible">
        <defs>
          <radialGradient id="fireGlow">
            <stop offset="0" stopColor="#ffb347" stopOpacity=".75" />
            <stop offset=".45" stopColor="#ff7a2f" stopOpacity=".25" />
            <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="flameOuter" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff3d1f" />
            <stop offset=".55" stopColor="#ff7a2f" />
            <stop offset="1" stopColor="#ffb347" stopOpacity=".85" />
          </linearGradient>
          <linearGradient id="flameMid" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#ff8f2e" />
            <stop offset="1" stopColor="#ffd25e" />
          </linearGradient>
          <linearGradient id="flameCore" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff4c2" />
            <stop offset="1" stopColor="#ffe48a" />
          </linearGradient>
          <linearGradient id="log" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a4a2b" />
            <stop offset="1" stopColor="#4a2a17" />
          </linearGradient>
        </defs>

        <ellipse className="f-glow" cx="110" cy="150" rx="120" ry="110" fill="url(#fireGlow)" opacity=".75" />
        <ellipse cx="110" cy="214" rx="92" ry="14" fill="#ffd9a8" opacity=".35" />

        <g style={{ mixBlendMode: "screen" }}>
          <path className="f-left" fill="url(#flameOuter)" d="M84 202 C 62 194, 50 164, 60 128 C 66 150, 74 158, 84 160 C 77 176, 80 192, 84 202 Z" />
          <path className="f-right" fill="url(#flameOuter)" d="M136 202 C 160 192, 170 158, 158 122 C 155 147, 146 156, 136 160 C 143 176, 140 192, 136 202 Z" />
          <path className="f-outer" fill="url(#flameOuter)" d="M110 36 C 122 68, 162 94, 162 145 C 162 182, 139 204, 110 204 C 81 204, 58 182, 58 145 C 58 118, 77 104, 84 82 C 92 98, 96 106, 101 111 C 98 86, 101 60, 110 36 Z" />
          <path className="f-mid" fill="url(#flameMid)" d="M110 80 C 119 107, 146 124, 143 161 C 141 187, 127 202, 110 202 C 93 202, 79 188, 78 163 C 77 137, 99 121, 110 80 Z" />
          <path className="f-core" fill="url(#flameCore)" d="M110 128 C 116 145, 131 158, 129 177 C 128 193, 120 202, 110 202 C 100 202, 92 193, 91 178 C 90 160, 104 148, 110 128 Z" />
        </g>

        <g>
          <g transform="rotate(-14 110 206)">
            <rect x="38" y="196" width="144" height="20" rx="10" fill="url(#log)" />
            <ellipse cx="180" cy="206" rx="6" ry="10" fill="#c8935f" />
            <ellipse cx="180" cy="206" rx="3" ry="5.5" fill="none" stroke="#8a5a34" strokeWidth="1.2" />
          </g>
          <g transform="rotate(14 110 206)">
            <rect x="38" y="196" width="144" height="20" rx="10" fill="url(#log)" />
            <ellipse cx="40" cy="206" rx="6" ry="10" fill="#c8935f" />
            <ellipse cx="40" cy="206" rx="3" ry="5.5" fill="none" stroke="#8a5a34" strokeWidth="1.2" />
          </g>
          <path d="M70 200 q 12 -6 22 0 q 10 6 22 0 q 12 -6 22 0 q 10 5 18 1" fill="none" stroke="#ff9a3c" strokeOpacity=".55" strokeWidth="2" />
        </g>

        <g>
          {Array.from({ length: EMBERS }, (_, i) => (
            <circle key={i} className="ember" cx="110" cy="150" r={1.2 + (i % 3) * 0.7} fill={i % 2 ? "#ffd27a" : "#ff8a3d"} opacity="0" />
          ))}
        </g>
      </svg>
    </motion.div>
  );
}

export const Fire = memo(FireImpl);
