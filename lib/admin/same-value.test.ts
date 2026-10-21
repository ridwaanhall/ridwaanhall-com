import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { blogPost } from "@/lib/db/app-schema";

import type { FormField } from "./form";
import { keepStoredTime, sameFormValue, sameFormValues } from "./same-value";

const field = (kind: FormField["kind"], name = "value"): FormField => ({
  name,
  column: blogPost.title,
  label: name,
  kind,
});

/*
 * Each case is a shape the loader and the parser disagree on while the value
 * does not -- the reason an untouched save could not simply compare strictly.
 * The negative half matters as much: a false "unchanged" drops an edit.
 */
describe("sameFormValue", () => {
  it("treats every blank as the same blank", () => {
    assert.ok(sameFormValue(field("text"), null, ""));
    assert.ok(sameFormValue(field("text"), "", null));
    assert.ok(sameFormValue(field("url"), undefined, null));
  });

  it("ignores the whitespace the parser trims", () => {
    assert.ok(sameFormValue(field("textarea"), "A line\n", "A line"));
    assert.ok(!sameFormValue(field("textarea"), "A line", "A line, edited"));
  });

  it("compares numbers as numbers", () => {
    assert.ok(sameFormValue(field("number"), 3, 3));
    assert.ok(sameFormValue(field("number"), "3", 3));
    assert.ok(!sameFormValue(field("number"), 3, 4));
    assert.ok(!sameFormValue(field("number"), null, 0));
  });

  it("compares a checkbox by truth", () => {
    assert.ok(sameFormValue(field("checkbox"), false, false));
    assert.ok(!sameFormValue(field("checkbox"), true, false));
  });

  it("compares a many-to-many and a choice list as sets", () => {
    assert.ok(sameFormValue(field("many-to-many"), ["a", "b"], ["b", "a"]));
    assert.ok(sameFormValue(field("choice-list"), ["x", "y"], ["y", "x"]));
    assert.ok(!sameFormValue(field("many-to-many"), ["a", "b"], ["a"]));
  });

  it("keeps the order of a string list", () => {
    assert.ok(sameFormValue(field("string-list"), ["a", "b"], ["a", "b"]));
    assert.ok(!sameFormValue(field("string-list"), ["a", "b"], ["b", "a"]));
  });

  it("compares a mapping entry by entry", () => {
    assert.ok(sameFormValue(field("key-value"), { a: "1" }, { a: "1" }));
    assert.ok(!sameFormValue(field("key-value"), { a: "1" }, { a: "2" }));
  });

  it("compares a timestamp to the minute its control shows", () => {
    assert.ok(sameFormValue(field("datetime"), "2026-01-23 10:23:45.123456+00", "2026-01-23T10:23:00.000Z"));
    assert.ok(!sameFormValue(field("datetime"), "2026-01-23 10:23:45+00", "2026-01-23T10:24:00.000Z"));
  });

  it("compares a date by its day", () => {
    assert.ok(sameFormValue(field("date"), "2025-11-01", "2025-11-01"));
    assert.ok(!sameFormValue(field("date"), "2025-11-01", "2025-11-02"));
  });
});

describe("sameFormValues", () => {
  it("only asks about the fields that were submitted", () => {
    const fields = [field("text", "title"), field("text", "slug")];
    assert.ok(sameFormValues(fields, { title: "A", slug: "a" }, { title: "A" }));
    assert.ok(!sameFormValues(fields, { title: "A", slug: "a" }, { title: "B" }));
  });
});

describe("keepStoredTime", () => {
  it("keeps the stored seconds when the minute is unchanged", () => {
    const stored = "2026-01-23 10:23:45.123456+00";
    assert.equal(keepStoredTime(stored, "2026-01-23T10:23:00.000Z"), stored);
  });

  it("takes the new value when the minute moved", () => {
    assert.equal(keepStoredTime("2026-01-23 10:23:45+00", "2026-01-23T11:00:00.000Z"), "2026-01-23T11:00:00.000Z");
  });

  it("leaves a cleared value cleared", () => {
    assert.equal(keepStoredTime("2026-01-23 10:23:45+00", null), null);
  });
});
