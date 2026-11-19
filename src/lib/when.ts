/**
 * Turning human input like "4pm", "16:30", "noon" or "in 20 min" into a real Date.
 */

export type WhenResult =
  | { ok: true; date: Date; rolled: boolean; relative: boolean }
  | { ok: false; reason: "empty" | "unparsed" | "past"; date?: Date };

const DAY = 864e5;

function unitMs(u: string): number | null {
  if (/^(w|wks?|weeks?)$/.test(u)) return 7 * DAY;
  if (/^(d|days?)$/.test(u)) return DAY;
  if (/^(h|hrs?|hours?)$/.test(u)) return 36e5;
  if (/^(m|mins?|minutes?)$/.test(u)) return 6e4;
  if (/^(s|secs?|seconds?)$/.test(u)) return 1e3;
  return null;
}

/** "1h30m", "20 min", "an hour and a half", "90s" -> milliseconds */
export function parseDuration(input: string): number | null {
  const str = input
    .toLowerCase()
    .replace(/^in\s+/, "")
    .replace(/\band a half\b/g, "")
    .replace(/half an? hour/g, "30 min")
    .replace(/\band\b|,/g, " ")
    .replace(/\ban?\s+(?=[a-z])/g, "1 ")
    .trim();
  const half = /\band a half\b/.test(input.toLowerCase());
  const re = /(\d+(?:\.\d+)?)\s*([a-z]+)/g;
  let total = 0;
  let lastUnit = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(str))) {
    const u = unitMs(m[2]);
    if (u == null) return null;
    total += parseFloat(m[1]) * u;
    lastUnit = u;
  }
  if (!total || str.replace(re, "").trim()) return null;
  if (half) total += lastUnit / 2;
  return total;
}

type Clock =
  | { kind: "time"; h: number; m: number; mer: "am" | "pm" | null }
  | { kind: "midnight" };

export function parseClock(input: string): Clock | null {
  const s = input
    .toLowerCase()
    .replace(/a\.m\.?/g, "am")
    .replace(/p\.m\.?/g, "pm")
    .replace(/o['’]?\s?clock/g, "")
    .replace(/^at\s+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (s === "noon" || s === "midday") return { kind: "time", h: 12, m: 0, mer: "pm" };
  if (s === "midnight") return { kind: "midnight" };

  let h: number;
  let min = 0;
  let mer: "am" | "pm" | null = null;

  const a = s.match(/^(\d{1,2})(?:[:.h](\d{2}))?\s*(am|pm|a|p)?$/);
  const b = s.match(/^(\d{3,4})\s*(am|pm|a|p)?$/);
  if (a) {
    h = +a[1];
    min = a[2] ? +a[2] : 0;
    if (a[3]) mer = a[3].startsWith("a") ? "am" : "pm";
  } else if (b) {
    h = Math.floor(+b[1] / 100);
    min = +b[1] % 100;
    if (b[2]) mer = b[2].startsWith("a") ? "am" : "pm";
  } else return null;

  if (min > 59) return null;
  if (mer ? h < 1 || h > 12 : h > 23) return null;
  return { kind: "time", h, m: min, mer };
}

export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fromDateInput(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}

function at(base: Date, h: number, m: number, addDays = 0) {
  const d = new Date(base);
  d.setDate(d.getDate() + addDays);
  d.setHours(h, m, 0, 0);
  return d;
}

function sameDay(a: Date, b: Date) {
  return toDateInput(a) === toDateInput(b);
}

/**
 * Resolve a time + date pair into a target Date.
 * If the user never touched the date and the time has already passed today,
 * we quietly roll it forward to tomorrow. Bare hours ("4") pick whichever of
 * 4am / 4pm comes next.
 */
export function resolveWhen(
  timeStr: string,
  dateStr: string,
  dateTouched: boolean,
  now: Date,
): WhenResult {
  const s = timeStr.trim();
  if (!s) return { ok: false, reason: "empty" };

  const clock = parseClock(s);
  if (!clock) {
    const ms = parseDuration(s);
    if (ms == null) return { ok: false, reason: "unparsed" };
    return { ok: true, date: new Date(now.getTime() + ms), rolled: false, relative: true };
  }

  const base = fromDateInput(dateStr) ?? now;
  let candidates: Date[];
  let fallback: Date; // used when rolling to tomorrow

  if (clock.kind === "midnight") {
    candidates = [at(base, 0, 0, 1)];
    fallback = candidates[0];
  } else {
    const { h, m, mer } = clock;
    if (mer) {
      const h24 = (h % 12) + (mer === "pm" ? 12 : 0);
      candidates = [at(base, h24, m)];
    } else if (h === 0 || h >= 12) {
      candidates = [at(base, h, m)];
    } else if (!dateTouched || sameDay(base, now)) {
      candidates = [at(base, h, m), at(base, h + 12, m)];
    } else {
      candidates = [at(base, h >= 7 ? h : h + 12, m)];
    }
    // ambiguous hours when rolling: 7–11 → morning, 1–6 → afternoon
    const guess = !mer && h >= 1 && h <= 11 ? (h >= 7 ? h : h + 12) : candidates[0].getHours();
    fallback = at(base, guess, m);
  }

  const next = candidates.find((d) => d.getTime() > now.getTime());
  if (next) return { ok: true, date: next, rolled: false, relative: false };

  if (!dateTouched) {
    const rolled = new Date(fallback);
    while (rolled.getTime() <= now.getTime()) rolled.setDate(rolled.getDate() + 1);
    return { ok: true, date: rolled, rolled: true, relative: false };
  }
  return { ok: false, reason: "past", date: candidates[candidates.length - 1] };
}

/* ---------- formatting ---------- */

export function timeLabel(d: Date) {
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function dayLabel(d: Date, now: Date) {
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(now)) / DAY);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 1 && diff < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export function fullLabel(d: Date) {
  const date = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const tz =
    new Intl.DateTimeFormat([], { timeZoneName: "short" })
      .formatToParts(d)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  return `${date} · ${timeLabel(d)}${tz ? ` ${tz}` : ""}`;
}

export function humanize(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return h ? `${d}d ${h}h` : `${d}d`;
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  if (m) return sec && m < 5 ? `${m}m ${sec}s` : `${m}m`;
  return `${sec}s`;
}

export function breakdown(ms: number) {
  const t = Math.max(0, ms);
  return {
    days: Math.floor(t / DAY),
    hours: Math.floor((t % DAY) / 36e5),
    minutes: Math.floor((t % 36e5) / 6e4),
    seconds: Math.floor((t % 6e4) / 1e3),
    millis: Math.floor(t % 1e3),
  };
}
