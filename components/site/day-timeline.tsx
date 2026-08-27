"use client";

import { useState } from "react";

import { useReveal } from "@/components/site/use-reveal";
import type { DayBlock } from "@/lib/data/wakatime-day";

/**
 * Today along the clock, midnight to midnight.
 *
 * Every other panel on the dashboard reports how much; this one reports when,
 * which is the one thing a total cannot carry. A block sits where its sitting
 * began and is as wide as the sitting was long, so a day of short evening
 * bursts and a day of one long afternoon are different pictures rather than the
 * same number.
 *
 * **The track is always the whole day, never just the part with work in it.**
 * Scaling to the first and last keystroke would make every day look equally
 * full and put the same sitting in a different place each time -- the empty
 * hours are half of what the ribbon says.
 *
 * The blocks arrive already positioned. Their fractions are computed on the
 * server against the day boundary WakaTime itself reports, because a clock read
 * in the browser is a second clock, and one that can disagree with the render
 * it is hydrating.
 */

/**
 * One colour per language, and one for everything else.
 *
 * Written out rather than composed from a slot number: Tailwind emits a class
 * only where it can see it in the source, so a fill built by interpolation
 * produces no rule and every block comes out invisible.
 *
 * Two constraints picked these five. All are remapped under the light palette --
 * several of their neighbours are not, and a block drawn in one of those would
 * stay dark on a light page. And they are spread across the spectrum rather
 * than kept inside the section's own pink, because that palette compresses
 * going the other way: an earlier ramp put two purples side by side, which read
 * as two shades in the dark and as the same colour in the light.
 */
const RAMP = [
  "bg-pink-400",
  "bg-violet-400",
  "bg-blue-400",
  "bg-cyan-400",
  "bg-lime-400",
] as const;

/** Languages past the end of the ramp share this. */
const LEFTOVER = "bg-zinc-600";

/** Where the ribbon is ruled, and what the axis underneath says. */
const HOURS = [0, 6, 12, 18, 24];

/**
 * How long a block waits before it grows.
 *
 * Blocks arrive in the order they happened, so a stagger by index fills the day
 * in from morning to night rather than all at once. Capped, because a busy day
 * can run to fifty blocks and nobody waits a second and a half to watch a
 * ribbon assemble.
 */
function growDelay(index: number): string {
  return `${Math.min(index * 18, 600)}ms`;
}

function fill(slot: number): string {
  return RAMP[slot] ?? LEFTOVER;
}

export function DayTimeline({
  blocks,
  languages,
  hasActivity,
  label,
}: {
  blocks: DayBlock[];
  languages: { name: string; slot: number; time: string }[];
  hasActivity: boolean;
  /** The track's accessible name, since the blocks themselves carry no text. */
  label: string;
}) {
  const [detail, setDetail] = useState<string | null>(null);

  /*
    The track holds the trigger, not the blocks. Their entrance is a sweep
    across the day and it only reads as one sweep if they share a clock -- an
    observer each would start them in whatever order the scroll revealed them.
  */
  const trackRef = useReveal<HTMLDivElement>(undefined, 0.15);

  return (
    <div onMouseLeave={() => setDetail(null)}>
      <div
        ref={trackRef}
        className="relative h-10 sm:h-12 overflow-hidden rounded-md bg-zinc-800/50"
        role="img"
        aria-label={label}
      >
        {/* Six-hour rules, so a block can be read against a time without the axis. */}
        {HOURS.slice(1, -1).map((hour) => (
          <span
            key={hour}
            className="absolute top-0 bottom-0 w-px bg-zinc-700/70"
            style={{ left: `${(hour / 24) * 100}%` }}
          />
        ))}

        {blocks.map((block, index) => (
          <span
            /*
              Keyed by position, which is the honest key for this list: it is
              rendered once from a server payload and never sorted, filtered or
              added to, so an index cannot come to mean a different block.

              What it replaced was the start time and the language, and those
              are not unique. Switching from one file to another and back inside
              a few seconds gives two slices of the same language either side of
              a third, too close together to merge and too close together to
              tell apart once the start is rounded to a fraction of the day.
              React rendered one of the pair and dropped the other.
            */
            key={index}
            className={`timeline-block absolute top-1 bottom-1 cursor-help rounded-xs ${fill(block.slot)}`}
            style={{
              left: `${block.start * 100}%`,
              width: `${block.width * 100}%`,
              animationDelay: growDelay(index),
            }}
            // A `title` as well as the hover line: hover alone is unreachable
            // on touch, which is most of the readers this page has.
            title={block.detail}
            onMouseEnter={() => setDetail(block.detail)}
          />
        ))}

        {!hasActivity && (
          <span className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400 sm:text-sm">
            Nothing logged today yet
          </span>
        )}
      </div>

      {/* The axis. Its ends are pulled inside the track rather than hanging off it. */}
      <div className="relative mt-1 h-4">
        {HOURS.map((hour) => (
          <span
            key={hour}
            className={`absolute text-xs text-zinc-400 ${
              hour === 0 ? "" : hour === 24 ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: `${(hour / 24) * 100}%` }}
          >
            {/*
              24:00 at the right end rather than 00:00. Both ends are midnight,
              and printing the same label twice reads as an axis that failed to
              advance rather than one that ran a whole day.
            */}
            {String(hour).padStart(2, "0")}:00
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
          {languages.map((language) => (
            <li key={language.name} className="flex items-center gap-1.5" title={language.time}>
              <span className={`h-2.5 w-2.5 rounded-xs ${fill(language.slot)}`} />
              <span className="text-zinc-400">{language.name}</span>
            </li>
          ))}
        </ul>

        {/*
          The line keeps its height whether or not anything is hovered, so the
          legend beside it does not move as the pointer crosses the ribbon.
        */}
        <div
          className={`h-6 flex-shrink text-xs text-zinc-400 transition-opacity duration-200 sm:text-right sm:text-sm ${
            detail ? "opacity-100" : "opacity-0"
          }`}
          // Politely, so a screen reader is not interrupted by every block the
          // pointer passes over.
          aria-live="polite"
        >
          {detail ?? "Hover a block to see what it was"}
        </div>
      </div>
    </div>
  );
}
