"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import type { Countdown } from "@/lib/countdown";
import { useNow } from "@/lib/hooks";
import {
  dayLabel,
  humanize,
  parseClock,
  resolveWhen,
  timeLabel,
  toDateInput,
} from "@/lib/when";

const IDEAS = [
  "christmas",
  "the weekend",
  "beer o'clock",
  "home time",
  "lunch",
  "new year's",
  "vacation",
  "cocoa time",
];
const TIME_CHIPS = ["noon", "5pm", "midnight", "in 1 hour"];

/** An input that grows to fit its contents. */
function AutoInput({
  value,
  onChange,
  sizer,
  overlay,
  className = "",
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  sizer: string;
  overlay?: ReactNode;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <span className={`relative inline-grid ${className}`}>
      <span
        aria-hidden
        className="invisible col-start-1 row-start-1 whitespace-pre"
      >
        {(value || sizer) + " "}
      </span>
      {overlay}
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        size={1}
        className="col-start-1 row-start-1 w-full min-w-0 bg-transparent outline-none"
      />
    </span>
  );
}

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-sky-200/60 bg-sky-200/15 text-white"
          : "border-white/10 bg-white/[0.04] text-ice/60 hover:border-white/25 hover:text-ice"
      }`}
    >
      {children}
    </button>
  );
}

export function Setup({ onStart }: { onStart: (c: Countdown) => void }) {
  const now = useNow(1000);
  const [title, setTitle] = useState("");
  const [idea, setIdea] = useState(0);
  const [date, setDate] = useState(() => toDateInput(new Date()));
  const [dateTouched, setDateTouched] = useState(false);
  const [time, setTime] = useState("5pm");
  const [timeScope, animate] = useAnimate();
  const [titleScope, animateTitle] = useAnimate();
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setIdea((i) => (i + 1) % IDEAS.length), 2600);
    return () => clearInterval(id);
  }, []);

  const nowDate = new Date(now);
  const today = toDateInput(nowDate);
  const tomorrow = toDateInput(
    new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate() + 1),
  );
  const res = resolveWhen(time, date, dateTouched, nowDate);
  const relative = res.ok && res.relative;

  let hint: ReactNode;
  if (nudge && !title.trim()) {
    hint = <span className="text-amber-200/90">it’s almost… what? give it a name first</span>;
  } else if (res.ok) {
    const d = res.date;
    const isMidnight =
      d.getHours() === 0 &&
      d.getMinutes() === 0 &&
      dayLabel(d, nowDate) === "tomorrow";
    const when = isMidnight
      ? "midnight tonight"
      : `${dayLabel(d, nowDate)} at ${timeLabel(d)}`;
    hint = (
      <>
        <span className="text-white/90">{when}</span>
        <span className="text-ice/40">
          {" "}
          · {humanize(d.getTime() - now)} from now
        </span>
        {res.rolled && (
          <span className="text-amber-200/70"> · already passed today</span>
        )}
      </>
    );
  } else if (res.reason === "past") {
    hint = (
      <span className="text-rose-300/90">
        that’s already happened — pick a later time
      </span>
    );
  } else if (res.reason === "empty") {
    hint = <span className="text-ice/50">when? try “4pm”</span>;
  } else {
    hint = (
      <span className="text-ice/50">
        hmm — try “4pm”, “16:30”, “noon” or “in 20 min”
      </span>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setNudge(true);
      animateTitle(titleScope.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 });
      titleScope.current?.querySelector("input")?.focus();
      return;
    }
    const r = resolveWhen(time, date, dateTouched, new Date());
    if (!r.ok) {
      animate(
        timeScope.current,
        { x: [0, -10, 10, -6, 6, 0] },
        { duration: 0.4 },
      );
      return;
    }
    onStart({
      title: title.trim(),
      at: r.date.getTime(),
      from: Date.now(),
    });
  };

  const tidyTime = () => {
    const c = parseClock(time);
    if (c?.kind === "time" && /\d/.test(time) && res.ok)
      setTime(timeLabel(res.date));
  };

  return (
    <motion.form
      onSubmit={submit}
      initial={{ opacity: 0, y: 24, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -24, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
      className="flex w-full max-w-4xl flex-col items-center gap-5 text-center sm:gap-7"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[clamp(2rem,6vw,4.25rem)] font-extralight leading-tight text-ice">
        <span>It’s almost</span>
        <label ref={titleScope} className="field px-[0.35em] py-[0.05em] font-semibold text-white">
          <AutoInput
            value={title}
            onChange={setTitle}
            sizer={IDEAS[idea]}
            maxLength={60}
            aria-label="What are you counting down to?"
            autoFocus
            overlay={
              !title && (
                <span
                  aria-hidden
                  className="pointer-events-none col-start-1 row-start-1 overflow-hidden text-left"
                >
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={idea}
                      className="block whitespace-pre text-white/30"
                      initial={{ y: "60%", opacity: 0, filter: "blur(6px)" }}
                      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                      exit={{ y: "-60%", opacity: 0, filter: "blur(6px)" }}
                      transition={{ duration: 0.5 }}
                    >
                      {IDEAS[idea]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              )
            }
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 text-[clamp(1.25rem,3vw,2rem)] font-extralight text-ice/80">
        <span>on</span>
        <label
          className={`field px-3 py-1 font-medium text-white transition-opacity ${relative ? "opacity-40" : ""}`}
        >
          <input
            type="date"
            value={date}
            min={today}
            aria-label="Date"
            onChange={(e) => {
              setDate(e.target.value);
              setDateTouched(true);
            }}
            className="bg-transparent outline-none [color-scheme:dark]"
          />
        </label>
        <span className="inline-flex items-center gap-3">
          <span>at</span>
          <label
            ref={timeScope}
            className="field px-3 py-1 font-medium text-white"
          >
            <AutoInput
              value={time}
              onChange={setTime}
              onBlur={tidyTime}
              sizer="4:30 PM"
              placeholder="4pm"
              aria-label="Time — try 4pm, 16:30, noon or in 20 min"
              className="min-w-[3ch]"
            />
          </label>
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Chip
          active={date === today && !relative}
          onClick={() => (setDate(today), setDateTouched(true))}
        >
          today
        </Chip>
        <Chip
          active={date === tomorrow && !relative}
          onClick={() => (setDate(tomorrow), setDateTouched(true))}
        >
          tomorrow
        </Chip>
        <span className="mx-1 h-4 w-px bg-white/15" />
        {TIME_CHIPS.map((c) => (
          <Chip
            key={c}
            active={time.trim().toLowerCase() === c}
            onClick={() => setTime(c)}
          >
            {c}
          </Chip>
        ))}
      </div>

      <p aria-live="polite" className="min-h-6 text-sm sm:text-base">
        {hint}
      </p>

      <motion.button
        type="submit"
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        disabled={!res.ok}
        className="group relative mt-1 overflow-hidden rounded-2xl bg-gradient-to-b from-[#ff6b5e] to-[#d7263d] px-8 py-3.5 text-lg font-semibold text-white shadow-[0_10px_40px_-8px_rgba(255,80,70,.6),inset_0_1px_0_rgba(255,255,255,.35)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40 sm:text-xl"
      >
        <span className="absolute inset-x-0 top-0 h-2 bg-[radial-gradient(circle_at_10px_0,#fff_5px,transparent_5.5px)] bg-[length:22px_10px] opacity-90" />
        <span className="relative">start the countdown</span>
      </motion.button>
    </motion.form>
  );
}
