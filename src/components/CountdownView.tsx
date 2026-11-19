"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Countdown } from "@/lib/countdown";
import { useNow } from "@/lib/hooks";
import { breakdown, fullLabel, humanize } from "@/lib/when";

function Roll({ value }: { value: number }) {
  return (
    <span className="relative inline-flex overflow-hidden py-[0.08em] tabular-nums">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-80%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "80%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

async function celebrate() {
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#ff4d5e", "#46e08d", "#ffcc4d", "#ffffff", "#5ab0ff"];
  const flake = confetti.shapeFromText({ text: "❄", scalar: 2.2, color: "#eaf3ff" });
  confetti({ particleCount: 90, spread: 110, startVelocity: 42, origin: { y: 0.45 }, shapes: [flake], scalar: 2.2, ticks: 260 });
  const end = Date.now() + 2200;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors });
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

export function CountdownView({ cd }: { cd: Countdown }) {
  const now = useNow("raf");
  const remaining = cd.at - now;
  const done = remaining <= 0;
  const t = breakdown(remaining);
  const fired = useRef<number | null>(null);

  useEffect(() => {
    if (!done || fired.current === cd.at) return;
    fired.current = cd.at;
    if (Date.now() - cd.at < 10 * 60e3) celebrate();
  }, [done, cd.at]);

  const secs = Math.ceil(remaining / 1000);
  useEffect(() => {
    document.title = done ? `It’s ${cd.title}!` : `${humanize(secs * 1000)} · it’s almost ${cd.title}`;
  }, [secs, done, cd.title]);
  useEffect(() => () => void (document.title = "It’s almost…"), []);

  const units = [
    { v: t.days, one: "day", many: "days", show: t.days > 0 },
    { v: t.hours, one: "hour", many: "hours", show: t.days > 0 || t.hours > 0 },
    { v: t.minutes, one: "minute", many: "minutes", show: t.days > 0 || t.hours > 0 || t.minutes > 0 },
    { v: t.seconds, one: "second", many: "seconds", show: true },
  ].filter((u) => u.show);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex w-full max-w-5xl flex-col items-center gap-5 text-center sm:gap-7"
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="flex flex-col items-center gap-4"
          >
            <h1 className="text-[clamp(2.5rem,8vw,6rem)] font-extralight leading-[1.05] text-ice">
              It’s{" "}
              <strong className="bg-gradient-to-b from-white via-[#fff3d6] to-[#ffb36b] bg-clip-text font-bold text-transparent drop-shadow-[0_0_30px_rgba(255,170,80,.35)]">
                {cd.title}
              </strong>
              !
            </h1>
            <p className="text-lg font-light text-ice/60 sm:text-xl">
              the wait is over · {now - cd.at < 5000 ? "just now" : `${humanize(now - cd.at)} ago`}
            </p>
          </motion.div>
        ) : (
          <motion.div key="counting" exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }} className="flex flex-col items-center gap-5 sm:gap-7">
            <h1 className="text-[clamp(2.25rem,6.5vw,5rem)] font-extralight leading-[1.1] text-ice">
              It’s almost <strong className="font-semibold text-white">{cd.title}</strong>
            </h1>
            <div className="flex flex-wrap items-baseline justify-center gap-x-[0.6em] gap-y-1 text-[clamp(1.6rem,4.2vw,3.25rem)] font-extralight text-ice/75">
              {units.map((u) => (
                <motion.span layout key={u.one} className="inline-flex items-baseline gap-[0.25em]">
                  <strong className="font-semibold text-white">
                    <Roll value={u.v} />
                  </strong>
                  <span>{u.v === 1 ? u.one : u.many}</span>
                </motion.span>
              ))}
              <span className="w-[3ch] text-left text-[0.4em] font-medium tabular-nums text-ice/40">
                {String(t.millis).padStart(3, "0")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-sm font-light tracking-wide text-ice/40 sm:text-base">{fullLabel(new Date(cd.at))}</p>
    </motion.div>
  );
}
