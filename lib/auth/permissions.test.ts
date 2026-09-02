import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ADMIN_ENTRIES, ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import {
  ADMIN_ACTIONS,
  can,
  grantableEntries,
  hasAnyAccess,
  isReadOnly,
  NO_GRANT,
  permits,
  permittedKeys,
  roleAllows,
  withImpliedView,
  type AdminActor,
  type Grant,
} from "@/lib/auth/permissions";

/**
 * The permission rules, offline.
 *
 * **Asserted against the registry, never against another constant in this
 * module.** A test that compares two things defined side by side proves they
 * were typed the same way and nothing else -- which is how `project-status`
 * came to key its labels and its colours on underscores while the column held
 * hyphens, with a green test suite the whole time. So the keys here come from
 * `ADMIN_ENTRIES`, and the one that must not be grantable is asserted by its
 * own flag rather than by name.
 */

/** A key that certainly exists, taken from the registry rather than written. */
const ANY_KEY = ADMIN_ENTRIES.find((entry) => !entry.superuserOnly)!.key;

/** The screen that hands out grants, found by its flag. */
const SUPERUSER_ONLY = ADMIN_ENTRIES.find((entry) => entry.superuserOnly)!;

const ALL: Grant = { view: true, add: true, change: true, delete: true };

function actor(overrides: Partial<AdminActor> = {}): AdminActor {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    username: "tester",
    fullName: "Tester",
    email: "tester@example.com",
    isSuperuser: false,
    grants: {},
    ...overrides,
  };
}

describe("can", () => {
  it("answers yes for a superuser on every screen and every action", () => {
    const su = actor({ isSuperuser: true });
    for (const entry of ADMIN_ENTRIES) {
      for (const action of ADMIN_ACTIONS) {
        assert.equal(can(su, entry.key, action), true, `${entry.key}.${action}`);
      }
    }
  });

  it("answers yes for a superuser even on a key no screen has", () => {
    // There is nothing to protect from somebody who could grant themselves it
    // in the next click, and refusing would make a renamed screen unreachable
    // by the one account that has to fix it.
    assert.equal(can(actor({ isSuperuser: true }), "no-such-screen", "delete"), true);
  });

  it("refuses staff with no grants", () => {
    for (const action of ADMIN_ACTIONS) {
      assert.equal(can(actor(), ANY_KEY, action), false);
    }
  });

  it("answers from the grant for staff", () => {
    const who = actor({ grants: { [ANY_KEY]: { ...NO_GRANT, view: true, change: true } } });
    assert.equal(can(who, ANY_KEY, "view"), true);
    assert.equal(can(who, ANY_KEY, "change"), true);
    assert.equal(can(who, ANY_KEY, "add"), false);
    assert.equal(can(who, ANY_KEY, "delete"), false);
  });

  /*
   * `model_key` is a text column with no foreign key behind it, so a grant
   * naming a screen that no longer exists is a row the database keeps happily.
   * A renamed screen must not carry the old one's permissions forward.
   */
  it("refuses a grant naming a screen the registry does not have", () => {
    const who = actor({ grants: { "screen-that-was-renamed": ALL } });
    assert.equal(can(who, "screen-that-was-renamed", "view"), false);
  });

  it("refuses a grant on the screen that hands out grants", () => {
    const who = actor({ grants: { [SUPERUSER_ONLY.key]: ALL } });
    for (const action of ADMIN_ACTIONS) {
      assert.equal(can(who, SUPERUSER_ONLY.key, action), false, action);
    }
  });
});

describe("permittedKeys", () => {
  it("is every screen for a superuser, including the one that is never granted", () => {
    const keys = permittedKeys(actor({ isSuperuser: true }));
    assert.equal(keys.length, ADMIN_ENTRIES.length);
    assert.ok(keys.includes(SUPERUSER_ONLY.key));
  });

  it("is nothing for staff with no grants", () => {
    assert.deepEqual(permittedKeys(actor()), []);
  });

  it("lists only what view is granted on", () => {
    const who = actor({ grants: { [ANY_KEY]: { ...NO_GRANT, view: true } } });
    assert.deepEqual(permittedKeys(who), [ANY_KEY]);
  });

  it("returns keys the registry knows, in registry order", () => {
    const grants = Object.fromEntries(
      grantableEntries(ADMIN_ENTRIES).map((entry) => [entry.key, ALL]),
    );
    const keys = permittedKeys(actor({ grants }));
    for (const key of keys) assert.ok(ADMIN_ENTRIES_BY_KEY.has(key), key);

    const order = ADMIN_ENTRIES.map((entry) => entry.key);
    const positions = keys.map((key) => order.indexOf(key));
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  });
});

