import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { topThree } from "./wakatime-year";

describe("topThree", () => {
  it("shares each breakdown's own total, so no row passes 100%", () => {
    // The shape that drew Windows at 101%: the systems breakdown counts time
    // the year's language total leaves out, so its rows outweigh that total.
    const rows = topThree([
      { name: "Windows", total_seconds: 3_459_000 },
      { name: "Linux", total_seconds: 116_100 },
    ]);
    assert.deepEqual(
      rows.map((row) => row.name),
      ["Windows", "Linux"],
    );
    assert.ok(rows.every((row) => row.percent <= 100));
    assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.percent, 0) - 100) < 0.01);
  });

  it("drops a row too small to draw and keeps three", () => {
    const rows = topThree([
      { name: "A", total_seconds: 600 },
      { name: "B", total_seconds: 300 },
      { name: "C", total_seconds: 99 },
      { name: "D", total_seconds: 1 },
      { name: "E", total_seconds: 0 },
    ]);
    assert.deepEqual(
      rows.map((row) => row.name),
      ["A", "B", "C"],
    );
  });
});
