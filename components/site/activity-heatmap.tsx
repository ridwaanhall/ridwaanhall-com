"use client";

import { useState } from "react";

import { useReveal } from "@/components/site/use-reveal";
import { COLUMNS, monthLabels } from "@/lib/utils/contribution-months";
import type { CalendarMonth, CalendarWeek } from "@/lib/utils/coding-calendar";

/**
 * A year of days as a grid, drawn twice on the dashboard: GitHub's
 * contributions, and WakaTime's coding hours.
 *
 * `githubContributions.js` built this in the browser with `document.createElement`
 * -- 295 lines, one `mouseenter`/`mouseleave` listener per cell across ~370
 * cells, and a re-render on resize. Here the grid is markup, the hover detail is
 * one piece of state on the container, and the cell size is a media query rather
 * than a `window.innerWidth` read.
 *
 * **`tone` and `unit` are strings, not functions.** The obvious shape for this
 * would be a `describe(cell)` callback and a palette object passed in by each
 * caller -- but both callers are server components, and a function prop cannot
 * cross that boundary. Naming the two variants keeps the props serialisable,
 * and it keeps every colour class written out in full where Tailwind's scan can
 * see it: an interpolated `bg-${tone}-600/50` produces no rule at all.
 *
 * The detail line keeps its reserved height whether or not anything is hovered,
 * so the legend below it does not move.
 */

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type Tone = "green" | "teal";
type Unit = "contributions" | "hours";

/**
 * The four filled steps of each ramp, low to high, plus the hairline the empty
 * cells and the hover state borrow.
 *
 * Written out per tone rather than composed, for the reason in the note above.
 */
const TONES: Record<
  Tone,
  { levels: [string, string, string, string]; ring: string; hover: string }
> = {
  green: {
    levels: ["bg-green-600/20", "bg-green-600/50", "bg-green-600/90", "bg-green-500"],
    ring: "border-green-400/30",
    hover: "hover:border hover:border-green-400/30",
  },
  teal: {
    levels: ["bg-teal-600/20", "bg-teal-600/50", "bg-teal-500/90", "bg-cyan-400"],
    ring: "border-cyan-400/30",
    hover: "hover:border hover:border-cyan-400/30",
  },
};

/**
 * Where each band begins.
 *
 * Contributions keep the thresholds the calendar has always advertised. Hours
 * are in seconds, and the cuts are one, three and six hours -- a scale a reader
 * can hold in their head, and one that lands either side of a daily average of
 * about two and three quarter hours. Deriving them from the data instead would
 * make every band mean something different each time the year moved.
 */
const THRESHOLDS: Record<Unit, [number, number, number]> = {
  contributions: [5, 11, 20],
  hours: [3600, 3 * 3600, 6 * 3600],
};

type Cell = { date: string; value: number; future: boolean };

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

