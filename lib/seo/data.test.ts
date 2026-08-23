import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { optimizeDescription } from "./data";

/*
 * A meta description is truncated by the search engine anyway; the point of
 * doing it here is to choose *where*, so the visible text ends on a word rather
 * than mid-syllable.
 */
describe("optimizeDescription", () => {
  it("leaves a description that already fits alone, with no ellipsis", () => {
    assert.equal(optimizeDescription("Short enough", 50), "Short enough");
  });

  it("leaves one of exactly the limit alone", () => {
    const exact = "a".repeat(50);
    assert.equal(optimizeDescription(exact, 50), exact);
  });

  it("breaks at a word boundary when one is close to the limit", () => {
    const out = optimizeDescription("one two three four five six seven eight", 20);
    assert.ok(out.endsWith("..."), out);
    assert.ok(!out.includes("  "), out);
    assert.ok(out.length <= 23, `${out.length} characters: ${out}`);
    assert.ok(!/\s\.\.\.$/.test(out), `space before the ellipsis: ${out}`);
  });

  /*
   * Only when the break is close. A single 400-character word would otherwise
   * truncate to almost nothing, which says less than a hard cut does.
   */
  it("cuts hard rather than losing most of the text to a distant boundary", () => {
    const out = optimizeDescription(`short ${"x".repeat(60)}`, 40);
    assert.ok(out.endsWith("..."));
    assert.ok(out.length > 40 * 0.8, `${out.length} characters: too much was lost`);
  });

  it("handles a single unbroken word", () => {
    const out = optimizeDescription("x".repeat(100), 20);
    assert.equal(out, `${"x".repeat(20)}...`);
  });

  it("returns an empty description unchanged", () => {
    assert.equal(optimizeDescription("", 50), "");
  });
});
