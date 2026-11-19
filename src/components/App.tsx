"use client";

import { useCallback, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { type Countdown, decodeCountdown, encodeCountdown, saveCountdown } from "@/lib/countdown";
import { useHash, useNow } from "@/lib/hooks";
import { Scenery } from "./Scenery";
import { Snowfall } from "./Snowfall";
import { Frost } from "./Frost";
import { Fire } from "./Fire";
import { Garland } from "./Garland";
import { Setup } from "./Setup";
import { CountdownView } from "./CountdownView";
import { Footer } from "./Footer";

const round = (n: number) => Math.round(n * 200) / 200;

export function App() {
  const hash = useHash();
  const ready = hash !== null;
  const cd = useMemo(() => decodeCountdown(hash), [hash]);
  const now = useNow(250);

  // 1 = frozen solid, 0 = fully thawed. The fire grows as the frost retreats.
  let frost = 0.85;
  let power = 0.15;
  let done = false;
  if (cd) {
    const progress = Math.min(1, Math.max(0, (now - cd.from) / (cd.at - cd.from)));
    done = now >= cd.at;
    frost = done ? 0 : round(0.92 * (1 - progress));
    power = done ? 1 : round(0.15 + 0.85 * progress);
  }
  const thawing = !!cd && !done;

  const open = useCallback((c: Countdown) => {
    location.hash = encodeCountdown(c);
  }, []);

  const start = useCallback(
    (c: Countdown) => {
      saveCountdown(c);
      open(c);
    },
    [open],
  );

  const reset = useCallback(() => {
    history.pushState(null, "", location.pathname + location.search);
    dispatchEvent(new PopStateEvent("popstate"));
  }, []);

  return (
    <>
      <Scenery />
      <div
        aria-hidden
        className="warm-glow pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_70%_55%_at_50%_100%,rgba(255,140,50,.5),rgba(255,90,40,.12)_55%,transparent_75%)] transition-opacity duration-[2000ms]"
        style={{ opacity: 0.12 + power * 0.6 }}
      />
      <Snowfall intensity={cd ? (done ? 0.5 : 0.35 + 0.65 * frost) : 1} />
      {ready && <Fire power={power} roaring={done} />}

      <main className="relative z-10 flex h-dvh items-center justify-center px-4 pb-[clamp(120px,24vh,250px)] pt-14">
        <AnimatePresence mode="wait">
          {ready && (cd ? <CountdownView key={hash} cd={cd} /> : <Setup key="setup" onStart={start} />)}
        </AnimatePresence>
      </main>

      <Frost level={frost} />
      <Garland level={frost} dripping={thawing} />
      <Footer cd={cd} onNew={reset} onOpen={open} />
    </>
  );
}
