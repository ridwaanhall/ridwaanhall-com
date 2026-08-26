"use client";

import { useEffect, useRef, useState } from "react";

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

const DURATION_MS = 1500;

/** A number that counts up once, when it first scrolls into view. */
export function CountUp({ value, className }: { value: number | string; className?: string }) {
  // `parseFloat` then natural stringification, matching countUp.js: it renders
  // `Math.floor(progress * target)` while running and the parsed number at the
  // end -- so an average of 12.0 shows as "12" and 11.9 as "11.9". Formatting
  // it as a fixed decimal instead would print "12.0", which is not what the
  // live page shows.
  const target = typeof value === "number" ? value : Number.parseFloat(value) || 0;

  const [display, setDisplay] = useState<number | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let started = false;

    const run = () => {
      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / DURATION_MS);
        // Whole numbers while counting, exactly as countUp.js did.
        setDisplay(progress < 1 ? Math.floor(progress * target) : null);
        if (progress < 1) frame = requestAnimationFrame(step);
      };
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started) {
          started = true;
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [target]);

  // `null` means "not animating" -- the final value, which is also what is
  // rendered on the server and before hydration.
  return (
    <span ref={ref} className={className}>
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
  return (
    <div className={`mt-3 sm:mt-4 rounded-lg sm:rounded-xl border p-3 sm:p-4 ${border}`}>
      <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="font-medium">
          {leftLabel} <span className="text-zinc-400">{leftValue}</span>
        </span>
        <span className="font-medium">
          <span className="text-zinc-400">{rightValue}</span> {rightLabel}
        </span>
      </div>
      <div className="relative h-3 rounded-full bg-zinc-800/50">
        <span
          className={`${gradient} percent-bar absolute left-0 top-0 h-3 rounded-full`}
          style={{ "--bar-width": `${percent}%` } as React.CSSProperties}
        />
      </div>
      <p className="mt-2 text-right text-xs text-zinc-400">
        <CountUp value={percent} />% written by AI
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
  // The grow-from-zero is a CSS animation keyed off a custom property rather
  // than state driven from an effect. It needs no JavaScript at all, the final
  // width is in the markup so the bar is correct before hydration, and
  // prefers-reduced-motion is handled in the stylesheet.
  return (
    <li className="col-span-3 grid grid-cols-subgrid items-center">
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
      <div className="relative h-3 rounded-full bg-zinc-800/50">
        <span
          className={`${gradient} percent-bar absolute left-0 top-0 h-3 rounded-full`}
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
