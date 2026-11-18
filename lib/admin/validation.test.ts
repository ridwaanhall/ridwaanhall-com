import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { legalSection } from "@/lib/db/app-schema";

import {
  ANCESTOR_LIMIT,
  parseFormValues,
  valuesForValidation,
  type FormValues,
  type ValidationContext,
} from "./form";
import { legalSectionForm } from "./models/legal";
import { patchNoteForm, versionProblem } from "./models/patch-notes";
import { userForm } from "./models/users";

/*
 * The `validate` rules, driven the way `saveRecord` drives them: values from
 * the real parser, merged with the stored record by the real helper, and a
 * context whose database capabilities are stubs. Nothing here may query --
 * `tests/setup.ts` points the database at nowhere, so a stub that fell through
 * to a real call would fail at connect.
 */

const OWNER = "11111111-1111-4111-8111-111111111111";
const EDITOR = "22222222-2222-4222-8222-222222222222";

const context = (over: Partial<ValidationContext> = {}): ValidationContext => ({
  id: null,
  actorId: EDITOR,
  actorIsSuperuser: false,
  exists: async () => {
    throw new Error("exists() was not expected here");
  },
  ancestors: async () => {
    throw new Error("ancestors() was not expected here");
  },
  ...over,
});

const form = (entries: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.append(key, value);
  return data;
};

/** What `saveRecord` puts in `values` for the user form: the parsed fields. */
const submittedUser = (data: FormData): FormValues => {
  const parsed = parseFormValues(userForm, data, OWNER);
  assert.ok(parsed.ok, "the user form should parse");
  return parsed.values;
};

/** The owner's row as `loadStoredRecord` would read it. */
const storedOwner: FormValues = {
  username: "owner",
  email: "owner@example.invalid",
  providers: "github",
  isStaff: true,
  isActive: true,
  isSuperuser: true,
};

describe("valuesForValidation", () => {
  it("adds the stored read-only facts the parser skipped, so the users rule can see isSuperuser", () => {
    const submitted = submittedUser(form({ isStaff: "on" }));
    assert.equal("isSuperuser" in submitted, false, "the parser never yields a read-only field");

    const values = valuesForValidation(userForm, OWNER, submitted, storedOwner);
    assert.equal(values.isSuperuser, true);
    assert.equal(values.isActive, false, "a submitted field keeps the submitted value");
    assert.equal(values.isStaff, true);
  });

  it("lets a stored read-only fact win over the same name in the submitted values", () => {
    const values = valuesForValidation(userForm, OWNER, { isStaff: true, isSuperuser: false }, storedOwner);
    assert.equal(values.isSuperuser, true);
  });

  it("does not change the submitted object, which is what gets written", () => {
    const submitted = submittedUser(form({ isStaff: "on", isActive: "on" }));
    const before = { ...submitted };
    valuesForValidation(userForm, OWNER, submitted, storedOwner);
    assert.deepEqual(submitted, before);
  });

  it("adds nothing on create, when there is no stored record", () => {
    const submitted = { version: "1.0.0" };
    assert.deepEqual(valuesForValidation(patchNoteForm, null, submitted, null), submitted);
  });
});

describe("the users form refuses an editor taking an owner's access", () => {
  const validateOwner = (data: FormData, actorIsSuperuser: boolean) =>
    userForm.validate!(
      valuesForValidation(userForm, OWNER, submittedUser(data), storedOwner),
      context({ id: OWNER, actorIsSuperuser }),
    );

  it("refuses a non-owner deactivating an owner", async () => {
    assert.equal(await validateOwner(form({ isStaff: "on" }), false), "Only an owner can take away an owner’s access.");
  });

  it("refuses a non-owner clearing an owner's editor flag", async () => {
    const problem = await validateOwner(form({ isActive: "on" }), false);
    // The shape rule fires first, and refuses everybody: an owner is always staff.
    assert.match(problem ?? "", /owner is always an editor/);
  });

  it("allows an owner deactivating another owner", async () => {
    assert.equal(await validateOwner(form({ isStaff: "on" }), true), null);
  });

  it("allows a non-owner an untouched save of an owner", async () => {
    assert.equal(await validateOwner(form({ isStaff: "on", isActive: "on" }), false), null);
  });

  it("was blind before: without the stored facts the guard let the deactivation through", async () => {
    const problem = await userForm.validate!(submittedUser(form({ isStaff: "on" })), context({ id: OWNER }));
    assert.equal(problem, null);
  });
});

