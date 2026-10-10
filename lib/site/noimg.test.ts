import assert from "node:assert/strict";
import { test } from "node:test";

import { MOTIFS, motifFor, rand, seedOf } from "@/lib/site/noimg";

test("a category slug picks its drawing, and anything else is a web page", () => {
  assert.equal(motifFor("api"), "terminal");
  assert.equal(motifFor("machine-learning"), "network");
  assert.equal(motifFor("finance"), "chart");
  assert.equal(motifFor("automation"), "flow");
  assert.equal(motifFor("gaming"), "tiles");
  assert.equal(motifFor("education"), "page");
  assert.equal(motifFor("something-new"), "browser");
  assert.equal(motifFor(""), "browser");
  assert.equal(motifFor(null), "browser");
  assert.equal(motifFor(undefined), "browser");
});

test("every drawing is reachable from some category", () => {
  const reached = new Set(
    ["web-app", "api", "finance", "ai", "bot", "gaming", "education"].map((slug) => motifFor(slug)),
  );
  for (const motif of MOTIFS) assert.ok(reached.has(motif), `no category draws ${motif}`);
});

test("a label is not an identifier: only the slug is matched", () => {
  assert.equal(motifFor("API"), "browser");
  assert.equal(motifFor("Machine Learning"), "browser");
});

test("the seed and the sequence repeat exactly, so both renders draw the same thing", () => {
  assert.equal(seedOf("FinTrack"), seedOf("FinTrack"));
  assert.notEqual(seedOf("FinTrack"), seedOf("Fintrack"));
  const a = rand(seedOf("FinTrack"));
  const b = rand(seedOf("FinTrack"));
  for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test("the sequence stays inside [0, 1) and is not constant", () => {
  const next = rand(seedOf("anything"));
  const seen = new Set<number>();
  for (let i = 0; i < 200; i++) {
    const value = next();
    assert.ok(value >= 0 && value < 1);
    seen.add(value);
  }
  assert.ok(seen.size > 190);
});
