"use client";

import { useState } from "react";

import type { ContributionWeek } from "@/lib/data/github";

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
          <MonthLabels months={months} />
        </div>

        <div
          className="grid grid-cols-53 gap-0.5 sm:gap-1"
          onMouseLeave={() => setDetail(null)}
          role="img"
          aria-label="GitHub contribution calendar for the past year"
        >
          {columns.map((column, weekIndex) =>
            column.map((cell, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                style={{ gridRow: dayIndex + 1, gridColumn: weekIndex + 1 }}
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
            className={`text-sm text-zinc-400 h-6 transition-opacity duration-200 flex-shrink ${
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
  const base =
    "w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 lg:w-3.5 lg:h-3.5 rounded-xs hover:border hover:border-green-400/30";
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
 * Positioned from GitHub's own `months` array, which gives each month's
 * `totalWeeks` -- so the running sum of those widths *is* the column each month
 * starts in, with no date arithmetic and no drift against the grid below.
 *
 * A month is labelled only when it spans at least two columns, matching
 * githubContributions.js. The first and last months of a rolling year are
 * usually partial, and labelling a single column crowds its neighbour.
 */
function MonthLabels({
  months,
}: {
  months: { firstDay: string; name: string; totalWeeks: number }[];
}) {
  // Each month's column is the sum of the widths before it. Written as a pure
  // expression rather than a running counter: reassigning a variable during
  // render is not allowed, and with thirteen months the repeated sum costs
  // nothing.
  const placed = months.map((month, index) => ({
    ...month,
    column: months.slice(0, index).reduce((sum, earlier) => sum + earlier.totalWeeks, 0),
  }));

  return (
    <>
      {placed
        .filter((month) => month.totalWeeks >= 2)
        .map((month) => (
          <div
            key={month.firstDay}
            className="absolute text-xs text-zinc-400 font-medium"
            style={{ left: `${(month.column / 53) * 100}%` }}
          >
            {month.name}
          </div>
        ))}
    </>
  );
}
