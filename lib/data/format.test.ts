import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isWorkingHours, isoMonth, monthYear } from "./format";

describe("monthYear", () => {
  it("reads a Postgres date string as the pair the pages render", () => {
    assert.deepEqual(monthYear("2024-01-15"), { month: "Jan", year: 2024 });
    assert.deepEqual(monthYear("2021-12-01"), { month: "Dec", year: 2021 });
  });

  /*
   * The whole reason this parses by splitting rather than through `new Date()`:
   * `new Date("2024-01-01")` is UTC midnight, and reading it back in local time
   * reports December 2023 anywhere west of UTC. Splitting cannot drift.
   */
  it("does not slide back a month for a reader west of UTC", () => {
    assert.deepEqual(monthYear("2024-01-01"), { month: "Jan", year: 2024 });
    assert.deepEqual(monthYear("2024-03-01"), { month: "Mar", year: 2024 });
  });

  it("reads a full timestamp by its date half", () => {
    assert.deepEqual(monthYear("2026-08-23T22:00:00.000Z"), { month: "Aug", year: 2026 });
  });

  it("accepts a Date, in UTC", () => {
    assert.deepEqual(monthYear(new Date("2024-07-04T00:00:00Z")), { month: "Jul", year: 2024 });
  });

  it("answers null for absent rather than guessing", () => {
    for (const value of [null, undefined, "", "not a date"]) {
      assert.equal(monthYear(value), null, `expected null for ${JSON.stringify(value)}`);
    }
  });
});

describe("isoMonth", () => {
  it("pads to the schema.org year-month form", () => {
    assert.equal(isoMonth("2024-01-15"), "2024-01");
    assert.equal(isoMonth("2024-11-02"), "2024-11");
  });

  /*
   * Empty, never a partial or a placeholder: schema.org date properties are
   * validated, and Google drops one it cannot parse without saying so.
   */
  it("answers an empty string for absent, so no half-formed date is emitted", () => {
    for (const value of [null, undefined, "", "nonsense"]) {
      assert.equal(isoMonth(value), "");
    }
  });
});

describe("isWorkingHours", () => {
  // 15:00–19:59 Asia/Jakarta (+07:00), Monday to Friday.
  // 2026-01-23 is a Friday; 2026-01-24 a Saturday.
  it("is true inside the window on a weekday", () => {
    assert.equal(isWorkingHours(new Date("2026-01-23T08:00:00Z")), true); // 15:00 WIB
    assert.equal(isWorkingHours(new Date("2026-01-23T12:59:00Z")), true); // 19:59 WIB
  });

  it("is false either side of the window", () => {
    assert.equal(isWorkingHours(new Date("2026-01-23T07:59:00Z")), false); // 14:59 WIB
    assert.equal(isWorkingHours(new Date("2026-01-23T13:00:00Z")), false); // 20:00 WIB
  });

  it("is false at the weekend, even inside the hours", () => {
    assert.equal(isWorkingHours(new Date("2026-01-24T08:00:00Z")), false); // Sat 15:00 WIB
    assert.equal(isWorkingHours(new Date("2026-01-25T09:00:00Z")), false); // Sun 16:00 WIB
  });

  /*
   * The hour is read with `hourCycle: "h23"` rather than `hour12: false`,
   * because the latter renders midnight as "24" under some ICU builds -- which
   * would read as hour 24 and fall outside every comparison silently.
   */
  it("reads midnight as hour zero, not twenty-four", () => {
    assert.equal(isWorkingHours(new Date("2026-01-22T17:00:00Z")), false); // Fri 00:00 WIB
  });

  it("crosses the date line correctly, since the day is Jakarta's", () => {
    // Sunday 23:00 UTC is already Monday 06:00 in Jakarta -- a weekday, but
    // outside the hours.
    assert.equal(isWorkingHours(new Date("2026-01-25T23:00:00Z")), false);
    // Friday 13:00 UTC is Friday 20:00 WIB: a weekday, one minute past the end.
    assert.equal(isWorkingHours(new Date("2026-01-23T12:00:00Z")), true); // 19:00 WIB
  });
});
