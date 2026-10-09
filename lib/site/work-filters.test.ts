import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_FILTERS, filtersToSearch, parseFilters } from "./work-filters";

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
