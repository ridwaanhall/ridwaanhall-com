import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adminDate, adminDateTime, fromAdminLocalInput, toAdminLocalInput } from "./format";

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

/*
 * The datetime control, both directions. Pinned to Jakarta so the round trip
 * does not depend on the zone of whichever machine renders or parses it -- the
 * server's used to decide, and a UTC deployment moved every timestamp by seven
 * hours on save.
 */
describe("the datetime control's value", () => {
  it("draws an instant in Jakarta time", () => {
    assert.equal(toAdminLocalInput("2026-01-23T17:30:45Z"), "2026-01-24T00:30");
    assert.equal(toAdminLocalInput("2026-01-23 03:05:00+00"), "2026-01-23T10:05");
  });

  it("reads the control back as Jakarta time", () => {
    assert.equal(fromAdminLocalInput("2026-01-24T00:30"), "2026-01-23T17:30:00.000Z");
  });

  it("round-trips to the minute", () => {
    const stored = "2026-05-01T10:23:00.000Z";
    assert.equal(fromAdminLocalInput(toAdminLocalInput(stored)), stored);
  });

  it("takes a value that names its zone at its word", () => {
    assert.equal(fromAdminLocalInput("2026-01-23T10:00:00Z"), "2026-01-23T10:00:00.000Z");
  });

  it("refuses what is not a time", () => {
    assert.equal(fromAdminLocalInput("soon"), null);
  });
});
