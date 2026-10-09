import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { samePath } from "./same-path";

describe("samePath", () => {
  it("keeps a plain path, with its query", () => {
    assert.equal(samePath("/guestbook", "/"), "/guestbook");
    assert.equal(samePath("/blog/a-post?x=1#c", "/"), "/blog/a-post?x=1#c");
  });

  it("refuses every shape that reads as another host", () => {
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "https:/evil.com", "evil.com", "/\t/evil.com", "/\n/evil.com", "/a\\b", "", undefined])
      assert.equal(samePath(bad, "/guestbook"), "/guestbook", String(bad));
  });
});
