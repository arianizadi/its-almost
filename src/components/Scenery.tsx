import { mulberry32 } from "@/lib/rng";

const rnd = mulberry32(42);
const STARS = Array.from({ length: 90 }, () => ({
  left: rnd() * 100,
  top: rnd() * 55,
  size: rnd() < 0.85 ? 1 + rnd() : 2 + rnd() * 1.2,
  delay: rnd() * 6,
  dur: 2.5 + rnd() * 4,
}));

const BACK_TREES = Array.from({ length: 34 }, (_, i) => ({
  x: (i / 34) * 1480 - 20 + rnd() * 30,
  s: 0.35 + rnd() * 0.3,
}));
const MID_TREES = [60, 150, 205, 330, 1080, 1160, 1230, 1330, 1400].map((x) => ({
  x: x + rnd() * 20,
  s: 0.6 + rnd() * 0.45,
}));
const FRONT_TREES = [
  { x: -10, s: 1.25 },
  { x: 70, s: 0.95 },
  { x: 1330, s: 1.15 },
  { x: 1415, s: 1.35 },
];

function Pine({ x, baseY, s, color, snow = 0.9 }: { x: number; baseY: number; s: number; color: string; snow?: number }) {
  const w = 100 * s;
  const h = 150 * s;
  return (
    <svg x={x - w / 2} y={baseY - h} width={w} height={h} viewBox="0 0 100 150" overflow="visible">
      <rect x="45" y="122" width="10" height="28" rx="2" fill="#0b1226" />
      <path
        d="M50 0 L72 40 L61 40 L85 80 L71 80 L97 126 L3 126 L29 80 L15 80 L39 40 L28 40 Z"
        fill={color}
      />
      <g fill="#eef4ff" opacity={snow}>
        <path d="M50 0 L61 20 L55 17 L50 22 L45 17 L39 20 Z" />
        <path d="M39 40 L61 40 L66 49 L58 46 L52 51 L45 46 L34 49 Z" />
        <path d="M29 80 L71 80 L77 90 L66 86 L57 92 L48 86 L38 91 L23 90 Z" />
        <path d="M3 126 L97 126 L92 130 L74 128 L60 133 L44 128 L24 132 L8 129 Z" />
      </g>
    </svg>
  );
}

export function Scenery() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,#18275a_0%,#0e1838_45%,#0a1129_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[60%] bg-[linear-gradient(to_top,rgba(98,128,196,.45),transparent)]" />

      {STARS.map((s, i) => (
        <span
          key={i}
          className="star absolute rounded-full bg-white"
          style={{
            left: `${s.left}%`,
            top: `${s.top}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}

      {/* moon */}
      <div className="absolute right-[9%] top-[8%] size-16 rounded-full sm:size-24 bg-[radial-gradient(circle_at_35%_35%,#fffdf3,#f3ecd2_55%,#d9d0b0)] shadow-[0_0_60px_18px_rgba(255,248,220,.18),0_0_160px_60px_rgba(170,200,255,.12)]">
        <span className="absolute left-[55%] top-[30%] size-[18%] rounded-full bg-[#d8ceaa]/60" />
        <span className="absolute left-[28%] top-[58%] size-[12%] rounded-full bg-[#d8ceaa]/50" />
        <span className="absolute left-[62%] top-[64%] size-[9%] rounded-full bg-[#d8ceaa]/50" />
      </div>

      <svg
        className="absolute inset-x-0 bottom-0 h-[42vh] min-h-[240px] w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="hillBack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5d74a8" />
            <stop offset="1" stopColor="#334676" />
          </linearGradient>
          <linearGradient id="hillMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a9bde0" />
            <stop offset="1" stopColor="#7086b6" />
          </linearGradient>
          <linearGradient id="hillFront" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f2f6ff" />
            <stop offset="1" stopColor="#b8c9e6" />
          </linearGradient>
        </defs>

        <path d="M0 175 C 240 130 420 160 620 140 C 860 115 1040 165 1240 135 C 1340 122 1400 130 1440 140 L1440 320 L0 320 Z" fill="url(#hillBack)" opacity=".75" />
        {BACK_TREES.map((t, i) => (
          <Pine key={i} x={t.x} baseY={170 + Math.sin(t.x / 160) * 14} s={t.s} color="#1c2a55" snow={0.55} />
        ))}

        <path d="M0 238 C 200 200 380 226 560 212 C 780 192 980 238 1180 216 C 1300 205 1380 210 1440 218 L1440 320 L0 320Z" fill="url(#hillMid)" />
        {MID_TREES.map((t, i) => (
          <Pine key={i} x={t.x} baseY={232 - (t.x > 1000 ? 12 : 0)} s={t.s} color="#17254d" snow={0.8} />
        ))}

        <path d="M0 290 C 260 258 520 272 720 266 C 940 258 1180 280 1440 262 L1440 320 L0 320Z" fill="url(#hillFront)" />
        {FRONT_TREES.map((t, i) => (
          <Pine key={i} x={t.x} baseY={300} s={t.s} color="#13203f" />
        ))}
      </svg>
    </div>
  );
}
