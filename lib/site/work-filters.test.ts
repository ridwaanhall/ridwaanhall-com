import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_FILTERS, filtersToSearch, parseFilters, searchToFilters } from "./work-filters";

describe("work filters: status", () => {
  it("reads ?status= as the slug it names", () => {
    assert.equal(parseFilters({ status: "maintenance-support" }).status, "maintenance-support");
  });

  it("defaults to every status and leaves it out of the address", () => {
    assert.equal(parseFilters({}).status, "");
    assert.equal(filtersToSearch(DEFAULT_FILTERS), "");
  });

  it("round-trips through the address with the other filters", () => {
    const filters = { ...DEFAULT_FILTERS, status: "completed", kind: "API", sort: "new" as const };
    assert.deepEqual(parseFilters(Object.fromEntries(new URLSearchParams(filtersToSearch(filters)))), filters);
  });
});

describe("work filters: searchToFilters", () => {
  it("round-trips filters through filtersToSearch", () => {
    const filters = { ...DEFAULT_FILTERS, q: "api", kind: "API", skill: "Cloudflare Workers", status: "completed", live: true, source: true, sort: "az" as const, view: "rows" as const };
    assert.deepEqual(searchToFilters(filtersToSearch(filters)), filters);
    assert.deepEqual(searchToFilters(new URLSearchParams(filtersToSearch(filters))), filters);
  });

  it("reads an encoded skill name whole", () => {
    assert.equal(searchToFilters("?skill=Cloudflare%20Workers").skill, "Cloudflare Workers");
  });
});
