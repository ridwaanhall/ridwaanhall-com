import assert from "node:assert/strict";
import { describe, it } from "node:test";

import * as choices from "./choices";

type Choice = { value: string; label: string };
const lists = Object.entries(choices).filter(
  (entry): entry is [string, Choice[]] =>
    Array.isArray(entry[1]) &&
    entry[1].every((item) => item && typeof item === "object" && "value" in item && "label" in item),
);

/*
 * These are the fixed vocabularies the admin filters and selects on. A `jsonb`
 * column cannot express a vocabulary the way a lookup table can, so these lists
 * *are* the constraint -- `parseFields` drops anything posted from outside one.
 */
describe("every choice list", () => {
  it("there are some to check", () => {
    assert.ok(lists.length > 0);
  });

  it("offers at least one option", () => {
    for (const [name, list] of lists) assert.ok(list.length > 0, `${name} is empty`);
  });

  it("gives every option a value and a label", () => {
    for (const [name, list] of lists) {
      for (const choice of list) {
        assert.ok(choice.value.length > 0, `${name}: an option has no value`);
        assert.ok(choice.label.length > 0, `${name}: option "${choice.value}" has no label`);
      }
    }
  });

  /*
   * A duplicate value is a select where two options store the same thing and
   * one of them can never be chosen back -- the form reopens on the first.
   */
  it("gives every option a distinct value", () => {
    for (const [name, list] of lists) {
      const values = list.map((choice) => choice.value);
      assert.equal(new Set(values).size, values.length, `${name}: duplicate value`);
    }
  });

  it("gives every option a distinct label, so two rows do not read alike", () => {
    for (const [name, list] of lists) {
      const labels = list.map((choice) => choice.label);
      assert.equal(new Set(labels).size, labels.length, `${name}: duplicate label`);
    }
  });

  it("stores no value with padding, which would not match on read back", () => {
    for (const [name, list] of lists) {
      for (const choice of list) {
        assert.equal(choice.value, choice.value.trim(), `${name}: "${choice.value}" is padded`);
      }
    }
  });
});
