/**
 * A year of days, as the squares and month labels a heatmap draws.
 *
 * Pure, and structural on purpose -- the shapes are restated rather than
 * imported from `lib/data/`, because the heatmap is a client component and a
 * runtime import there would pull a fetch path into the browser bundle.
 */

type Day = { date: string; value: number };
type Week = { firstDay: string; days: Day[] };
type Month = { firstDay: string; name: string };

export type HeatGrid = {
  cells: { level: number; tip: string }[];
  months: { column: number; name: string }[];
};

const LONG = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/**
 * Each week's seven squares, Sunday first. A day outside the data is an empty
 * square with nothing to say; a day with nothing logged says so.
 *
 * The level is the day's share of the busiest day, in four steps, with the
 * first step reached by any activity at all: a day of ten minutes is still a
 * day at it, and a linear ramp would draw it as nothing beside a fourteen-hour
 * peak.
 */
export function heatGrid(weeks: Week[], months: Month[], peak: number, describe: (value: number) => string): HeatGrid {
  const cells: HeatGrid["cells"] = [];
  weeks.forEach((week) => {
    const byWeekday = new Map(week.days.map((day) => [new Date(`${day.date}T00:00:00Z`).getUTCDay(), day]));
    for (let weekday = 0; weekday < 7; weekday++) {
      const day = byWeekday.get(weekday);
      if (!day) {
        cells.push({ level: 0, tip: "" });
        continue;
      }
      const share = peak > 0 ? day.value / peak : 0;
      const level = day.value <= 0 ? 0 : share > 0.75 ? 4 : share > 0.45 ? 3 : share > 0.2 ? 2 : 1;
      cells.push({ level, tip: `${LONG.format(new Date(`${day.date}T00:00:00Z`))} · ${day.value > 0 ? describe(day.value) : "nothing logged"}` });
    }
  });
  const columns = weeks.map((week) => week.firstDay);
  const labels = months
    .map((month) => ({ column: columns.findIndex((first) => first >= month.firstDay), name: month.name }))
    .filter((month) => month.column >= 0)
    // Two labels in neighbouring columns would print over each other.
    .filter((month, i, all) => i === 0 || month.column - all[i - 1].column >= 3);
  return { cells, months: labels };
}
