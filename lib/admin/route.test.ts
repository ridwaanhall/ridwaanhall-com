import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveAdminRoute } from "./route";

/*
 * `/admin/<a>/<b>` is one route to Next and two things to this admin: a record
 * of a model, or a tab of a section. Nothing in the type system tells them
 * apart -- both segments are strings -- so the rule lives in one function and
 * is asserted here rather than discovered as a 404.
 */
describe("resolveAdminRoute", () => {
  it("reads a section and one of its tabs as a tab", () => {
    const route = resolveAdminRoute("taxonomy", "tag");
    assert.equal(route?.kind, "tab");
    assert.equal(route?.kind === "tab" && route.entry.key, "tag");
    assert.equal(route?.kind === "tab" && route.section.key, "taxonomy");
  });

  it("refuses a tab that belongs to another section", () => {
    assert.equal(resolveAdminRoute("taxonomy", "work-mode"), null);
  });

  it("refuses a record id where a tab belongs", () => {
    assert.equal(resolveAdminRoute("taxonomy", "3f7c1e02-0000-4000-8000-000000000000"), null);
  });

  it("reads a model and an id as a record", () => {
    const route = resolveAdminRoute("blog-post", "3f7c1e02-0000-4000-8000-000000000000");
    assert.equal(route?.kind, "record");
    assert.equal(route?.kind === "record" && route.entry.key, "blog-post");
    assert.equal(
      route?.kind === "record" && route.id,
      "3f7c1e02-0000-4000-8000-000000000000",
    );
  });

  /*
   * The clean break. Without this the registry still resolves `tag` and the
   * old URL keeps answering beside the new one.
   */
  it("refuses a sectioned key at the top level", () => {
    assert.equal(resolveAdminRoute("tag", "3f7c1e02-0000-4000-8000-000000000000"), null);
  });

  it("refuses an unknown first segment", () => {
    assert.equal(resolveAdminRoute("nonsense", "anything"), null);
  });

  // Not this function's job. The record page already answers "no such row",
  // and the query layer is what guards the uuid -- a malformed id must reach
  // it as a miss, not be turned into "no such model" here.
  it("does not judge whether an id is well formed", () => {
    assert.equal(resolveAdminRoute("blog-post", "999999")?.kind, "record");
  });
});
