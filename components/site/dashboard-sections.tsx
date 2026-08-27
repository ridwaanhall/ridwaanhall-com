"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useReveal } from "@/components/site/use-reveal";
import type { WakatimeEntry } from "@/lib/data/wakatime";

/**
 * The animated pieces of the dashboard.
 *
 * `countUp.js` and the inline script in dashboard.html animated a number from
 * 0 to a `data-target` and a bar from 0% to a `data-width`, both on
 * DOMContentLoaded. Here each is a small component, and both start from the
 * final value when `prefers-reduced-motion` is set -- previously the numbers
 * counted up regardless.
 */

/**
 * Read from the stylesheet rather than written here, so a figure and the bar
 * beside it cannot drift apart -- they are the same two numbers, in one place.
 * The fallbacks are only for a render before the sheet has applied.
 */
function motion(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const ms = raw.endsWith("ms") ? Number.parseFloat(raw) : Number.parseFloat(raw) * 1000;
  return Number.isFinite(ms) && ms > 0 ? ms : fallback;
}

/**
 * The shared easing, as a function.
 *
 * `cubic-bezier(0.16, 1, 0.3, 1)` is the curve every entrance on the site
 * uses, and a number climbing has to be on it too or it finishes out of step
 * with the bar it labels. Solved by bisection on x rather than in closed form:
 * a cubic Bezier is parametric, so there is no y-of-x to evaluate directly,
 * and twenty halvings put the error below a millisecond of the duration --
 * far under a frame.
 */
function easeReveal(t: number): number {
  const cx = 3 * 0.16;
  const bx = 3 * (0.3 - 0.16) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * 1;
  const by = 3 * (1 - 1) - cy;
  const ay = 1 - cy - by;

  let lo = 0;
  let hi = 1;
  let u = t;
  for (let i = 0; i < 20; i++) {
    const x = ((ax * u + bx) * u + cx) * u;
    if (x < t) lo = u;
    else hi = u;
    u = (lo + hi) / 2;
  }
  return ((ay * u + by) * u + cy) * u;
}

/**
 * A number that counts up once, when its row first scrolls into view.
 *
 * `run` is how a bar and its figure start together. Left to itself this
 * component watched its own visibility, which was a second trigger for a row
 * whose bar had already started at mount -- so pass `run` wherever something
 * else owns the row's timing, and let it observe alone only where it stands on
 * its own (the GitHub totals).
 */
export function CountUp({
  value,
  className,
  run,
}: {
  value: number | string;
  className?: string;
  /** Omit to let the number watch its own visibility. */
  run?: boolean;
}) {
  // `parseFloat` then natural stringification, matching countUp.js: it renders
  // `Math.floor(progress * target)` while running and the parsed number at the
  // end -- so an average of 12.0 shows as "12" and 11.9 as "11.9". Formatting
  // it as a fixed decimal instead would print "12.0", which is not what the
  // live page shows.
  const target = typeof value === "number" ? value : Number.parseFloat(value) || 0;

  const [display, setDisplay] = useState<number | null>(null);
  const frame = useRef(0);

  const count = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const duration = motion("--motion-reveal", 900);
    const start = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Whole numbers while counting, exactly as the figure settles on.
      setDisplay(progress < 1 ? Math.floor(easeReveal(progress) * target) : null);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [target]);

  // Only watches for itself when nothing else owns the row's timing. Where a
  // bar does, `run` is what it passes, and the two start on the same tick.
  const selfRef = useReveal<HTMLSpanElement>(count, 0.15, run === undefined);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useEffect(() => {
    if (run) count();
  }, [run, count]);

  // `null` means "not animating" -- the final value, which is also what is
  // rendered on the server and before hydration.
  return (
    <span ref={selfRef} className={className}>
      {display ?? target}
    </span>
  );
}

/**
 * One bar carrying two shares of the same whole.
 *
 * The AI/human line split was already computed and spent entirely on a
 * tooltip -- it is the headline of the section it sits in, so it gets a bar.
 * A single bar with the remainder showing through, rather than two segments:
 * the track *is* the second share, and drawing it twice invites the two to
 * disagree by a rounding step at the join.
 *
 * It reuses `.percent-bar`, so the grow-from-zero and its reduced-motion
 * counterpart come from the stylesheet exactly as they do for a breakdown row.
 */
