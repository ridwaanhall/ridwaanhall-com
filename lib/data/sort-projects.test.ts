import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sortProjects } from "./content";

import type { Project } from "./content";

/**
 * `sortProjects` ranks on `status_rank`, which is `project_status.position`
 * read from the row, and that is the whole point of the test.
 *
 * The version before it ranked through a lookup keyed by an underscored status
 * name -- `development_in_progress` -- while the column holds a hyphenated slug.
 * Every lookup missed, every project ranked as unknown, and the first of the two
 * sort keys did nothing at all. It went unnoticed because the only test compared
 * the lookup tables against each other rather than against anything a query
 * returns, so the assertions below use the ranks a row actually carries.
 */

const project = (over: Partial<Project>): Project =>
  ({
    id: over.title ?? "x",
    title: "x",
    slug: "x",
    headline: "",
    description_html: "",
    image_url: "",
    img_name: "",
    images: {},
    features: [],
    tech_stack: [],
    github_url: null,
    demo_url: null,
    category: "",
    tags: [],
    is_featured: false,
    featured_priority: null,
    status: "completed",
    status_label: "Completed",
    status_rank: 11,
    created_at: new Date("2025-01-01"),
    updated_at: null,
    ...over,
  }) as Project;

describe("sortProjects", () => {
  it("orders by lifecycle rank before date", () => {
    const early = project({ title: "design", status_rank: 1, created_at: new Date("2020-01-01") });
    const late = project({ title: "done", status_rank: 11, created_at: new Date("2026-01-01") });
    const order = sortProjects([late, early]).map((p) => p.title);
    assert.deepEqual(order, ["design", "done"]);
  });

  it("falls back to newest first inside one rank", () => {
    const older = project({ title: "older", created_at: new Date("2024-01-01") });
    const newer = project({ title: "newer", created_at: new Date("2026-01-01") });
    const order = sortProjects([older, newer]).map((p) => p.title);
    assert.deepEqual(order, ["newer", "older"]);
  });

  it("puts featured projects first regardless of rank", () => {
    const featured = project({ title: "featured", is_featured: true, status_rank: 11 });
    const leading = project({ title: "unfeatured", status_rank: 1 });
    const order = sortProjects([leading, featured]).map((p) => p.title);
    assert.deepEqual(order, ["featured", "unfeatured"]);
  });

  it("still ranks inside the featured group", () => {
    const a = project({ title: "a", is_featured: true, status_rank: 5 });
    const b = project({ title: "b", is_featured: true, status_rank: 2 });
    assert.deepEqual(sortProjects([a, b]).map((p) => p.title), ["b", "a"]);
  });

  it("sorts a project with no status after every project that has one", () => {
    const none = project({ title: "none", status_rank: Number.MAX_SAFE_INTEGER });
    const last = project({ title: "cancelled", status_rank: 10 });
    assert.deepEqual(sortProjects([none, last]).map((p) => p.title), ["cancelled", "none"]);
  });

  it("does not mutate its input", () => {
    const input = [project({ title: "b", status_rank: 9 }), project({ title: "a", status_rank: 1 })];
    const before = input.map((p) => p.title);
    sortProjects(input);
    assert.deepEqual(input.map((p) => p.title), before);
  });
});
