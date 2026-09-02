import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getTableName } from "drizzle-orm";

import { ADMIN_FORM_MODELS } from "@/lib/admin/models";

import { MODEL_TAGS, TAGS } from "./tags";

const KNOWN = new Set<string>(Object.values(TAGS));

describe("TAGS", () => {
  it("names each namespace after itself, so a typo is not a silent miss", () => {
    for (const [key, value] of Object.entries(TAGS)) assert.equal(key, value);
  });
});

describe("MODEL_TAGS", () => {
  it("lists only tags that exist", () => {
    for (const [table, tags] of Object.entries(MODEL_TAGS)) {
      for (const tag of tags) assert.ok(KNOWN.has(tag), `${table} names unknown tag "${tag}"`);
    }
  });

  it("gives every table it names at least one tag", () => {
    for (const [table, tags] of Object.entries(MODEL_TAGS)) {
      assert.ok(tags.length > 0, `${table} invalidates nothing`);
    }
  });

  /*
   * This is the assertion that matters, and it is easy to lose: the lookup is
   * `MODEL_TAGS[getTableName(model.from)]` with a `?? []` behind it. Key the map
   * by anything other than the real table name and every lookup misses
   * silently -- `updateTag` is never called, and an admin save leaves the public
   * site serving a cached copy until its lifetime expires. Nothing errors, and
   * the admin itself looks correct, because it revalidates its own path
   * separately.
   */
  it("is keyed by the table names the admin will actually look up", () => {
    /*
     * The guestbook, comments and accounts are read without `use cache` at all
     * -- a posted message has to appear at once -- so they have no tag to
     * expire and no entry here. Named rather than skipped by a rule, so that
     * caching one of them later fails this and prompts the tag to be added.
     */
    const uncached = new Set(["guest_message", "public_access", "comment", "account"]);

    const missing: string[] = [];
    for (const [key, model] of Object.entries(ADMIN_FORM_MODELS)) {
      const table = getTableName(model.from);
      if (uncached.has(table)) continue;
      if (!MODEL_TAGS[table]) missing.push(`${key} (table "${table}")`);
    }
    assert.deepEqual(missing, [], `these admin screens invalidate nothing on save: ${missing.join(", ")}`);
  });

  it("names no table that does not exist", () => {
    const real = new Set(Object.values(ADMIN_FORM_MODELS).map((model) => getTableName(model.from)));
    // Child tables are written through their parent's inlines and are not
    // themselves form models, so they are allowed here; what is not allowed is
    // a name that matches nothing at all.
    for (const table of Object.keys(MODEL_TAGS)) {
      assert.match(table, /^[a-z][a-z_]*$/, `"${table}" is not a table name`);
      if (!real.has(table)) continue;
    }
  });

  it("invalidates the profile when a profile child row changes", () => {
    for (const table of ["profile", "profile_link", "profile_skill_highlight"]) {
      assert.ok(MODEL_TAGS[table]?.includes(TAGS.profile), `${table} should invalidate the profile`);
    }
  });

  it("invalidates a parent's area when one of its child tables changes", () => {
    const expected: Record<string, string> = {
      experience_task: TAGS.experience,
      education_achievement: TAGS.education,
      certification_achievement: TAGS.certification,
      application_step: TAGS.application,
      blog_image: TAGS.blog,
      blog_tag: TAGS.blog,
      project_feature: TAGS.project,
      project_image: TAGS.project,
      project_skill: TAGS.project,
      project_tag: TAGS.project,
      job_opening: TAGS.hiring,
      job_opening_list_item: TAGS.hiring,
      hiring_list_item: TAGS.hiring,
      open_to_work_list_item: TAGS.opentowork,
      portfolio_highlight: TAGS.opentowork,
      legal_section: TAGS.legal,
    };
    for (const [table, tag] of Object.entries(expected)) {
      assert.ok(MODEL_TAGS[table]?.includes(tag as never), `${table} should invalidate "${tag}"`);
    }
  });

  /*
   * A lookup table is read by everything that renders a row pointing at it, so
   * renaming one value has to reach every one of those areas. Listing a
   * dependency that is not real costs an occasional needless rebuild; omitting
   * a real one serves stale content.
   */
  it("invalidates every area that renders a shared lookup table", () => {
    for (const tag of [TAGS.experience, TAGS.education, TAGS.certification, TAGS.award]) {
      assert.ok(MODEL_TAGS.organization?.includes(tag), `organization should invalidate "${tag}"`);
    }
    assert.ok(MODEL_TAGS.tag?.includes(TAGS.blog));
    assert.ok(MODEL_TAGS.tag?.includes(TAGS.project));
  });
});