export function SplitBar({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
  percent,
  gradient,
  border,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  /** The left share, 0-100. The right one is what is left of the track. */
  percent: number;
  /** Written out in full -- Tailwind cannot see an interpolated gradient. */
  gradient: string;
  border: string;
}) {
  const [counting, setCounting] = useState(false);
  const ref = useReveal<HTMLDivElement>(() => setCounting(true));

  return (
    <div
      ref={ref}
      className={`mt-3 sm:mt-4 rounded-lg sm:rounded-xl border p-3 sm:p-4 ${border}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="font-medium">
          {leftLabel} <span className="text-zinc-400">{leftValue}</span>
        </span>
        <span className="font-medium">
          <span className="text-zinc-400">{rightValue}</span> {rightLabel}
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-zinc-800/50">
        <span
          className={`${gradient} percent-bar absolute left-0 top-0 h-2 rounded-full`}
          style={{ "--bar-width": `${percent}%` } as React.CSSProperties}
        />
      </div>
      <p className="mt-2 text-right text-xs text-zinc-400">
        <CountUp value={percent} run={counting} />% written by AI
      </p>
    </div>
  );
}

/**
 * One labelled bar in a breakdown panel.
 *
 * **The row is a subgrid, not a flex line.** Its three cells belong to the
 * track list `GradientPanel` defines on the `<ul>`, so every row in a panel
 * shares one label column and one value column: the label column is as wide as
 * the longest name in that panel, and the numbers line up down the right. As
 * independent flex rows they could only guess at a shared width, which is what
 * a fixed 80px label box was -- too narrow for "Claude-Code", so that one row
 * wrapped and stood taller than its neighbours.
 */
export function PercentBar({
  entry,
  gradient,
}: {
  entry: WakatimeEntry;
  /** Written out in full -- Tailwind cannot see an interpolated gradient. */
  gradient: string;
}) {
  // The grow is a CSS animation that starts at mount; `useReveal` only holds
  // it back while the row is off screen, and releases the bar and its number
  // on the same tick so they move as one. See use-reveal.ts for why it holds
  // rather than starts.
  const [counting, setCounting] = useState(false);
  const ref = useReveal<HTMLLIElement>(() => setCounting(true));

  return (
    <li ref={ref} className="col-span-3 grid grid-cols-subgrid items-center">
      {/*
        `wrap-anywhere`, not `break-words`. The half-panel cap on the label
        column is a `fit-content()`, and no track can be sized below its
        content's min-content width -- which for a name carrying no spaces or
        hyphens is the whole word. A project called
        "myprojectwithnobreaks" then measured 255px against a 188px cap and
        squeezed the bar down to 24px. `overflow-wrap: anywhere` is the one
        that counts toward intrinsic sizing, so the cap holds and the name
        wraps; `break-word` alone breaks the line and still blows out the
        track.
      */}
      <span className="cursor-help text-sm wrap-anywhere" title={entry.time}>
        {entry.name}
      </span>
      <div className="relative h-2 rounded-full bg-zinc-800/50">
        <span
          className={`${gradient} percent-bar absolute left-0 top-0 h-2 rounded-full`}
          style={{ "--bar-width": `${entry.percent}%` } as React.CSSProperties}
        />
      </div>
      <div className="text-right text-sm font-medium whitespace-nowrap">
        {entry.value ?? (
          <>
            {/*
              A whole percent -- 25.64 renders as "25%" -- except below one,
              where truncating prints "0%" next to a bar that is visibly not
              zero and reads as a broken number rather than a small one. The
              model accounting for 0.54% of a week's AI spend is the row that
              found it; every other breakdown here is well clear of 1%, so
              nothing else on screen changes.
            */}
            <CountUp
              run={counting}
              value={
                entry.percent < 1 ? Math.round(entry.percent * 10) / 10 : Math.trunc(entry.percent)
              }
            />
            %
          </>
        )}
      </div>
    </li>
  );
}
