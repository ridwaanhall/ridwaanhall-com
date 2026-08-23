import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ITEMS_PER_PAGE, pageParam, pageRange, paginate } from "./pagination";

describe("pageRange", () => {
  it("lists every page while they still fit", () => {
    assert.deepEqual(pageRange(1, 1), [1]);
    assert.deepEqual(pageRange(1, 2), [1, 2]);
    assert.deepEqual(pageRange(3, 5), [1, 2, 3, 4, 5]);
  });

  it("elides only the side that is actually far away", () => {
    assert.deepEqual(pageRange(1, 20), [1, 2, 3, "...", 20]);
    assert.deepEqual(pageRange(20, 20), [1, "...", 18, 19, 20]);
  });

  it("elides both sides in the middle of a long list", () => {
    assert.deepEqual(pageRange(10, 20), [1, "...", 8, 9, 10, 11, 12, "...", 20]);
  });

  it("keeps a window of two either side of the current page", () => {
    const range = pageRange(50, 100);
    assert.deepEqual(range, [1, "...", 48, 49, 50, 51, 52, "...", 100]);
  });

  it("never repeats the first or last page inside the window", () => {
    for (const [current, pages] of [[2, 10], [3, 10], [9, 10], [1, 3], [3, 3]] as const) {
      const range = pageRange(current, pages);
      const numbers = range.filter((entry): entry is number => entry !== "...");
      assert.equal(new Set(numbers).size, numbers.length, `duplicate in ${JSON.stringify(range)}`);
    }
  });

  it("never puts an ellipsis where a single page was skipped", () => {
    // With pages 1..5 and current 3 the window already reaches both ends, so an
    // ellipsis would stand in for nothing.
    assert.ok(!pageRange(3, 5).includes("..."));
    assert.ok(!pageRange(3, 6).includes("..."));
  });
});

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("slices the page asked for", () => {
    const page = paginate(items, 2, 10);
    assert.deepEqual(page.items, [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    assert.equal(page.page, 2);
    assert.equal(page.pages, 3);
    assert.equal(page.count, 25);
    assert.equal(page.has_previous, true);
    assert.equal(page.has_next, true);
  });

  /*
   * Deleting the last row of the last page must not leave a bookmarked `?page=`
   * dead, so an out-of-range page clamps rather than 404s.
   */
  it("clamps a page past the end instead of returning nothing", () => {
    const page = paginate(items, 99, 10);
    assert.equal(page.page, 3);
    assert.deepEqual(page.items, [21, 22, 23, 24, 25]);
    assert.equal(page.has_next, false);
  });

  it("clamps a page below one", () => {
    assert.equal(paginate(items, 0, 10).page, 1);
    assert.equal(paginate(items, -5, 10).page, 1);
  });

  it("falls back to page one for anything that is not a number", () => {
    for (const page of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      assert.equal(paginate(items, page, 10).page, 1);
    }
  });

  it("truncates a fractional page rather than throwing", () => {
    assert.equal(paginate(items, 2.7, 10).page, 2);
  });

  it("reports one page for an empty list, not zero", () => {
    const page = paginate([], 1, 10);
    assert.equal(page.pages, 1);
    assert.equal(page.count, 0);
    assert.deepEqual(page.items, []);
    assert.equal(page.has_previous, false);
    assert.equal(page.has_next, false);
  });

  it("defaults to the site-wide page size", () => {
    assert.equal(paginate(Array.from({ length: 30 }, (_, i) => i), 1).items.length, ITEMS_PER_PAGE);
  });

  it("leaves the input list alone", () => {
    const original = [...items];
    paginate(items, 2, 10);
    assert.deepEqual(items, original);
  });
});

describe("pageParam", () => {
  it("reads a page number", () => {
    assert.equal(pageParam(new URLSearchParams("page=4")), 4);
  });

  it("defaults to one for anything that is not a page number", () => {
    for (const query of ["", "page=", "page=0", "page=-3", "page=abc", "page=NaN"]) {
      assert.equal(pageParam(new URLSearchParams(query)), 1, `for ?${query}`);
    }
  });

  it("truncates rather than rounding", () => {
    assert.equal(pageParam(new URLSearchParams("page=3.9")), 3);
  });
});
