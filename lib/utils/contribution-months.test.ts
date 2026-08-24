import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COLUMNS,
  LABEL_COLUMNS,
  MIN_LABEL_GAP,
  monthLabels,
} from "./contribution-months";

/**
 * A calendar shaped like GitHub's: a year ending on `endDate`, padded back to
 * the Sunday that starts its first week, and the months that appear in it.
 *
 * Building the input rather than fixturing one response is the point. The
 * overlap this function exists to prevent depends entirely on which weekday the
 * window opens on, so the only honest test is every opening the year offers.
 */
function calendar(endDate: string) {
  const end = new Date(`${endDate}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 364);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());

  const weeks: { days: { date: string }[] }[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const days: { date: string }[] = [];
    for (let i = 0; i < 7 && cursor <= end; i++) {
      days.push({ date: cursor.toISOString().slice(0, 10) });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push({ days });
  }

  const months = new Map<string, { firstDay: string; name: string }>();
  for (const week of weeks) {
    for (const day of week.days) {
      const key = day.date.slice(0, 7);
      if (months.has(key)) continue;
      months.set(key, {
        firstDay: day.date,
        name: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "short" }).format(
          new Date(`${day.date}T00:00:00Z`),
        ),
      });
    }
  }

  return { weeks, months: [...months.values()] };
}

/** Every end-date in a year, so no opening weekday goes unexercised. */
function everyEndDate(): string[] {
  const dates: string[] = [];
  const cursor = new Date("2026-01-01T00:00:00Z");
  for (let i = 0; i < 366; i++) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

describe("monthLabels", () => {
  it("never lets two labels sit close enough to overlap", () => {
    // The bug this replaced: a window opening 24 August put "Aug" at column 0
    // and "Sep" at column 1, and the two names printed over each other. Across
    // a year of end-dates that happened 98 times.
    for (const endDate of everyEndDate()) {
      const { weeks, months } = calendar(endDate);
      const labels = monthLabels(weeks, months);

      for (let i = 1; i < labels.length; i++) {
        const gap = labels[i].column - labels[i - 1].column;
        assert.ok(
          gap >= MIN_LABEL_GAP,
          `${endDate}: ${labels[i - 1].name} -> ${labels[i].name} only ${gap} column(s) apart`,
        );
      }
    }
  });

  it("never places a label where it would overhang the right edge", () => {
    for (const endDate of everyEndDate()) {
      const { weeks, months } = calendar(endDate);
      for (const label of monthLabels(weeks, months)) {
        assert.ok(
          label.column <= COLUMNS - LABEL_COLUMNS,
          `${endDate}: ${label.name} at column ${label.column}`,
        );
      }
    }
  });

  it("keeps every month, in calendar order, whatever the nudging", () => {
    // Pushing a label right must not reorder them or quietly drop one. The
    // right-edge guard can drop in principle; on a real year it never does.
    for (const endDate of everyEndDate()) {
      const { weeks, months } = calendar(endDate);
      const labels = monthLabels(weeks, months);

      const columns = labels.map((label) => label.column);
      assert.deepEqual(columns, [...columns].sort((a, b) => a - b));

      const keys = labels.map((label) => label.key);
      assert.deepEqual(keys, [...keys].sort());
      assert.equal(new Set(keys).size, keys.length);
    }
  });

  it("names a month only once it covers two columns", () => {
    // A month with a single column is a sliver at one end of the window, and a
    // name over it says less than the space it costs.
    const { weeks, months } = calendar("2026-08-24");
    const named = new Set(monthLabels(weeks, months).map((label) => label.key.slice(0, 7)));

    const columnsFor = new Map<string, Set<number>>();
    weeks.forEach((week, index) => {
      for (const day of week.days) {
        const key = day.date.slice(0, 7);
        if (!columnsFor.has(key)) columnsFor.set(key, new Set());
        columnsFor.get(key)!.add(index);
      }
    });

    for (const [month, columns] of columnsFor) {
      if (columns.size < 2) assert.ok(!named.has(month), `${month} spans one column but is named`);
    }
  });

  it("shifts a month that starts mid-week, and leaves the edges alone", () => {
    const { weeks, months } = calendar("2026-08-24");
    const labels = monthLabels(weeks, months);

    // October 2025 opens on a Wednesday inside the week of 28 September, so its
    // name belongs above the first column it actually fills.
    const october = labels.find((label) => label.key.startsWith("2025-10"));
    assert.ok(october, "October is named");
    assert.equal(october!.column, 6);

    // The first label has no column to its left to be shifted into.
    assert.equal(labels[0].column, 0);
  });

  it("returns nothing for an empty calendar", () => {
    assert.deepEqual(monthLabels([], []), []);
  });
});
