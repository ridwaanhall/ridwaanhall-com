import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_COLOR_TOKENS,
  projectStatusColor,
} from "./project-status";

/**
 * The test this file used to be compared the module's own maps against each
 * other -- every status has a label, every status has a colour -- which is a
 * tautology as soon as both come from the same object literal. It passed for
 * the whole time the keys disagreed with `project_status.slug` and every badge
 * on the site rendered in the fallback.
 *
 * The keys are colour tokens now rather than status slugs, and the same rule
 * applies with the same force: **nothing here may be proved by another constant
 * in this module.** So what is asserted is the shape a token has to have, and
 * the one relationship a transcription can get wrong -- that a token's classes
 * actually name that token's hue. `bg-violet-400/90` filed under `purple` is a
 * badge that renders the wrong colour with every test green.
 *
 * The other half of the contract is the database's `project_status_color_check`
 * listing the same tokens, and that genuinely cannot be checked from here: it
 * is a different source, which is the point. `scripts/check-db-classes.mjs`
 * compares the two against the live schema.
 */

describe("PROJECT_STATUS_COLORS", () => {
  it("is keyed by a colour token: one lowercase word, no hyphens", () => {
    for (const key of Object.keys(PROJECT_STATUS_COLORS)) {
      assert.match(key, /^[a-z]+$/, `${key} is not a colour token`);
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

  /*
   * The one thing a hand-written map of eighteen pairs actually gets wrong.
   * Both utilities have to name the key's own hue: a pair copied from the line
   * above and half-edited renders a colour nobody chose, and every other
   * assertion here would still pass.
   */
  it("gives each token its own hue in both utilities", () => {
    for (const [token, classes] of Object.entries(PROJECT_STATUS_COLORS)) {
      assert.ok(
        classes.includes(`bg-${token}-`),
        `${token} has a background of another colour: ${classes}`,
      );
      assert.ok(
        classes.includes(`text-${token}-`),
        `${token} has a text colour of another colour: ${classes}`,
      );
    }
  });

  it("offers the tokens the admin's dropdown is built from", () => {
    assert.ok(PROJECT_STATUS_COLOR_TOKENS.length > 0);
    for (const token of PROJECT_STATUS_COLOR_TOKENS) {
      assert.notEqual(projectStatusColor(token), projectStatusColor(null), token);
    }
  });
});

describe("projectStatusColor", () => {
  it("returns the pair a known token names", () => {
    assert.equal(projectStatusColor("emerald"), PROJECT_STATUS_COLORS.emerald);
    assert.equal(projectStatusColor("blue"), PROJECT_STATUS_COLORS.blue);
  });

  it("is case-insensitive, since the value arrives from a column", () => {
    assert.equal(projectStatusColor("EMERALD"), projectStatusColor("emerald"));
  });

  /*
   * A project with no status row at all still reaches this: `status_id` is
   * nullable, and the read path passes an empty string for it.
   */
  it("falls back rather than returning nothing", () => {
    const fallback = projectStatusColor(null);
    assert.ok(fallback);
    assert.equal(projectStatusColor(undefined), fallback);
    assert.equal(projectStatusColor(""), fallback);
  });

  /*
   * The column's own name, not a status slug. Keying on the slug is what this
   * change replaced, and a caller that still passes one gets the fallback --
   * loudly wrong on screen rather than quietly right by coincidence.
   */
  it("does not answer to a status slug", () => {
    assert.equal(projectStatusColor("development-in-progress"), projectStatusColor(null));
    assert.equal(projectStatusColor("completed"), projectStatusColor(null));
  });
});
