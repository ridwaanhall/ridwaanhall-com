import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MARQUEE_SEEDS, shuffle } from "./shuffle";

const items = Array.from({ length: 24 }, (_, i) => i);

describe("shuffle", () => {
  /*
   * Determinism is the whole point. `Math.random()` inside a prerendered tree
   * is rejected outright, and a shuffle that differed between the server render
   * and the client would be a hydration mismatch.
   */
  it("gives the same order for the same seed, every time", () => {
    assert.deepEqual(shuffle(items, 12345), shuffle(items, 12345));
  });

  it("gives a different order for a different seed", () => {
    assert.notDeepEqual(shuffle(items, 1), shuffle(items, 2));
  });

  it("keeps every item exactly once", () => {
    const out = shuffle(items, 99);
    assert.equal(out.length, items.length);
    assert.deepEqual([...out].sort((a, b) => a - b), items);
  });

  it("does not mutate the input", () => {
    const original = [...items];
    shuffle(items, 7);
    assert.deepEqual(items, original);
  });

  it("handles the empty and single-item cases", () => {
    assert.deepEqual(shuffle([], 1), []);
    assert.deepEqual(shuffle(["only"], 1), ["only"]);
  });

  it("gives the three marquee rows three different orders", () => {
    const [a, b, c] = MARQUEE_SEEDS.map((seed) => shuffle(items, seed));
    assert.notDeepEqual(a, b);
    assert.notDeepEqual(b, c);
    assert.notDeepEqual(a, c);
  });
});
