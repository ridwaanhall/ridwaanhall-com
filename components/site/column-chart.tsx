"use client";

import { useState } from "react";

import { useReveal } from "@/components/site/use-reveal";
import type { RhythmDay } from "@/lib/data/wakatime-rhythm";

/**
 * A year of hours, folded onto the seven days of the week.
 *
 * **The columns are stacked because the totals are flat.** An average Monday
 * and an average Wednesday are thirty-seven minutes apart on a two-hour day,
 * which drawn as plain columns is seven near-identical bars saying nothing. The
 * variation lives in what the hours were spent on -- AI Coding is twenty
 * minutes on one of those days and half an hour on the other -- so the split is
 * the chart and the height is the context.
 *
 * **The axis starts at zero.** Beginning it at the shortest day would turn that
 * same twelve percent spread into a chart where Sunday towers over Wednesday,
 * which is a picture of a fact that is not true.
 */

/**
 * One colour per category band, and one for everything below the ramp.
 *
 * Written out rather than built from the slot number: Tailwind emits a class
 * only where it can see it, so an interpolated fill produces no rule and the
 * columns come out empty. Every family here is remapped under the light
 * palette; several of their neighbours are not.
 */
const RAMP = ["bg-violet-500", "bg-purple-400", "bg-blue-400", "bg-cyan-400"] as const;

/** Categories past the end of the ramp share this. */
const LEFTOVER = "bg-zinc-600";

function fill(slot: number): string {
  return RAMP[slot] ?? LEFTOVER;
}

export function ColumnChart({
  days,
  categories,
  peakLabel,
  halfLabel,
  label,
}: {
  days: RhythmDay[];
  categories: { name: string; slot: number }[];
  /** The top of the axis and its midpoint, already written out. */
  peakLabel: string;
  halfLabel: string;
  label: string;
}) {
  const [detail, setDetail] = useState<string | null>(null);

  // One trigger on the plot rather than one per column, so all seven rise
  // together instead of in whatever order the scroll revealed them.
  const plotRef = useReveal<HTMLDivElement>(undefined, 0.15);

  return (
    <div onMouseLeave={() => setDetail(null)}>
      <div className="flex gap-2">
        {/*
          The scale, in its own gutter. Its labels are pulled onto the rules
          they name rather than sitting above them, which is what keeps the
          topmost one from hanging off the panel.
        */}
        <div className="relative h-40 w-14 shrink-0 sm:h-48 sm:w-16">
          <span className="absolute right-0 top-0 -translate-y-1/2 text-xs text-zinc-400">
            {peakLabel}
          </span>
          <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-zinc-400">
            {halfLabel}
          </span>
          <span className="absolute right-0 top-full -translate-y-1/2 text-xs text-zinc-400">0</span>
        </div>

        <div
          ref={plotRef}
          className="relative h-40 flex-1 sm:h-48"
          role="img"
          aria-label={label}
        >
          <span className="absolute inset-x-0 top-0 h-px bg-zinc-800" />
          <span className="absolute inset-x-0 top-1/2 h-px bg-zinc-800" />
          <span className="absolute inset-x-0 bottom-0 h-px bg-zinc-700" />

          <div className="absolute inset-0 grid grid-cols-7 items-end gap-1 sm:gap-2">
            {days.map((day) => (
              <div
                key={day.name}
                className="column-grow flex cursor-help flex-col-reverse overflow-hidden rounded-t-sm"
                style={{ height: `${day.height}%` }}
                title={day.detail}
                onMouseEnter={() => setDetail(day.detail)}
              >
                {/*
                  Reversed, so the first segment is the one at the baseline.
                  The bands arrive in ramp order, which puts the largest at the
                  bottom of every column and gives the seven a shared footing to
                  be compared against.
                */}
                {day.segments.map((segment) => (
                  <span
                    key={segment.name}
                    className={fill(segment.slot)}
                    style={{ height: `${segment.percent}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-2">
        <div className="w-14 shrink-0 sm:w-16" />
        <div className="grid flex-1 grid-cols-7 gap-1 text-center text-xs text-zinc-400 sm:gap-2">
          {days.map((day) => (
            <span key={day.name}>{day.short}</span>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm">
          {categories.map((category) => (
            <li key={category.name} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-xs ${fill(category.slot)}`} />
              <span className="text-zinc-400">{category.name}</span>
            </li>
          ))}
        </ul>

        {/* Reserved height, so the legend beside it holds still on hover. */}
        <div
          className={`h-6 flex-shrink text-xs text-zinc-400 transition-opacity duration-200 sm:text-right sm:text-sm ${
            detail ? "opacity-100" : "opacity-0"
          }`}
          aria-live="polite"
        >
          {detail ?? "Hover a day to see its split"}
        </div>
      </div>
    </div>
  );
}
