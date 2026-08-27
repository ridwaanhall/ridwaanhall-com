import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  bulletAxis,
  clock,
  hourHistogram,
  mergeDurationBlocks,
  rankSlots,
  summariseSessions,
  weeklyAiTrend,
  type DurationEntry,
} from "./wakatime-shapes";

/** Midnight of the day under test, as the durations response reports it. */
const START = 1_787_707_089 - 9 * 3600;

/** A slice `at` seconds into the day, `duration` long. */
function slice(at: number, duration: number, language = "Python", project = "site"): DurationEntry {
  return { time: START + at, duration, language, project };
}

describe("mergeDurationBlocks", () => {
  it("places a block at the fraction of the day it started on", () => {
    const [block] = mergeDurationBlocks([slice(6 * 3600, 3600)], START);
    assert.equal(block.start, 0.25);
    assert.equal(block.width, round4(3600 / 86400));
    assert.equal(block.seconds, 3600);
  });

  it("joins slices of one language that the API split at a file switch", () => {
    const blocks = mergeDurationBlocks(
      [slice(3600, 600), slice(4210, 600), slice(4820, 600)],
      START,
    );
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].seconds, 1820);
  });

  it("keeps a different language apart even with no gap at all", () => {
    const blocks = mergeDurationBlocks(
      [slice(3600, 600, "Python"), slice(4200, 600, "TypeScript")],
      START,
    );
    assert.equal(blocks.length, 2);
    assert.deepEqual(
      blocks.map((block) => block.language),
      ["Python", "TypeScript"],
    );
  });

  it("keeps slices apart once the gap is a real break", () => {
    const blocks = mergeDurationBlocks([slice(3600, 600), slice(9000, 600)], START);
    assert.equal(blocks.length, 2);
  });

  /*
   * The reason the floor exists: a minute is half a pixel on a ribbon this
   * wide, and a browser paints that as nothing at all.
   */
  it("draws a one-minute slice wide enough to see", () => {
    const [block] = mergeDurationBlocks([slice(3600, 60)], START);
    assert.equal(block.width, 0.0025);
    assert.equal(block.seconds, 60);
  });

  it("stops a sitting that runs past midnight at the end of the track", () => {
    const [block] = mergeDurationBlocks([slice(23 * 3600, 7200)], START);
    assert.ok(block.start + block.width <= 1);
  });

  it("names a merged block after the project holding most of it", () => {
    const blocks = mergeDurationBlocks(
      [slice(3600, 120, "Python", "small"), slice(3730, 1800, "Python", "big")],
      START,
    );
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].project, "big");
  });

  it("orders a response that did not arrive sorted", () => {
    const blocks = mergeDurationBlocks(
      [slice(20000, 600, "Go"), slice(3600, 600, "Python")],
      START,
    );
    assert.deepEqual(
      blocks.map((block) => block.language),
      ["Python", "Go"],
    );
  });

  it("has nothing to draw for a day with nothing on it", () => {
    assert.deepEqual(mergeDurationBlocks([], START), []);
  });
});

describe("summariseSessions", () => {
  it("counts one sitting when the slices run on from each other", () => {
    const summary = summariseSessions([slice(3600, 600), slice(4200, 600)]);
    assert.equal(summary.sessions, 1);
    assert.equal(summary.longest_seconds, 1200);
    assert.equal(summary.longest_break_seconds, 0);
  });

  it("starts a new sitting after a quarter of an hour away", () => {
    const summary = summariseSessions([slice(3600, 600), slice(6000, 1800)]);
    assert.equal(summary.sessions, 2);
    assert.equal(summary.longest_seconds, 1800);
    assert.equal(summary.longest_break_seconds, 1800);
  });

  it("reports the first and last moment of the day in day-seconds", () => {
    const summary = summariseSessions([slice(3600, 600), slice(20000, 600)]);
    assert.equal(summary.first_at, START + 3600);
    assert.equal(summary.last_at, START + 20600);
  });

  it("answers a day with nothing on it without dividing by anything", () => {
    const summary = summariseSessions([]);
    assert.equal(summary.sessions, 0);
    assert.equal(summary.first_at, null);
    assert.equal(summary.last_at, null);
    assert.equal(summary.active_seconds, 0);
  });

  /*
   * A single slice is still a sitting. Measured by counting gaps it would be
   * none, which is the shape this used to have.
   */
  it("calls one slice one session", () => {
    assert.equal(summariseSessions([slice(3600, 600)]).sessions, 1);
  });
});

