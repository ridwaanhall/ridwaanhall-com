/**
 * A flat year of days, arranged into the 53 columns a heatmap draws.
 *
 * GitHub hands its calendar over already cut into weeks, with the partial first
 * and last ones the grid expects. WakaTime hands over 365 consecutive days and
 * nothing else, so the cutting has to happen somewhere -- and it is date
 * arithmetic with no DOM in it, which is the same reason
 * `contribution-months.ts` sits beside this rather than inside the component.
 *
 * **Nothing here may import from `lib/data/`.** The heatmap is a client
 * component; a runtime import would pull a fetch path, and behind it the
 * database pool, into the browser bundle. The shapes are structural for that
 * reason, exactly as the month labels are.
 *
 * The grid is always 53 columns wide and always ends on the week containing the
 * last day, so the calendar is right-aligned to today the way GitHub's is. Days
 * that fall outside the data -- before the first, after the last -- are simply
 * absent, and the component draws those cells as empty.
 */

/** One day. `value` is seconds for WakaTime, a contribution count for GitHub. */
export type CalendarDay = { date: string; value: number };
export type CalendarWeek = { firstDay: string; days: CalendarDay[] };
export type CalendarMonth = { firstDay: string; name: string };

/** Columns in the grid. Matches `COLUMNS` in `contribution-months.ts`. */
const WEEKS = 53;

function shiftDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** The Sunday on or before a date -- the column a week is filed under. */
function sundayOf(isoDate: string): string {
  return shiftDays(isoDate, -new Date(`${isoDate}T00:00:00Z`).getUTCDay());
}

/** "Aug". Pinned to UTC so a month does not slide for a reader elsewhere. */
function monthName(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

export function buildCalendar(days: CalendarDay[]): {
  weeks: CalendarWeek[];
  months: CalendarMonth[];
} {
  if (days.length === 0) return { weeks: [], months: [] };

  const byDate = new Map(days.map((day) => [day.date, day.value]));
  const dates = [...byDate.keys()].sort();
  const last = dates[dates.length - 1];

  /*
   * 52 weeks back from the last day's own week, which gives 53 columns
   * inclusive. Counting 364 days back and then finding that day's Sunday is the
   * same arithmetic done in the order that cannot go wrong: taking the Sunday
   * first and subtracting 52 weeks lands on the right column only when the last
   * day is itself a Sunday.
   */
  const firstColumn = sundayOf(shiftDays(sundayOf(last), -7 * (WEEKS - 1)));

  const weeks: CalendarWeek[] = [];
  for (let column = 0; column < WEEKS; column++) {
    const firstDay = shiftDays(firstColumn, column * 7);
    const week: CalendarDay[] = [];
    for (let weekday = 0; weekday < 7; weekday++) {
      const date = shiftDays(firstDay, weekday);
      const value = byDate.get(date);
      // Absent rather than zero: a day before the range began is not a day
      // with no coding on it, and the grid draws the two differently.
      if (value !== undefined) week.push({ date, value });
    }
    weeks.push({ firstDay, days: week });
  }

  /*
   * One entry per month that actually has a day in the grid, in order. The
   * label placement rules in `contribution-months.ts` take it from here --
   * including which of these are wide enough to be worth naming.
   */
  const months: CalendarMonth[] = [];
  for (const week of weeks) {
    for (const day of week.days) {
      const key = day.date.slice(0, 7);
      if (months[months.length - 1]?.firstDay.slice(0, 7) === key) continue;
      months.push({ firstDay: day.date, name: monthName(day.date) });
    }
  }

  return { weeks, months };
}
