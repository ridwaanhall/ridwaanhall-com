import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adminDate, adminDateTime } from "./format";

/*
 * `YYYY-MM-DD`, in Jakarta. Unambiguous, aligns in a column, and reads in the
 * same order as the sort it usually sits under -- and rendered in the admin's
 * one timezone, so a row created at 06:30 WIB does not show yesterday.
 */
describe("adminDate", () => {
  it("renders the sortable form", () => {
    assert.equal(adminDate("2026-01-23T12:00:00Z"), "2026-01-23");
  });

  it("renders in Jakarta, so a late-evening UTC timestamp is already tomorrow", () => {
    assert.equal(adminDate("2026-01-23T17:30:00Z"), "2026-01-24");
  });

  it("accepts a Date", () => {
    assert.equal(adminDate(new Date("2026-08-01T05:00:00Z")), "2026-08-01");
  });

  it("renders nothing for an absent or unparseable value, never 'Invalid Date'", () => {
    assert.equal(adminDate(null), "");
    assert.equal(adminDate(""), "");
    assert.equal(adminDate("not a date"), "");
  });
});

describe("adminDateTime", () => {
  it("appends a 24-hour clock", () => {
    assert.equal(adminDateTime("2026-01-23T12:00:00Z"), "2026-01-23 19:00");
  });

  it("uses 24-hour time so the column sorts as it reads", () => {
    assert.equal(adminDateTime("2026-01-23T00:30:00Z"), "2026-01-23 07:30");
    assert.equal(adminDateTime("2026-01-23T13:05:00Z"), "2026-01-23 20:05");
  });

  it("renders nothing for an absent or unparseable value", () => {
    assert.equal(adminDateTime(null), "");
    assert.equal(adminDateTime(""), "");
    assert.equal(adminDateTime("nonsense"), "");
  });
});
