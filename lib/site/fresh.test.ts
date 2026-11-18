import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { FRESH_MAX_AGE_MS, FRESH_RETRY_DELAYS_MS, isStale } from "./fresh";

const at = (iso: string) => Date.parse(iso);

describe("isStale", () => {
  it("is fresh inside the window", () => {
    assert.equal(isStale(at("2026-03-10T05:00:00Z"), at("2026-03-10T05:10:00Z")), false);
    assert.equal(isStale(at("2026-03-10T05:00:00Z"), at("2026-03-10T05:00:00Z") + FRESH_MAX_AGE_MS), false);
  });

  it("is stale past the window", () => {
    assert.equal(isStale(at("2026-03-10T05:00:00Z"), at("2026-03-10T05:30:01Z")), true);
  });

  it("is stale across Jakarta midnight even a minute apart", () => {
    // 17:00 UTC is 00:00 WIB
    assert.equal(isStale(at("2026-03-10T16:59:00Z"), at("2026-03-10T17:00:30Z")), true);
  });

  it("is fresh on the same Jakarta day across the UTC midnight", () => {
    // 23:59 WIB is 16:59 UTC; 00:00 UTC is 07:00 WIB the same Jakarta day
    assert.equal(isStale(at("2026-03-10T16:50:00Z"), at("2026-03-10T16:59:00Z")), false);
    assert.equal(isStale(at("2026-03-09T23:55:00Z"), at("2026-03-10T00:00:00Z")), false);
  });

  it("is fresh when the stamp is in the future", () => {
    assert.equal(isStale(at("2026-03-10T06:00:00Z"), at("2026-03-10T05:00:00Z")), false);
  });

  it("honours a custom window", () => {
    assert.equal(isStale(at("2026-03-10T05:00:00Z"), at("2026-03-10T05:02:00Z"), "Asia/Jakarta", 60_000), true);
  });

  it("judges the day in the given zone", () => {
    // 2026-03-10 EDT is UTC-4. 03:50Z is 23:50 on the 9th in New York, 10:50 in Jakarta;
    // 04:10Z is 00:10 on the 10th in New York, 11:10 in Jakarta.
    const a = at("2026-03-10T03:50:00Z");
    const b = at("2026-03-10T04:10:00Z");
    assert.equal(isStale(a, b, "Asia/Jakarta"), false);
    assert.equal(isStale(a, b, "America/New_York"), true);
    // 16:50Z to 17:10Z crosses Jakarta midnight but is 12:50 to 13:10 in New York.
    const c = at("2026-03-10T16:50:00Z");
    const d = at("2026-03-10T17:10:00Z");
    assert.equal(isStale(c, d, "Asia/Jakarta"), true);
    assert.equal(isStale(c, d, "America/New_York"), false);
  });

  it("treats an unknown zone as Jakarta without throwing", () => {
    const c = at("2026-03-10T16:50:00Z");
    const d = at("2026-03-10T17:10:00Z");
    assert.doesNotThrow(() => isStale(c, d, "Not/AZone"));
    assert.equal(isStale(c, d, "Not/AZone"), true);
    assert.equal(isStale(at("2026-03-10T03:50:00Z"), at("2026-03-10T04:10:00Z"), "Not/AZone"), false);
  });

  it("retries at most three times, starting at once", () => {
    assert.deepEqual(FRESH_RETRY_DELAYS_MS, [0, 5_000, 15_000]);
  });
});
