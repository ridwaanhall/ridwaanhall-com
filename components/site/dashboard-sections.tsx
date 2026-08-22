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

/** One labelled percentage bar in the language / category breakdowns. */
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
    <li>
      <div className="flex items-center justify-between gap-3">
        <div className="w-20 text-sm">
          <span className="cursor-help" title={entry.time}>
            {entry.name}
          </span>
        </div>
        <div className="relative flex h-3 flex-1 justify-center rounded-full bg-zinc-800/50">
          <span
            className={`${gradient} percent-bar absolute left-0 top-0 h-3 rounded-full`}
            style={{ "--bar-width": `${entry.percent}%` } as React.CSSProperties}
          />
        </div>
        <div className="w-10 text-right text-sm font-medium">
          {/* `parseInt`, as the original did -- 25.64 renders as "25%". */}
          <CountUp value={Math.trunc(entry.percent)} />%
        </div>
      </div>
    </li>
  );
}
