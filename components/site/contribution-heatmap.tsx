"use client";

import { useState } from "react";

import type { ContributionWeek } from "@/lib/data/github";
import { COLUMNS, monthLabels } from "@/lib/utils/contribution-months";

/**
 * The GitHub contribution calendar.
 *
 * `githubContributions.js` built this grid in the browser with
 * `document.createElement` -- 295 lines, one `mouseenter`/`mouseleave` listener
 * per cell across ~370 cells, and a re-render on resize. Here the grid is
 * markup, the hover detail is one piece of state on the container, and the cell
 * size is a media query rather than a `window.innerWidth` read.
 *
 * The detail line keeps its reserved height whether or not anything is
 * hovered, so the legend below it does not move.
 */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** The five buckets the legend advertises. */
function levelClass(count: number): string {
  if (count === 0) return "contrib-empty";
  if (count <= 5) return "bg-green-600/20";
  if (count <= 11) return "bg-green-600/50";
  if (count <= 20) return "bg-green-600/90";
  return "bg-green-500";
}

type Cell = { date: string; count: number; future: boolean };

/**
 * How long a cell waits before it fades in.
 *
 * Scattered rather than swept, so the year arrives all over at once instead of
 * wiping left to right — but computed from the cell's own position, not
 * `Math.random()`. The grid is rendered on the server first, and a random
 * number would differ between the two renders and hydrate as a mismatch on
 * three hundred and seventy nodes.
 *
 * The two multipliers are coprime with the modulus, which is what stops the
 * pattern falling into visible diagonal bands.
 */
function fadeDelay(weekIndex: number, dayIndex: number): string {
  return `${((weekIndex * 31 + dayIndex * 17) % 37) * 18}ms`;
}

export function ContributionHeatmap({
  weeks,
  months,
}: {
  weeks: ContributionWeek[];
  months: { firstDay: string; name: string; totalWeeks: number }[];
}) {
  const [detail, setDetail] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // GitHub returns a partial first and last week; the grid is 7 rows deep, so
  // each week is placed by its real weekday rather than by array position.
  const columns: (Cell | null)[][] = weeks.map((week) => {
    const column: (Cell | null)[] = Array.from({ length: 7 }, () => null);
    for (const day of week.days) {
      const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      column[weekday] = { date: day.date, count: day.count, future: day.date > today };
    }
    return column;
  });

  return (
    <div className="overflow-x-auto mb-0 mt-4 custom-scroll">
      <div className="min-w-[650px] sm:min-w-max">
        <div className="relative h-6">
          <MonthLabels weeks={weeks} months={months} />
        </div>

        {/*
          The template and gap are matched to the live grid exactly, and they
          are what decide whether the calendar fits.

          `grid-cols-53` is not a Tailwind class -- the defaults stop at 12 --
          so without the arbitrary value the columns size themselves to their
          content. That, plus a `gap-0.5 sm:gap-1` (2px / 4px) instead of the
          1px / 1.5px the original set inline, made the grid 950px wide against
          the 840px it has to work with, and the whole calendar scrolled
          sideways on desktop. With `minmax(0, 1fr)` the 53 columns share the
          available width instead.
        */}
        <div
          className="grid grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-[repeat(7,minmax(0,1fr))] gap-px sm:gap-[1.5px]"
          onMouseLeave={() => setDetail(null)}
          role="img"
          aria-label="GitHub contribution calendar for the past year"
        >
          {columns.map((column, weekIndex) =>
            column.map((cell, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                style={{
                  gridRow: dayIndex + 1,
                  gridColumn: weekIndex + 1,
                  animationDelay: fadeDelay(weekIndex, dayIndex),
                }}
                className={cellClass(cell)}
                onMouseEnter={() => setDetail(cell ? describe(cell) : null)}
              />
            )),
          )}
        </div>

        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div className="flex items-center text-xs sm:text-sm flex-shrink-0">
            <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm bg-transparent py-1 rounded-lg whitespace-nowrap">
              <span className="font-medium text-zinc-400">Less</span>
              <div className="flex space-x-0.5 sm:space-x-1">
                {[
                  "contrib-empty border border-green-400/30",
                  "bg-green-600/20 border border-green-400/30",
                  "bg-green-600/50",
                  "bg-green-600/90",
                  "bg-green-500",
                ].map((className) => (
                  <div
                    key={className}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-xs ${className}`}
                  />
                ))}
              </div>
              <span className="font-medium text-zinc-400">More</span>
            </div>
          </div>

          <div
            className={`text-xs sm:text-sm text-zinc-400 h-6 transition-opacity duration-200 flex-shrink ${
              detail ? "opacity-100" : "opacity-0"
            }`}
            // Announced politely so a screen reader is not interrupted by every
            // cell the pointer crosses.
            aria-live="polite"
          >
            {detail ?? "Hover over a day to see details"}
          </div>
        </div>
      </div>
    </div>
  );
}

function cellClass(cell: Cell | null): string {
  // 8px below `sm`, 12px at `sm`, 14px from `md` -- the two size sets
  // githubContributions.js chose between with a `window.innerWidth` read,
  // expressed as one CSS-only ladder that lands on the same values.
  const base =
    "contrib-cell w-2 h-2 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-xs hover:border hover:border-green-400/30";
  if (!cell) return `${base} opacity-30`;
  if (cell.future) return `${base} contrib-empty opacity-30`;
  return `${base} ${levelClass(cell.count)}`;
}

function describe(cell: Cell): string {
  const date = new Date(`${cell.date}T00:00:00Z`);
  const dayName = DAY_NAMES[date.getUTCDay()];
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

  if (cell.future) return `Future date: ${dayName}, ${formatted}`;
  const text =
    cell.count === 0
      ? "No contributions"
      : `${cell.count} contribution${cell.count === 1 ? "" : "s"}`;
  return `${text} on ${dayName}, ${formatted}`;
}

/**
 * Month names above the grid.
 *
 * The placement rule lives in `lib/utils/contribution-months.ts` -- it is date
 * arithmetic with no DOM in it, and it is covered there against every end-date
 * a year offers, which is the only way to catch the overlap it exists to
 * prevent. This is the part that turns a column into a position.
 */
function MonthLabels({
  weeks,
  months,
}: {
  weeks: ContributionWeek[];
  months: { firstDay: string; name: string; totalWeeks: number }[];
}) {
  return (
    <>
      {monthLabels(weeks, months).map((month) => (
        <div
          key={month.key}
          className="absolute text-xs text-zinc-400 font-medium"
          style={{ left: `${(month.column / COLUMNS) * 100}%` }}
        >
          {month.name}
        </div>
      ))}
    </>
  );
}
