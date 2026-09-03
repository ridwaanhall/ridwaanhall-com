import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
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
  /*
   * Read out of the read paths, not written down beside them.
   *
   * The list this replaced named four areas an organization is rendered by. A
   * fifth had been added since -- `getApplications` selects `organization.name`
   * for every card -- so the list was wrong, the assertion agreed with it, and
   * renaming an organization left stale company names on screen with every
   * check green. A second transcription of the same fact cannot catch the first
   * one being incomplete; only something that derives it can.
   *
   * The rule is narrower than "list every area", and it is the one that
   * matters: a cached read path that reads the table has to lose its entry when
   * a row in that table changes, and an entry goes when *any* of its tags is
   * expired. So each such function needs one tag in common with the list -- not
   * all of them.
   */
  it("invalidates every read path that renders a shared lookup table", () => {
    const missing: string[] = [];
    for (const [table, tags] of Object.entries(MODEL_TAGS)) {
      // Widened, because a tag read out of source is a plain string.
      const expiring = new Set<string>(tags);
      for (const [fn, reads] of cachedReadPaths()) {
        if (!reads.tables.has(table)) continue;
        if (reads.tags.some((tag) => expiring.has(tag))) continue;
        missing.push(`${fn} reads "${table}" and is tagged [${reads.tags.join(", ")}]`);
      }
    }
    assert.deepEqual(missing, [], `these read paths keep serving stale rows: ${missing.join("; ")}`);
  });
});

/**
 * Every `"use cache"` function in `lib/data/`, with the tables it names and the
 * tags it carries.
 *
 * A text scan rather than a parser, and it can afford to be: a read path here
 * is one `export async function`, its tags are the `cacheTag(...)` calls in its
 * own body.
 *
 * What counts as reading a table is deliberately narrow -- it has to be handed
 * to `from` or to a join. Searching the whole body for the name instead
 * reported eight more, every one of them a local variable named `profile` or
 * the word "projects" inside a comment. A check that names innocent code
 * beside the guilty is one somebody learns to skim.
 */
function cachedReadPaths(): Map<string, { tables: Set<string>; tags: string[] }> {
  const dir = fileURLToPath(new URL(".", import.meta.url));
  const found = new Map<string, { tables: Set<string>; tags: string[] }>();
  const tables = Object.keys(MODEL_TAGS);
  const tagValues = new Map(Object.entries(TAGS).map(([key, value]) => [key, value as string]));

  for (const file of readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))) {
    const body = readFileSync(dir + file, "utf8");
    for (const chunk of body.split(/\nexport /)) {
      const name = /^async function (\w+)/.exec(chunk)?.[1];
      if (!name || !chunk.includes('"use cache"')) continue;

      // A call can carry more than one -- `cacheTag(TAGS.profile, TAGS.skill)`.
      // Reading only the first argument is how this check came to report two
      // read paths that were tagged perfectly well.
      const tags = [...chunk.matchAll(new RegExp(String.raw`cacheTag\(([^)]*)\)`, 'g'))]
        .flatMap(([, args]) => [...args.matchAll(new RegExp(String.raw`TAGS\.(\w+)|"([^"]+)"`, 'g'))])
        .map(([, key, literal]) => (key ? tagValues.get(key) : literal))
        .filter((tag): tag is string => Boolean(tag));

      const named = new Set(tables.filter((table) => binds(chunk, camel(table))));
      found.set(`${file}:${name}`, { tables: named, tags });
    }
  }
  return found;
}

/**
 * Whether a query in this chunk binds the named table.
 *
 * `from(x)` and the four joins are the only ways a table enters a Drizzle
 * select, so this is the whole surface -- and unlike a bare name search it
 * cannot be fooled by a comment, or by a local variable that happens to agree.
 */
function binds(chunk: string, table: string): boolean {
  const call = String.raw`(?:from|innerJoin|leftJoin|rightJoin|fullJoin)\(\s*`;
  return new RegExp(call + table + String.raw`\b`).test(chunk);
}


/** `guest_message` is `guestMessage` where a query names it. */
function camel(table: string): string {
  return table.replace(/_(\w)/g, (_, c: string) => c.toUpperCase());
}
