import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCalendar, type CalendarDay } from "./coding-calendar";
import { monthLabels } from "./contribution-months";

/** A run of consecutive days ending on `end`, each carrying the same value. */
function run(end: string, length: number, value = 3600): CalendarDay[] {
  const days: CalendarDay[] = [];
  for (let back = length - 1; back >= 0; back--) {
    const date = new Date(`${end}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - back);
    days.push({ date: date.toISOString().slice(0, 10), value });
  }
  return days;
}

describe("buildCalendar", () => {
  it("gives the grid exactly the 53 columns it draws", () => {
    const { weeks } = buildCalendar(run("2026-08-26", 365));
    assert.equal(weeks.length, 53);
  });

  it("starts every column on a Sunday", () => {
    const { weeks } = buildCalendar(run("2026-08-26", 365));
    for (const week of weeks) {
      assert.equal(new Date(`${week.firstDay}T00:00:00Z`).getUTCDay(), 0, week.firstDay);
    }
  });

  /*
   * The calendar is right-aligned to the last day, as GitHub's is: the final
   * column is the week that day falls in, however far through it that is.
   */
  it("ends on the week holding the last day", () => {
    const { weeks } = buildCalendar(run("2026-08-26", 365));
    const final = weeks[weeks.length - 1];
    const dates = final.days.map((day) => day.date);
    assert.ok(dates.includes("2026-08-26"), dates.join(","));
    assert.equal(final.days[final.days.length - 1].date, "2026-08-26");
  });

  /*
   * The case the sundayOf/shift order exists for. Walking back 52 weeks from a
   * Sunday and walking back 364 days land on different columns unless the last
   * day is itself a Sunday, and the off-by-one only shows up on six days in
   * seven.
   */
  it("holds at 53 columns whichever weekday the year ends on", () => {
    for (let offset = 0; offset < 7; offset++) {
      const end = new Date("2026-08-26T00:00:00Z");
      end.setUTCDate(end.getUTCDate() + offset);
      const iso = end.toISOString().slice(0, 10);
      const { weeks } = buildCalendar(run(iso, 365));
      assert.equal(weeks.length, 53, `ending ${iso}`);
      assert.ok(
        weeks[weeks.length - 1].days.some((day) => day.date === iso),
        `last column missing ${iso}`,
      );
    }
  });

  it("keeps every day it was given, and invents none", () => {
    const days = run("2026-08-26", 365);
    const { weeks } = buildCalendar(days);
    const placed = weeks.flatMap((week) => week.days.map((day) => day.date));
    assert.equal(placed.length, 365);
    assert.deepEqual(new Set(placed), new Set(days.map((day) => day.date)));
  });

  /*
   * A day outside the range is absent, not zero. The grid draws "no data" and
   * "no coding" differently, and a padded zero would read as the second.
   */
  it("leaves the cells before the range empty rather than filling them in", () => {
    const { weeks } = buildCalendar(run("2026-08-26", 365));
    const first = weeks[0];
    assert.ok(first.days.length < 7, `expected a partial first column, got ${first.days.length}`);
    assert.ok(first.days.every((day) => day.date >= "2025-08-27"));
  });

  it("survives a year that is not a year", () => {
    assert.deepEqual(buildCalendar([]), { weeks: [], months: [] });
    const { weeks } = buildCalendar(run("2026-08-26", 3));
    assert.equal(weeks.length, 53);
    assert.equal(weeks.flatMap((week) => week.days).length, 3);
  });
});

describe("buildCalendar months", () => {
  it("names each month once, in order, from its first day in the grid", () => {
    const { months } = buildCalendar(run("2026-08-26", 365));
    const keys = months.map((month) => month.firstDay.slice(0, 7));
    assert.deepEqual(new Set(keys).size, keys.length, "a month was listed twice");
    assert.deepEqual([...keys].sort(), keys, "months came out unsorted");
    assert.equal(months[0].name, "Aug");
    assert.equal(months[months.length - 1].name, "Aug");
  });

  /*
   * The whole reason this shape is produced rather than any other: it is what
   * `monthLabels` consumes. Wiring the two together here is what catches a
   * change to either that the component would only show as missing names.
   */
  it("feeds the label placement the shape it expects", () => {
    const { weeks, months } = buildCalendar(run("2026-08-26", 365));
    const labels = monthLabels(weeks, months);
    assert.ok(labels.length >= 11, `expected a year of names, got ${labels.length}`);
    const columns = labels.map((label) => label.column);
    assert.deepEqual([...columns].sort((a, b) => a - b), columns, "labels came out unordered");
    assert.ok(columns.every((column) => column >= 0 && column < 53));
  });
});
