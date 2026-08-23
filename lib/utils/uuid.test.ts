import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isUuid } from "./uuid";

/*
 * The job this guard does is easy to state and easy to lose: it keeps a value
 * from a URL or a form away from a `uuid` column. Postgres does not answer a
 * malformed uuid with zero rows -- it raises `22P02`, which surfaces as a 500 on
 * a route whose honest answer is "no such record".
 */
describe("isUuid", () => {
  it("accepts a key the database would have generated", () => {
    assert.equal(isUuid("66ff5a31-f8ae-4e03-bd0d-14b2ee8c58a3"), true);
  });

  it("accepts any version, since a key can also arrive from a URL somebody typed", () => {
    assert.equal(isUuid("00000000-0000-1000-8000-000000000000"), true);
    assert.equal(isUuid("00000000-0000-7000-8000-000000000000"), true);
  });

  it("accepts upper case", () => {
    assert.equal(isUuid("66FF5A31-F8AE-4E03-BD0D-14B2EE8C58A3"), true);
  });

  it("rejects the shapes a wrong key actually takes", () => {
    for (const value of [
      "1", // the serial key this replaced
      "", // an empty path segment
      "66ff5a31f8ae4e03bd0d14b2ee8c58a3", // no separators
      "66ff5a31-f8ae-4e03-bd0d-14b2ee8c58a", // one character short
      "66ff5a31-f8ae-4e03-bd0d-14b2ee8c58a33", // one character long
      "66ff5a31-f8ae-4e03-bd0d_14b2ee8c58a3", // wrong separator
      "gggggggg-f8ae-4e03-bd0d-14b2ee8c58a3", // not hex
      " 66ff5a31-f8ae-4e03-bd0d-14b2ee8c58a3", // padded
      "66ff5a31-f8ae-4e03-bd0d-14b2ee8c58a3 ",
    ]) {
      assert.equal(isUuid(value), false, `expected ${JSON.stringify(value)} to be rejected`);
    }
  });

  it("rejects a value that is not a string at all", () => {
    for (const value of [null, undefined, 1, {}, [], true, Number.NaN]) {
      assert.equal(isUuid(value), false, `expected ${String(value)} to be rejected`);
    }
  });

  it("rejects an injection attempt rather than passing it to the database", () => {
    assert.equal(isUuid("1; drop table app.account"), false);
    assert.equal(isUuid("66ff5a31-f8ae-4e03-bd0d-14b2ee8c58a3' or '1'='1"), false);
  });
});
