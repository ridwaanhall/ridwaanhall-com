/**
 * Where each month's name sits above the contribution calendar.
 *
 * Pure arithmetic over dates, deliberately kept out of the component. There is
 * no DOM in it, `npm test` collects only `lib/**` , and the rule below is the
 * kind that looks obviously right and is wrong for one week in four -- exactly
 * the sort this repo covers offline rather than by loading a page and squinting.
 *
 * **Nothing here may import from `lib/data/github.ts`.** `ContributionHeatmap`
 * is a client component, and a runtime import would pull the database pool into
 * the browser bundle behind it. The week and month shapes are re-declared as
 * structural parameters for that reason.
 */

/** Weeks across the calendar. GitHub returns 53 for a full year. */
export const COLUMNS = 53;

/**
 * How many columns a label covers.
 *
 * Measured, not guessed: the widest rendered month is 24px, against a 12.26px
 * column at the calendar's narrowest (`min-w-[650px]`). Two columns is the room
 * a name actually needs.
 */
export const LABEL_COLUMNS = 2;

/**
 * The closest two labels may sit without touching.
 *
 * Real months land 3 to 5 columns apart -- a month is four or five weeks, and
 * the Sunday/Monday shift below can take one back -- so 3 is the natural floor
 * and anything under it is a partial month crowding its neighbour. Three
 * columns is 36.8px at the narrow end against a 24px name.
 */
export const MIN_LABEL_GAP = 3;

type Week = { days: { date: string }[] };
type Month = { firstDay: string; name: string };

export type MonthLabel = { key: string; name: string; column: number };

/**
 * Which months get a name, and in which column.
 *
 * The base rule is not the obvious one:
 *
 *  1. A month's base column is the first column containing any of its days.
 *  2. **Unless its first visible day falls on a Sunday or Monday, the label
 *     shifts one column right.** A month beginning on a Wednesday has only a
 *     sliver of its first column, so the name reads better above the first
 *     column it actually fills.
 *  3. The first and last labels never take that shift -- there is no column
 *     before the first, and shifting the last pushes it toward the edge.
 *  4. A month is named only if it occupies at least two columns.
 *
 * Summing GitHub's own `months[].totalWeeks` is a tempting shortcut and a wrong
 * one: `totalWeeks` counts every week *containing* a day of the month, so a
 * week spanning a boundary is counted by both neighbours and the running total
 * drifts one column further right with each shared week.
 *
 * Then the part this function was extracted for. Those rules place a label
 * relative to its own month and never look at the one before it, so a calendar
 * opening mid-month puts two names on top of each other: a window starting 24
 * August gives August 8 days over 2 columns -- enough to clear rule 4 -- and
 * September's base column is the very next one. The two names overlapped by
 * 7-11px. Sweeping every end-date in a year finds 98 such pairs.
 *
 * So a second pass walks left to right and pushes any label that came out too
 * close to its predecessor. That is a real trade: a pushed label no longer
 * stands above its month's first column. It is the lesser fault -- two names
 * printed over each other are unreadable, where a name a fortnight to the right
 * still reads and still points into its own month.
 */
export function monthLabels(weeks: Week[], months: Month[]): MonthLabel[] {
  // For each `YYYY-MM`: the columns it appears in, and the weekday of the
  // earliest day seen.
  const seen = new Map<string, { columns: Set<number>; weekday: number }>();

  weeks.forEach((week, index) => {
    for (const day of week.days) {
      const key = day.date.slice(0, 7);
      const existing = seen.get(key);
      if (existing) {
        existing.columns.add(index);
      } else {
        seen.set(key, {
          columns: new Set([index]),
          weekday: new Date(`${day.date}T00:00:00Z`).getUTCDay(),
        });
      }
    }
  });

  const candidates = months
    .map((month) => ({ month, info: seen.get(month.firstDay.slice(0, 7)) }))
    .filter((entry) => entry.info !== undefined && entry.info.columns.size >= 2)
    .map((entry) => ({
      key: entry.month.firstDay,
      name: entry.month.name,
      base: Math.min(...entry.info!.columns),
      weekday: entry.info!.weekday,
    }));

  const placed: MonthLabel[] = [];
  let previous = -Infinity;

  candidates.forEach((candidate, index) => {
    const isEdge = index === 0 || index === candidates.length - 1;
    // Sunday (0) or Monday (1) means the month already fills its first column
    // well enough to be named there.
    const startsEarlyInWeek = candidate.weekday === 0 || candidate.weekday === 1;
    const shifted = !isEdge && !startsEarlyInWeek ? candidate.base + 1 : candidate.base;

    const column = Math.max(shifted, previous + MIN_LABEL_GAP);

    // A label with no room left before the right edge is dropped rather than
    // allowed to overhang it. Real data never reaches this -- the sweep across
    // a year of end-dates drops nothing -- so it is here to keep a later change
    // from pushing a name off the end without anyone noticing.
    if (column > COLUMNS - LABEL_COLUMNS) return;

    placed.push({ key: candidate.key, name: candidate.name, column });
    previous = column;
  });

  return placed;
}
