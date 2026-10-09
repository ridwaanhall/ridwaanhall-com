import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { hasTwin, normalise, twinOf } from "./twins";

describe("twins", () => {
  it("names a page's twin by adding .md, and the home page index.md", () => {
    assert.equal(twinOf("/"), "/index.md");
    assert.equal(twinOf("/about"), "/about.md");
    assert.equal(twinOf("/about/"), "/about.md");
    assert.equal(twinOf("/blog/a-post"), "/blog/a-post.md");
  });

  it("gives every content page a twin, and nothing else", () => {
    for (const path of ["/", "/projects", "/blog", "/about", "/dashboard", "/guestbook", "/contact", "/openhire", "/privacy-policy", "/terms", "/projects/mlbb-api", "/blog/python-101"])
      assert.ok(hasTwin(path), path);
    for (const path of ["/sign-in", "/admin", "/admin/blog-post", "/api/projects", "/cv", "/md/about", "/projects/a/b"])
      assert.ok(!hasTwin(path), path);
  });

  it("ignores a query, a hash and a trailing slash", () => {
    assert.equal(normalise("/projects/?q=python#top"), "/projects");
    assert.ok(hasTwin("/blog/?page=2"));
  });
});