describe("hourHistogram", () => {
  it("splits a sitting across every hour it touches", () => {
    const hours = hourHistogram([slice(20 * 3600 + 50 * 60, 4 * 3600)], START);
    assert.equal(hours[20], 600);
    assert.equal(hours[21], 3600);
    assert.equal(hours[22], 3600);
    assert.equal(hours[23], 3600);
  });

  it("stops at midnight rather than spilling off the end of the array", () => {
    const hours = hourHistogram([slice(23 * 3600, 7200)], START);
    assert.equal(hours.length, 24);
    assert.equal(hours[23], 3600);
    assert.equal(
      hours.reduce((sum, value) => sum + value, 0),
      3600,
    );
  });

  it("is all zeroes for a day with nothing on it", () => {
    assert.deepEqual(hourHistogram([], START), Array.from({ length: 24 }, () => 0));
  });
});

describe("weeklyAiTrend", () => {
  const year = Array.from({ length: 365 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 7, 28 + index)).toISOString().slice(0, 10),
    ai_line_changes: 10,
    human_line_changes: 10,
  }));

  it("leaves the short point at the old end, so the newest is a whole week", () => {
    const points = weeklyAiTrend(year);
    assert.equal(points.length, 53);
    assert.equal(points[0].start, points[0].end);
    assert.equal(points[52].end, year[364].date);
  });

  /*
   * The whole reason this aggregates lines rather than averaging percentages: a
   * day of eight hand-typed lines and a day of three thousand AI ones are not
   * the same weight, and a mean of daily shares says they are.
   */
  it("weighs a week by its lines, not by its days", () => {
    const [point] = weeklyAiTrend([
      { date: "2026-01-01", ai_line_changes: 3000, human_line_changes: 0 },
      { date: "2026-01-02", ai_line_changes: 0, human_line_changes: 8 },
    ]);
    assert.equal(point.percent, 99.7);
  });

  it("calls a week with no lines in it zero rather than NaN", () => {
    const [point] = weeklyAiTrend([
      { date: "2026-01-01", ai_line_changes: 0, human_line_changes: 0 },
    ]);
    assert.equal(point.percent, 0);
  });

  it("returns nothing for an empty year rather than one empty point", () => {
    assert.deepEqual(weeklyAiTrend([]), []);
  });
});

describe("bulletAxis", () => {
  /*
   * The community maximum is seventeen and a half hours a day. Reaching for it
   * puts every figure the panel draws inside the first sixth of the track.
   */
  it("ends just above the largest figure drawn, not above the outlier", () => {
    assert.equal(bulletAxis([9874, 4409, 2818]), 4 * 3600);
  });

  it("never collapses to nothing on a scale with no data yet", () => {
    assert.equal(bulletAxis([0, 0, 0]), 3600);
    assert.equal(bulletAxis([]), 3600);
  });
});

describe("rankSlots", () => {
  it("hands the ramp out biggest first", () => {
    const slots = rankSlots(
      new Map([
        ["Python", 100],
        ["Go", 300],
        ["TypeScript", 200],
      ]),
      3,
    );
    assert.deepEqual([...slots.entries()], [
      ["Go", 0],
      ["TypeScript", 1],
      ["Python", 2],
    ]);
  });

  it("leaves everything past the ramp out of the map entirely", () => {
    const slots = rankSlots(
      new Map([
        ["A", 3],
        ["B", 2],
        ["C", 1],
      ]),
      2,
    );
    assert.equal(slots.size, 2);
    assert.equal(slots.has("C"), false);
  });

  /*
   * Two languages level on seconds would otherwise swap colours whenever the
   * upstream response happened to reorder them.
   */
  it("breaks a tie on the name, so the colours hold still", () => {
    const slots = rankSlots(
      new Map([
        ["Zig", 5],
        ["Ada", 5],
      ]),
      2,
    );
    assert.equal(slots.get("Ada"), 0);
    assert.equal(slots.get("Zig"), 1);
  });
});

describe("clock", () => {
  it("writes a time the way the card reads it", () => {
    assert.equal(clock(9 * 3600 + 14 * 60), "09:14");
    assert.equal(clock(0), "00:00");
    assert.equal(clock(23 * 3600 + 59 * 60), "23:59");
  });

  it("wraps rather than printing a twenty-fourth hour", () => {
    assert.equal(clock(86400), "00:00");
    assert.equal(clock(-60), "00:00");
  });
});

/** The rounding `mergeDurationBlocks` applies, so an expectation can match it. */
function round4(value: number): number {
  return Math.round(value * 10000) / 10000;
}
