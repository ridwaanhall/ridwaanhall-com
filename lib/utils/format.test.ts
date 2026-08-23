import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isoDateTime, longDate, longDateTime, slugify } from "./format";

describe("longDate", () => {
  it("renders the editorial date", () => {
    assert.equal(longDate("2026-01-23T12:00:00Z"), "January 23, 2026");
  });

  /*
   * The reason this is pinned to UTC rather than the viewer's zone: a post
   * published at 00:30 Jakarta is 17:30 the previous day in UTC, and a
   * viewer-local rendering would also differ between server and client, which
   * React reports as a hydration mismatch.
   */
  it("renders in UTC, so a date does not slide by a day for a reader elsewhere", () => {
    assert.equal(longDate("2026-01-23T00:00:00Z"), "January 23, 2026");
    assert.equal(longDate("2026-01-23T23:59:59Z"), "January 23, 2026");
  });

  it("accepts a Date as readily as a string", () => {
    assert.equal(longDate(new Date("2026-08-01T09:00:00Z")), "August 1, 2026");
  });
});

describe("isoDateTime", () => {
  it("round-trips an instant for a <time datetime=…> attribute", () => {
    assert.equal(isoDateTime("2026-01-23T12:34:56.000Z"), "2026-01-23T12:34:56.000Z");
    assert.equal(isoDateTime(new Date(0)), "1970-01-01T00:00:00.000Z");
  });
});

describe("slugify", () => {
  it("turns a tag into what a URL fragment can carry", () => {
    assert.equal(slugify("Commit Style"), "commit-style");
  });

  it("collapses runs of whitespace and hyphens into one", () => {
    assert.equal(slugify("a   b"), "a-b");
    assert.equal(slugify("a---b"), "a-b");
    assert.equal(slugify(" a - b "), "a-b");
  });

  it("drops punctuation rather than encoding it", () => {
    assert.equal(slugify("C++ & Rust!"), "c-rust");
    assert.equal(slugify("what's new?"), "whats-new");
  });

  it("strips the accent rather than the letter", () => {
    assert.equal(slugify("Café"), "cafe");
  });

  it("is idempotent, so slugifying a slug changes nothing", () => {
    const once = slugify("Machine Learning & AI");
    assert.equal(slugify(once), once);
  });

  it("returns an empty string for input with nothing sluggable in it", () => {
    assert.equal(slugify(""), "");
    assert.equal(slugify("!!!"), "");
  });
});

describe("longDateTime", () => {
  /*
   * Jakarta, not the viewer's zone, and the abbreviation is printed alongside
   * so the reading is unambiguous. WIB is a fixed +07:00.
   */
  it("renders in Jakarta time with the zone named", () => {
    const out = longDateTime("2026-01-23T13:55:00Z"); // 20:55 WIB
    assert.equal(out, "8:55 PM WIB, Fri January 23, 2026");
  });

  it("rolls the date over when Jakarta is already on the next day", () => {
    const out = longDateTime("2026-01-23T17:30:00Z"); // 00:30 WIB on the 24th
    assert.ok(out.includes("January 24, 2026"), out);
    assert.ok(out.startsWith("12:30 AM"), out);
  });
});
