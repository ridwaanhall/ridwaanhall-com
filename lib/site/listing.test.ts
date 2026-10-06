import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { listingHref, readListingParams } from "./listing";

describe("readListingParams", () => {
  it("trims the query and floors the page at 1", async () => {
    assert.deepEqual(await readListingParams(Promise.resolve({ q: "  python ", page: "0" })), {
      query: "python",
      page: 1,
    });
  });

  it("treats a page that is not a number as the first", async () => {
    assert.equal((await readListingParams(Promise.resolve({ page: "two" }))).page, 1);
  });
});

describe("listingHref", () => {
  it("leaves page 1 implicit so the first page has one URL", () => {
    assert.equal(listingHref("/blog", "", 1), "/blog");
    assert.equal(listingHref("/blog", "", 2), "/blog?page=2");
  });

  it("keeps the query across pages", () => {
    assert.equal(listingHref("/projects", "mlbb api", 3), "/projects?q=mlbb+api&page=3");
  });
});
