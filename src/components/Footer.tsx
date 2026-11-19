"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { type Countdown, encodeCountdown, loadSaved, removeSaved } from "@/lib/countdown";
import { dayLabel, humanize, timeLabel } from "@/lib/when";

function Snowflake({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      {[0, 60, 120].map((r) => (
        <g key={r} transform={`rotate(${r} 12 12)`}>
          <path d="M12 2v20M9 4.5 12 7l3-2.5M9 19.5 12 17l3 2.5" />
        </g>
      ))}
    </svg>
  );
}

export function Footer({ cd, onNew, onOpen }: { cd: Countdown | null; onNew: () => void; onOpen: (c: Countdown) => void }) {
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState<Countdown[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date(0));
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node)) setOpen(false);
    };
    addEventListener("keydown", onKey);
    addEventListener("pointerdown", onDown);
    return () => {
      removeEventListener("keydown", onKey);
      removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(id);
  }, [toast]);

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share && matchMedia("(pointer: coarse)").matches) {
        await navigator.share({ title: `It’s almost ${cd?.title}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setToast("link copied — send it to someone cold");
    } catch {
      setToast("couldn’t copy — grab the link from the address bar");
    }
  };

  const toggleSaved = () => {
    setSaved(loadSaved());
    setNow(new Date());
    setOpen((o) => !o);
  };

  const link = "rounded-md px-2 py-1 transition hover:bg-white/5 hover:text-white";

  return (
    <>
      <footer className="fixed inset-x-0 bottom-0 z-30 flex h-12 items-center justify-between gap-2 border-t border-white/[0.06] bg-[#0a1129]/80 px-3 text-xs text-ice/60 backdrop-blur-md sm:px-6 sm:text-sm">
        <button onClick={onNew} className="flex items-center gap-2 font-medium tracking-wide text-ice/70 hover:text-white">
          <Snowflake className="size-4 text-sky-200" />
          <span className="hidden sm:inline">it’s almost</span>
        </button>

        <nav className="flex items-center gap-1 sm:gap-3">
          {cd && (
            <button onClick={share} className={link}>
              Share this
            </button>
          )}
          <button onClick={toggleSaved} className={link} aria-expanded={open}>
            My countdowns
          </button>
          {cd && (
            <button onClick={onNew} className={link}>
              New countdown
            </button>
          )}
        </nav>

        <span className="hidden text-ice/35 sm:inline">stay warm ☕</span>
      </footer>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panel}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-14 left-1/2 z-40 w-[min(92vw,380px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#101a3c]/85 p-2 shadow-2xl backdrop-blur-xl"
          >
            <p className="px-3 pb-1 pt-2 text-xs uppercase tracking-[0.2em] text-ice/40">My countdowns</p>
            {saved.length === 0 ? (
              <p className="px-3 py-4 text-sm text-ice/50">Nothing yet — start one and it’ll show up here.</p>
            ) : (
              <ul className="max-h-[50vh] overflow-y-auto">
                {saved.map((c) => {
                  const left = c.at - now.getTime();
                  const active = cd?.at === c.at && cd.title === c.title;
                  return (
                    <li key={`${c.title}-${c.at}`} className="group flex items-center gap-1">
                      <a
                        href={encodeCountdown(c)}
                        onClick={(e) => {
                          e.preventDefault();
                          setOpen(false);
                          onOpen(c);
                        }}
                        className={`flex min-w-0 flex-1 items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/5 ${active ? "bg-white/[0.06]" : ""}`}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-white">{c.title}</span>
                          <span className="block text-xs text-ice/45">
                            {dayLabel(new Date(c.at), now)} at {timeLabel(new Date(c.at))}
                          </span>
                        </span>
                        <span className={`shrink-0 text-xs tabular-nums ${left > 0 ? "text-sky-200/80" : "text-amber-200/70"}`}>
                          {left > 0 ? `in ${humanize(left)}` : "done ✦"}
                        </span>
                      </a>
                      <button
                        aria-label={`Remove ${c.title}`}
                        onClick={() => {
                          removeSaved(c);
                          setSaved(loadSaved());
                        }}
                        className="rounded-lg px-2 py-1 text-ice/30 opacity-0 transition hover:text-rose-300 group-hover:opacity-100 focus:opacity-100"
                      >
                        ✕
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-16 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#101a3c]/90 px-4 py-2 text-sm text-ice shadow-xl backdrop-blur"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