describe("the legal-section form refuses a parent cycle", () => {
  const A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const C = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

  /** A stub of the walk `saveRecord` supplies, over an in-memory parent map. */
  const walk = (parents: Record<string, string | null>): ValidationContext["ancestors"] =>
    async (table, idColumn, parentColumn, startId) => {
      assert.equal(table, legalSection);
      assert.equal(idColumn, legalSection.id);
      assert.equal(parentColumn, legalSection.parentId);
      const chain: string[] = [];
      let current: string | null = startId;
      while (current !== null && current in parents && !chain.includes(current) && chain.length < ANCESTOR_LIMIT) {
        chain.push(current);
        current = parents[current];
      }
      return chain;
    };

  it("refuses B under A when A is already under B", async () => {
    const problem = await legalSectionForm.validate!(
      { parentId: A },
      context({ id: B, ancestors: walk({ [A]: B, [B]: null }) }),
    );
    assert.equal(problem, "A section cannot be nested under one of its own subsections.");
  });

  it("refuses a loop closed further up the chain", async () => {
    // C under B under A; putting A under C closes A -> C -> B -> A.
    const problem = await legalSectionForm.validate!(
      { parentId: C },
      context({ id: A, ancestors: walk({ [A]: null, [B]: A, [C]: B }) }),
    );
    assert.equal(problem, "A section cannot be nested under one of its own subsections.");
  });

  it("still refuses a section nested under itself, without walking", async () => {
    const problem = await legalSectionForm.validate!({ parentId: A }, context({ id: A }));
    assert.equal(problem, "A section cannot be nested under itself.");
  });

  it("allows an ordinary reparent", async () => {
    const problem = await legalSectionForm.validate!(
      { parentId: C },
      context({ id: B, ancestors: walk({ [A]: null, [B]: A, [C]: null }) }),
    );
    assert.equal(problem, null);
  });

  it("allows a top-level section and a new one without walking", async () => {
    assert.equal(await legalSectionForm.validate!({ parentId: null }, context({ id: B })), null);
    assert.equal(await legalSectionForm.validate!({ parentId: A }, context({ id: null })), null);
  });

  it("refuses when the walk was cut short, since the answer is unknown", async () => {
    const long: ValidationContext["ancestors"] = async () =>
      Array.from({ length: ANCESTOR_LIMIT }, (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`);
    const problem = await legalSectionForm.validate!({ parentId: C }, context({ id: A, ancestors: long }));
    assert.match(problem ?? "", /nested too deeply/);
  });
});

describe("the patch-note version", () => {
  it("accepts three components from 0 to 9999", () => {
    for (const version of ["0.0.0", "4.1.0", "4.10.12", "9999.9999.9999"]) {
      assert.equal(versionProblem(version), null, version);
    }
  });

  it("refuses a component past 9999, which release numbering cannot carry exactly", () => {
    for (const version of ["10000.0.0", "1.99999.0", "1000000000000000000000.0.0"]) {
      assert.notEqual(versionProblem(version), null, version);
    }
  });

  it("refuses leading zeros, which would name one tag twice", () => {
    for (const version of ["01.0.0", "4.01.0", "4.1.00"]) {
      assert.notEqual(versionProblem(version), null, version);
    }
  });

  it("refuses anything that is not three dotted numbers", () => {
    for (const version of ["", "4.1", "4.1.0.0", "v4.1.0", "4.1.-0", "4.1.0 ", "4..0"]) {
      assert.notEqual(versionProblem(version), null, JSON.stringify(version));
    }
  });

  it("is checked on create through the form's validate, with a sentence", async () => {
    assert.match(
      (await patchNoteForm.validate!({ version: "1000000000000000000000.0.0" }, context())) ?? "",
      /three numbers from 0 to 9999/,
    );
    assert.equal(await patchNoteForm.validate!({ version: "4.2.0" }, context()), null);
  });

  it("does not re-judge a stored version on an edit", async () => {
    assert.equal(await patchNoteForm.validate!({ version: "01.0.0" }, context({ id: OWNER })), null);
  });
});
