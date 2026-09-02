import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { ADMIN_ENTRIES } from "@/lib/admin/registry";
import { ADMIN_ACTIONS, grantableEntries, type AdminAction } from "@/lib/auth/permissions";
import {
  ACCESS_PRESETS,
  DEFAULT_STAFF_PRESET,
  grantsForPreset,
  presetByKey,
} from "@/lib/auth/presets";

/**
 * The presets, offline.
 *
 * **Asserted against the registry, never against a list written here.** The
 * rule `permissions.test.ts` states applies with more force to this module: a
 * preset's whole reason for being declared per *group* is that a list of keys
 * goes out of date the moment a screen is added, and a test that carried its
 * own copy of that list would go out of date in exactly the same silence.
 *
 * So the group whose screens must never be granted is found by asking the
 * registry which entries are in it, and "every screen is covered" is asserted
 * against `grantableEntries` rather than against a number.
 */

/** The group a preset must never reach, named once because the rule is about it. */
const PEOPLE: (typeof ADMIN_ENTRIES)[number]["group"] = "Users";

const GRANTABLE = grantableEntries(ADMIN_ENTRIES);

describe("ACCESS_PRESETS", () => {
  it("offers a default, and the default exists", () => {
    assert.ok(presetByKey(DEFAULT_STAFF_PRESET));
  });

  it("names only groups the registry has", () => {
    const groups = new Set(ADMIN_ENTRIES.map((entry) => entry.group));
    for (const preset of ACCESS_PRESETS) {
      for (const group of Object.keys(preset.groups)) {
        assert.ok(groups.has(group as (typeof ADMIN_ENTRIES)[number]["group"]), group);
      }
    }
  });

  it("grants nothing on the accounts group, in any preset", () => {
    const people = GRANTABLE.filter((entry) => entry.group === PEOPLE).map((entry) => entry.key);
    assert.ok(people.length > 0, "the registry still has a group about people");

    for (const preset of ACCESS_PRESETS) {
      const grants = grantsForPreset(preset);
      for (const key of people) {
        for (const action of ADMIN_ACTIONS) {
          assert.equal(grants[key]?.[action], false, `${preset.key} grants ${action} on ${key}`);
        }
      }
    }
  });

  it("never produces a grant for a screen that cannot be granted", () => {
    const grantable = new Set(GRANTABLE.map((entry) => entry.key));
    for (const preset of ACCESS_PRESETS) {
      for (const key of Object.keys(grantsForPreset(preset))) {
        assert.ok(grantable.has(key), `${preset.key} names ${key}`);
      }
    }
  });

  it("answers for every grantable screen, so a narrower preset clears a wider one", () => {
    for (const preset of ACCESS_PRESETS) {
      const grants = grantsForPreset(preset);
      assert.equal(Object.keys(grants).length, GRANTABLE.length, preset.key);
      for (const entry of GRANTABLE) assert.ok(grants[entry.key], `${preset.key} skips ${entry.key}`);
    }
  });

  it("turns view on wherever it grants anything else", () => {
    for (const preset of ACCESS_PRESETS) {
      for (const [key, grant] of Object.entries(grantsForPreset(preset))) {
        const acts = (["add", "change", "delete"] as AdminAction[]).filter((act) => grant[act]);
        if (acts.length > 0) assert.equal(grant.view, true, `${preset.key}: ${key}`);
      }
    }
  });

  it("grants something somewhere, in each of them", () => {
    for (const preset of ACCESS_PRESETS) {
      const grants = grantsForPreset(preset);
      const reached = Object.values(grants).filter((grant) => grant.view).length;
      assert.ok(reached > 0, `${preset.key} reaches nothing`);
    }
  });

  it("has a read-only preset that changes nothing anywhere", () => {
    const viewer = presetByKey("viewer")!;
    for (const grant of Object.values(grantsForPreset(viewer))) {
      assert.equal(grant.add, false);
      assert.equal(grant.change, false);
      assert.equal(grant.delete, false);
    }
  });

  it("has a default that reaches more screens than the moderator does", () => {
    const reach = (key: string) =>
      Object.values(grantsForPreset(presetByKey(key)!)).filter((grant) => grant.view).length;
    assert.ok(reach(DEFAULT_STAFF_PRESET) > reach("moderator"));
  });
});