describe("roleAllows", () => {
  it("treats an unset flag as allowed", () => {
    assert.equal(roleAllows(undefined, false), true);
  });

  it("passes a plain boolean through for both roles", () => {
    assert.equal(roleAllows(true, false), true);
    assert.equal(roleAllows(false, true), false);
  });

  /*
   * The whole reason this function exists. `"superuser"` is a truthy string, so
   * a caller testing `flag !== false` reads it as *allowed* and hands the
   * action to everybody -- which type checks, lints and builds.
   */
  it("gives the third state to exactly one role", () => {
    assert.equal(roleAllows("superuser", true), true);
    assert.equal(roleAllows("superuser", false), false);
  });

  /*
   * Through a parameter rather than a local, so control-flow analysis cannot
   * narrow the value back to the literal and make the comparison below a type
   * error. That narrowing is precisely why the mistake is invisible in real
   * code: at the call site the flag arrives as the union, and `!== false` is a
   * perfectly well-typed way to get the wrong answer.
   */
  const naive = (flag: boolean | "superuser") => flag !== false;

  it("is not what a bare truthiness test would answer", () => {
    assert.equal(naive("superuser"), true, "the mistake this replaces");
    assert.equal(roleAllows("superuser", false), false, "and what it should say");
  });
});

describe("permits", () => {
  const model = { canCreate: true as boolean | "superuser", canDelete: true as boolean | "superuser" };

  it("needs the grant as well as the descriptor", () => {
    assert.equal(permits(actor(), ANY_KEY, "add", model), false);
    assert.equal(permits(actor({ grants: { [ANY_KEY]: ALL } }), ANY_KEY, "add", model), true);
  });

  /*
   * The rule that keeps the three singletons safe: a grant may not widen what a
   * descriptor refuses, whoever holds it.
   */
  it("never widens a descriptor's refusal, superuser included", () => {
    const refused = { canCreate: false as const, canDelete: false as const };
    assert.equal(permits(actor({ isSuperuser: true }), ANY_KEY, "add", refused), false);
    assert.equal(permits(actor({ isSuperuser: true }), ANY_KEY, "delete", refused), false);
  });

  it("gives a superuser-only action to a superuser and to nobody else", () => {
    const su = { canCreate: false as const, canDelete: "superuser" as const };
    const granted = actor({ grants: { [ANY_KEY]: ALL } });
    assert.equal(permits(granted, ANY_KEY, "delete", su), false);
    assert.equal(permits(actor({ isSuperuser: true }), ANY_KEY, "delete", su), true);
  });

  it("refuses writing through a model with no form descriptor", () => {
    const granted = actor({ grants: { [ANY_KEY]: ALL } });
    assert.equal(permits(granted, ANY_KEY, "add", null), false);
    assert.equal(permits(granted, ANY_KEY, "change", null), false);
    assert.equal(permits(granted, ANY_KEY, "delete", null), false);
    // Viewing needs no form: the record page renders what the list declares.
    assert.equal(permits(granted, ANY_KEY, "view", null), true);
  });
});

describe("withImpliedView", () => {
  it("turns view on for each of the other three", () => {
    for (const action of ["add", "change", "delete"] as const) {
      const grant = withImpliedView({ ...NO_GRANT, [action]: true });
      assert.equal(grant.view, true, action);
    }
  });

  it("leaves an empty grant empty", () => {
    assert.deepEqual(withImpliedView(NO_GRANT), NO_GRANT);
  });

  it("does not turn anything else on", () => {
    const grant = withImpliedView({ ...NO_GRANT, view: true });
    assert.deepEqual(grant, { view: true, add: false, change: false, delete: false });
  });
});

describe("isReadOnly and hasAnyAccess", () => {
  it("calls view without change read-only", () => {
    const who = actor({ grants: { [ANY_KEY]: { ...NO_GRANT, view: true } } });
    assert.equal(isReadOnly(who, ANY_KEY), true);
  });

  it("does not call a screen you cannot see read-only", () => {
    assert.equal(isReadOnly(actor(), ANY_KEY), false);
  });

  it("says a superuser has access even with no rows", () => {
    assert.equal(hasAnyAccess(actor({ isSuperuser: true })), true);
  });

  it("says staff with no rows has none", () => {
    assert.equal(hasAnyAccess(actor()), false);
  });
});

describe("grantableEntries", () => {
  it("drops exactly the superuser-only screens", () => {
    const grantable = grantableEntries(ADMIN_ENTRIES);
    assert.equal(grantable.length, ADMIN_ENTRIES.length - 1);
    assert.ok(!grantable.some((entry) => entry.superuserOnly));
  });

  /*
   * One, and it must stay one: a second superuser-only screen would be a second
   * thing no grant can reach, which is a decision worth making deliberately
   * rather than discovering.
   */
  it("leaves out one screen, and only one", () => {
    assert.equal(ADMIN_ENTRIES.filter((entry) => entry.superuserOnly).length, 1);
  });
});
