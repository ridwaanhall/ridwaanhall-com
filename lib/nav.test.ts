import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NAV_ITEMS, isActive, normalizePath, visibleNavItems } from "./nav";

describe("normalizePath", () => {
  it("drops a trailing slash, because the hrefs carry none", () => {
    assert.equal(normalizePath("/blog/"), "/blog");
    assert.equal(normalizePath("/blog"), "/blog");
  });

  it("leaves the root alone, since stripping it would leave an empty string", () => {
    assert.equal(normalizePath("/"), "/");
  });
});

describe("isActive", () => {
  it("marks the exact page", () => {
    assert.equal(isActive({ href: "/about" }, "/about"), true);
    assert.equal(isActive({ href: "/about" }, "/contact"), false);
  });

  it("marks a nested page only where the item asks for it", () => {
    assert.equal(isActive({ href: "/blog", matchNested: true }, "/blog/some-post"), true);
    assert.equal(isActive({ href: "/blog" }, "/blog/some-post"), false);
  });

  it("matches through a trailing slash either way", () => {
    assert.equal(isActive({ href: "/about" }, "/about/"), true);
    assert.equal(isActive({ href: "/blog", matchNested: true }, "/blog/"), true);
  });

  /*
   * A prefix test, not a substring one: `/blogging` must not light up `/blog`.
   * The separator is what makes it a path boundary rather than a string one.
   */
  it("does not match a different route that merely starts the same way", () => {
    assert.equal(isActive({ href: "/blog", matchNested: true }, "/blogging"), false);
    assert.equal(isActive({ href: "/blog", matchNested: true }, "/blog-archive"), false);
  });

  it("marks home only at the root, never on every page", () => {
    assert.equal(isActive({ href: "/" }, "/"), true);
    assert.equal(isActive({ href: "/" }, "/about"), false);
    assert.equal(isActive({ href: "/", matchNested: true }, "/about"), false);
  });
});

describe("visibleNavItems", () => {
  it("returns items, and only ones the nav declares", () => {
    const visible = visibleNavItems();
    assert.ok(visible.length > 0);
    for (const item of visible) assert.ok(NAV_ITEMS.includes(item));
  });

  it("hides nothing that does not depend on the guestbook", () => {
    const independent = NAV_ITEMS.filter((item) => !item.requiresGuestbook);
    for (const item of independent) assert.ok(visibleNavItems().includes(item), item.label);
  });

  it("every item has a label, an href and an icon", () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.label, "missing label");
      assert.ok(item.href.startsWith("/"), `${item.label}: href must be a path`);
      assert.equal(typeof item.icon, "function", `${item.label}: missing icon`);
    }
  });

  it("no two items share an href", () => {
    const hrefs = NAV_ITEMS.map((item) => item.href);
    assert.equal(new Set(hrefs).size, hrefs.length);
  });
});
