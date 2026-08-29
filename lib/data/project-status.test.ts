import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PROJECT_STATUS_COLORS, projectStatusColor } from "./project-status";

/**
 * The test this file used to be compared the module's own maps against each
 * other -- every status has a label, every status has a colour -- which is a
 * tautology as soon as both come from the same object literal. It passed for
 * the whole time the keys disagreed with `project_status.slug` and every badge
 * on the site rendered in the fallback.
 *
 * So the assertions below are about the *shape of a slug*, which is the thing
 * that actually has to match the database, and about the fallback, which is
 * what a status with no colour is supposed to get.
 */

describe("PROJECT_STATUS_COLORS", () => {
  it("is keyed the way a slug column is: lowercase, hyphenated, no underscores", () => {
    for (const key of Object.keys(PROJECT_STATUS_COLORS)) {
      assert.match(key, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${key} is not a slug`);
    }
  });

  it("names both a background and a foreground, written out in full", () => {
    for (const [key, classes] of Object.entries(PROJECT_STATUS_COLORS)) {
      assert.match(classes, /\bbg-/, `${key} has no background`);
      assert.match(classes, /\btext-/, `${key} has no text colour`);
      // An interpolated class is invisible to Tailwind's scanner, so a rule
      // built from a template literal would never be generated.
      assert.ok(!classes.includes("${"), `${key} is interpolated`);
    }
  });
});

describe("projectStatusColor", () => {
  it("returns the pair a known slug names", () => {
    assert.equal(projectStatusColor("completed"), PROJECT_STATUS_COLORS.completed);
    assert.equal(
      projectStatusColor("development-in-progress"),
      PROJECT_STATUS_COLORS["development-in-progress"],
    );
  });

  it("is case-insensitive, since the value arrives from a column", () => {
    assert.equal(projectStatusColor("COMPLETED"), projectStatusColor("completed"));
  });

  it("falls back rather than returning nothing for a status added since", () => {
    const fallback = projectStatusColor(null);
    assert.ok(fallback);
    assert.equal(projectStatusColor("awaiting-budget"), fallback);
    assert.equal(projectStatusColor(undefined), fallback);
    assert.equal(projectStatusColor(""), fallback);
  });

  it("never returns an underscored key's colour, because no row is keyed that way", () => {
    assert.equal(projectStatusColor("development_in_progress"), projectStatusColor(null));
  });
});