export function ActivityHeatmap({
  weeks,
  months,
  tone = "green",
  unit = "contributions",
  label,
}: {
  weeks: CalendarWeek[];
  months: CalendarMonth[];
  tone?: Tone;
  unit?: Unit;
  /** The grid's accessible name, since the cells themselves carry no text. */
  label?: string;
}) {
  const [detail, setDetail] = useState<string | null>(null);

  /*
    The grid holds the trigger, not the cells. Its entrance is a stagger across
    371 of them, and it only reads as one arrival if they share a clock -- an
    observer each would start them in whatever order the scroll happened to
    reveal them in.

    That it waits at all is the fix. Both calendars sit well below the fold on
    every viewport, so the whole 1.2s entrance used to run at mount, finish
    unseen, and leave a grid that was simply already there by the time anyone
    scrolled to it.
  */
  const gridRef = useReveal<HTMLDivElement>(undefined, 0.05);

  const today = new Date().toISOString().slice(0, 10);
  const palette = TONES[tone];

  // Both sources return a partial first and last week; the grid is 7 rows deep,
  // so each week is placed by its real weekday rather than by array position.
  const columns: (Cell | null)[][] = weeks.map((week) => {
    const column: (Cell | null)[] = Array.from({ length: 7 }, () => null);
    for (const day of week.days) {
      const weekday = new Date(`${day.date}T00:00:00Z`).getUTCDay();
      column[weekday] = { date: day.date, value: day.value, future: day.date > today };
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
          ref={gridRef}
          className="grid grid-cols-[repeat(53,minmax(0,1fr))] grid-rows-[repeat(7,minmax(0,1fr))] gap-px sm:gap-[1.5px]"
          onMouseLeave={() => setDetail(null)}
          role="img"
          aria-label={label ?? "Activity calendar for the past year"}
        >
          {columns.map((column, weekIndex) =>
            column.map((cell, dayIndex) => (
              <div
                key={`${weekIndex}-${dayIndex}`}
                style={
                  {
                    gridRow: dayIndex + 1,
                    gridColumn: weekIndex + 1,
                    animationDelay: fadeDelay(weekIndex, dayIndex),
                    // A property rather than a utility class, because the
                    // entrance has to land on this value too -- see the note
                    // beside `contrib-in` in styles/theme-motion.css.
                    ...(dimmed(cell, today) ? { "--cell-opacity": 0.3 } : null),
                  } as React.CSSProperties
                }
                className={cellClass(cell, palette, unit)}
                onMouseEnter={() => setDetail(cell ? describe(cell, unit) : null)}
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
                  `contrib-empty border ${palette.ring}`,
                  `${palette.levels[0]} border ${palette.ring}`,
                  palette.levels[1],
                  palette.levels[2],
                  palette.levels[3],
                ].map((className, step) => (
                  <div
                    key={step}
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

/**
 * A day drawn at 30%: outside the range the grid covers, or still to come.
 *
 * Read here rather than as an `opacity-30` class because an animation outranks
 * a class and holds its last frame, which is how the dimming came to be dead
 * on every one of these cells.
 */
function dimmed(cell: Cell | null, today: string): boolean {
  return !cell || cell.date > today;
}

function cellClass(cell: Cell | null, palette: (typeof TONES)[Tone], unit: Unit): string {
  // 8px below `sm`, 12px at `sm`, 14px from `md` -- the two size sets
  // githubContributions.js chose between with a `window.innerWidth` read,
  // expressed as one CSS-only ladder that lands on the same values.
  const base = `contrib-cell w-2 h-2 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 rounded-xs ${palette.hover}`;
  if (!cell) return base;
  if (cell.future) return `${base} contrib-empty`;

  const [low, mid, high] = THRESHOLDS[unit];
  if (cell.value === 0) return `${base} contrib-empty`;
  if (cell.value <= low) return `${base} ${palette.levels[0]}`;
  if (cell.value <= mid) return `${base} ${palette.levels[1]}`;
  if (cell.value <= high) return `${base} ${palette.levels[2]}`;
  return `${base} ${palette.levels[3]}`;
}

/** "3 hrs 20 mins", "45 mins", "0 mins" -- the hover line's own scale. */
function readableHours(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours > 0) return minutes > 0 ? `${hours} hrs ${minutes} mins` : `${hours} hrs`;
  return `${minutes} mins`;
}

function describe(cell: Cell, unit: Unit): string {
  const date = new Date(`${cell.date}T00:00:00Z`);
  const dayName = DAY_NAMES[date.getUTCDay()];
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

  if (cell.future) return `Future date: ${dayName}, ${formatted}`;

  let text: string;
  if (unit === "hours") {
    text = cell.value === 0 ? "No coding" : readableHours(cell.value);
  } else {
    text =
      cell.value === 0
        ? "No contributions"
        : `${cell.value} contribution${cell.value === 1 ? "" : "s"}`;
  }
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
  weeks: CalendarWeek[];
  months: CalendarMonth[];
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
