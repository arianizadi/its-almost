"use client";

import { useCallback, useSyncExternalStore } from "react";

type Clock = { now: number; subs: Set<() => void>; stop: (() => void) | null };
const clocks = new Map<string, Clock>();

function clockFor(mode: "raf" | number): Clock {
  const key = String(mode);
  let c = clocks.get(key);
  if (!c) {
    c = { now: Date.now(), subs: new Set(), stop: null };
    clocks.set(key, c);
  }
  return c;
}

function start(c: Clock, mode: "raf" | number) {
  const tick = () => {
    c.now = Date.now();
    c.subs.forEach((f) => f());
  };
  if (mode === "raf") {
    let id = 0;
    const loop = () => {
      tick();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }
  const id = setInterval(tick, mode);
  return () => clearInterval(id);
}

function subscribeClock(mode: "raf" | number, cb: () => void) {
  const c = clockFor(mode);
  c.subs.add(cb);
  if (!c.stop) {
    c.now = Date.now();
    c.stop = start(c, mode);
  }
  return () => {
    c.subs.delete(cb);
    if (!c.subs.size) {
      c.stop?.();
      c.stop = null;
    }
  };
}

/** Current timestamp, refreshed every animation frame ("raf") or every N ms. 0 on the server. */
export function useNow(mode: "raf" | number) {
  const subscribe = useCallback((cb: () => void) => subscribeClock(mode, cb), [mode]);
  return useSyncExternalStore(subscribe, () => clockFor(mode).now, () => 0);
}

const onResize = (cb: () => void) => {
  addEventListener("resize", cb);
  return () => removeEventListener("resize", cb);
};

export function useViewportWidth() {
  return useSyncExternalStore(onResize, () => innerWidth, () => 0);
}

const onHash = (cb: () => void) => {
  addEventListener("hashchange", cb);
  addEventListener("popstate", cb);
  return () => {
    removeEventListener("hashchange", cb);
    removeEventListener("popstate", cb);
  };
};

/** location.hash, or null during SSR / before hydration. */
export function useHash() {
  return useSyncExternalStore(onHash, () => location.hash, () => null);
}
