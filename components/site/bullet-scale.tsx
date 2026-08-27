"use client";

import { useState } from "react";

import { CountUp } from "@/components/site/dashboard-sections";
import { useReveal } from "@/components/site/use-reveal";

/**
 * A daily average against everybody else's.
 *
 * The only figure WakaTime publishes with a comparison attached, and the only
 * one on this page a reader can size without already knowing what a normal
 * amount of coding is. The bar is this account; the two ticks are the community
 * it is being read against.
 *
 * **The axis does not reach the community maximum.** Somebody logs seventeen
 * and a half hours a day, and a track long enough to hold that leaves all three
 * figures here inside its first sixth, indistinguishable from each other and
 * from zero. `bulletAxis` ends the scale a quarter above the largest figure
 * drawn and the footnote names the maximum in words instead, so the choice is
 * stated rather than hidden.
 *
 * The two ticks are labelled underneath rather than above their own positions.
 * At this account's numbers the median and the mean sit eleven percent apart,
 * which at 375px is two labels occupying the same forty pixels.
 */
export function BulletScale({
  youPercent,
  youLabel,
  medianPercent,
  medianLabel,
  averagePercent,
  averageLabel,
  axisLabel,
  multiple,
  maxLabel,
}: {
  /** Every percentage is a share of the axis, 0-100. */
  youPercent: number;
  youLabel: string;
  medianPercent: number;
  medianLabel: string;
  averagePercent: number;
  averageLabel: string;
  axisLabel: string;
  /** Times the median, which is the typical one of them rather than the mean. */
  multiple: number;
  maxLabel: string;
}) {
  const [counting, setCounting] = useState(false);
  const ref = useReveal<HTMLDivElement>(() => setCounting(true));

  return (
    <div ref={ref} className="mt-3 rounded-lg border border-violet-500/50 p-3 sm:mt-4 sm:rounded-xl sm:p-4">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm">
        <span className="font-medium">
          Your daily average <span className="text-zinc-400">{youLabel}</span>
        </span>
        <span className="font-medium">
          <span className="text-zinc-400">vs the median</span>{" "}
          <CountUp value={multiple} run={counting} />
          {/* The unit rides outside CountUp, which counts the number alone. */}
          <span aria-hidden="true">x</span>
        </span>
      </div>

      <div className="relative h-2.5 rounded-full bg-zinc-800/50">
        <span
          className="percent-bar absolute top-0 left-0 h-2.5 rounded-full bg-gradient-to-r from-violet-400 to-purple-600"
          style={{ "--bar-width": `${youPercent}%` } as React.CSSProperties}
        />

        {/*
          The ticks stand clear of the track top and bottom so they read against
          the fill as well as against the empty part of it.
        */}
        <span
          className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-zinc-300"
          style={{ left: `${medianPercent}%` }}
          title={`The median WakaTime user codes ${medianLabel} a day`}
        />
        <span
          className="absolute -top-1 h-4.5 w-0.5 rounded-full bg-zinc-500"
          style={{ left: `${averagePercent}%` }}
          title={`The average across every WakaTime user is ${averageLabel} a day`}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 rounded-full bg-zinc-300" />
          Median {medianLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-0.5 rounded-full bg-zinc-500" />
          Average {averageLabel}
        </span>
      </div>

      <p className="mt-2 text-xs text-zinc-400">
        The scale ends at {axisLabel} a day. The busiest WakaTime user on record logs {maxLabel}.
      </p>
    </div>
  );
}
