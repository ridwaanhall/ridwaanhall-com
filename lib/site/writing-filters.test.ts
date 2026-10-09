import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_WRITING_FILTERS, parseWritingFilters, sortPosts, writingFiltersToSearch } from "./writing-filters";

const posts = [
  { title: "Beta", views: 5, time: 2 },
  { title: "alpha", views: 9, time: 1 },
  { title: "Gamma", views: 1, time: 3 },
];

describe("writing filters", () => {
  it("defaults to newest, as an index, and leaves the defaults out of the address", () => {
    assert.deepEqual(parseWritingFilters({}), DEFAULT_WRITING_FILTERS);
    assert.equal(writingFiltersToSearch(DEFAULT_WRITING_FILTERS), "");
  });

  it("refuses a sort or view it does not know", () => {
    const read = parseWritingFilters({ sort: "random", view: "cards" });
    assert.equal(read.sort, "new");
    assert.equal(read.view, "rows");
  });

  it("round-trips through the address", () => {
    const filters = { q: "api", topic: "Science & Space", sort: "az" as const, view: "grid" as const };
    assert.deepEqual(parseWritingFilters(Object.fromEntries(new URLSearchParams(writingFiltersToSearch(filters)))), filters);
  });
});

describe("sortPosts", () => {
  it("orders newest, oldest, A to Z ignoring case, and most read", () => {
    assert.deepEqual(sortPosts(posts, "new").map((p) => p.title), ["Gamma", "Beta", "alpha"]);
    assert.deepEqual(sortPosts(posts, "old").map((p) => p.title), ["alpha", "Beta", "Gamma"]);
    assert.deepEqual(sortPosts(posts, "az").map((p) => p.title), ["alpha", "Beta", "Gamma"]);
    assert.deepEqual(sortPosts(posts, "read").map((p) => p.title), ["alpha", "Beta", "Gamma"]);
  });

  it("does not reorder the list it was given", () => {
    const before = posts.map((p) => p.title);
    sortPosts(posts, "az");
    assert.deepEqual(posts.map((p) => p.title), before);
  });
});
