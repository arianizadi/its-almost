export type Countdown = { title: string; at: number; from: number };

/** Shareable, timezone-proof: #t=beer%20o'clock&at=<unix>&from=<unix> */
export function encodeCountdown(c: Countdown) {
  return `#t=${encodeURIComponent(c.title)}&at=${Math.round(c.at / 1000)}&from=${Math.round(c.from / 1000)}`;
}

export function decodeCountdown(hash: string | null | undefined): Countdown | null {
  if (!hash || hash.length < 2) return null;
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const title = p.get("t")?.trim();
  const at = Number(p.get("at")) * 1000;
  let from = Number(p.get("from")) * 1000;
  if (!title || !Number.isFinite(at) || at <= 0) return null;
  if (!Number.isFinite(from) || from <= 0 || from >= at) from = at - 36e5;
  return { title: title.slice(0, 80), at, from };
}

const KEY = "itsalmost:countdowns";

export function loadSaved(): Countdown[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((c) => c && c.title && c.at) : [];
  } catch {
    return [];
  }
}

export function saveCountdown(c: Countdown) {
  try {
    const list = loadSaved().filter((x) => !(x.title === c.title && x.at === c.at));
    localStorage.setItem(KEY, JSON.stringify([c, ...list].slice(0, 30)));
  } catch {}
}

export function removeSaved(c: Countdown) {
  try {
    const list = loadSaved().filter((x) => !(x.title === c.title && x.at === c.at));
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}
