import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { blogPost } from "@/lib/db/app-schema";

import { parseFields, slugify, type FormField } from "./form";

/*
 * Real columns rather than stubs, because half of what this parsing decides is
 * read off the column: `title` is `NOT NULL`, `readTime` is nullable, and a
 * field left blank stores `""` for one and `null` for the other. A stub column
 * would let a wrong answer pass.
 */
const field = (over: Partial<FormField> & Pick<FormField, "name" | "column">): FormField => ({
  label: over.name,
  kind: "text",
  ...over,
});

const form = (entries: Record<string, string | string[]>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const one of Array.isArray(value) ? value : [value]) data.append(key, one);
  }
  return data;
};

const parsed = (fields: FormField[], data: FormData) => {
  const result = parseFields(fields, data);
  assert.ok(result.ok, `expected a parse, got errors: ${JSON.stringify(result.ok ? {} : result.errors)}`);
  return result.values;
};

const errors = (fields: FormField[], data: FormData) => {
  const result = parseFields(fields, data);
  assert.ok(!result.ok, "expected errors, got a clean parse");
  return result.errors;
};

const title = field({ name: "title", column: blogPost.title, label: "Title" });
const readTime = field({ name: "readTime", column: blogPost.readTime, label: "Read time", kind: "number" });

describe("reading plain fields", () => {
  it("reads a value and trims it, because a trailing space in a name is a typo", () => {
    assert.deepEqual(parsed([title], form({ title: "  A post  " })), { title: "A post" });
  });

  it("reports a required field left blank rather than storing an empty one", () => {
    const required = field({ ...title, required: true });
    assert.match(errors([required], form({ title: "   " })).title, /required/i);
  });

  /*
   * The two meanings of "optional" are a real distinction here: writing `null`
   * into a `NOT NULL DEFAULT ''` column is an integrity error, and writing `""`
   * into a nullable integer is a type error.
   */
  it("stores an empty string for a blank NOT NULL column", () => {
    assert.deepEqual(parsed([title], form({ title: "" })), { title: "" });
  });

  it("stores null for a blank nullable column", () => {
    assert.deepEqual(parsed([readTime], form({ readTime: "" })), { readTime: null });
  });

  it("reads a number as a number, not as its text", () => {
    assert.deepEqual(parsed([readTime], form({ readTime: "7" })), { readTime: 7 });
  });

  it("reports a number that is not one", () => {
    assert.ok(errors([readTime], form({ readTime: "seven" })).readTime);
  });

  it("reads a checkbox as a boolean, absent meaning false", () => {
    const featured = field({ name: "isFeatured", column: blogPost.isFeatured, kind: "checkbox" });
    assert.deepEqual(parsed([featured], form({ isFeatured: "on" })), { isFeatured: true });
    assert.deepEqual(parsed([featured], form({})), { isFeatured: false });
  });

  /*
   * The descriptor is walked, not the `FormData`. A field posted by hand that
   * the descriptor does not declare reaches nothing -- a writable column set
   * that comes from the request is not a writable column set.
   */
  it("ignores a field the descriptor does not declare", () => {
    const values = parsed([title], form({ title: "A post", isFeatured: "on", views: "9999" }));
    assert.deepEqual(Object.keys(values), ["title"]);
  });

  it("ignores a read-only field, since it is shown rather than edited", () => {
    const shown = field({ ...title, readOnly: true });
    assert.deepEqual(parsed([shown], form({ title: "tampered" })), {});
  });
});

describe("newlines", () => {
  /*
   * A textarea's submission value is CRLF-normalised per the HTML spec, and the
   * stored data contains no carriage return at all. Left alone, every save
   * rewrites the whole body.
   */
  it("normalises CRLF to LF, so a save does not rewrite the body", () => {
    const body = field({ name: "description", column: blogPost.description, kind: "textarea" });
    assert.deepEqual(parsed([body], form({ description: "one\r\ntwo\rthree" })), {
      description: "one\ntwo\nthree",
    });
  });
});

describe("slug fields", () => {
  it("fills a blank slug from its source", () => {
    const slug = field({ name: "slug", column: blogPost.slug, kind: "slug", slugFrom: "title" });
    assert.deepEqual(parsed([title, slug], form({ title: "A New Post", slug: "" })), {
      title: "A New Post",
      slug: "a-new-post",
    });
  });

  it("leaves a slug that was typed alone", () => {
    const slug = field({ name: "slug", column: blogPost.slug, kind: "slug", slugFrom: "title" });
    const values = parsed([title, slug], form({ title: "A New Post", slug: "chosen-slug" }));
    assert.equal(values.slug, "chosen-slug");
  });

  it("reports a slug with characters a URL should not carry", () => {
    const slug = field({ name: "slug", column: blogPost.slug, kind: "slug" });
    assert.ok(errors([slug], form({ slug: "Not A Slug!" })).slug);
  });
});

describe("url fields", () => {
  const url = field({ name: "url", column: blogPost.description, kind: "url", label: "URL" });

  it("accepts an absolute http(s) URL", () => {
    assert.equal(parsed([url], form({ url: "https://example.com/x" })).url, "https://example.com/x");
  });

  it("reports anything that is not one, rather than storing a broken link", () => {
    for (const value of ["example.com", "javascript:alert(1)", "/relative"]) {
      assert.ok(errors([url], form({ url: value })).url, `expected ${value} to be reported`);
    }
  });
});

describe("the JSON editors", () => {
  const list = field({ name: "items", column: blogPost.description, kind: "string-list", label: "Items" });
  const pairs = field({ name: "pairs", column: blogPost.description, kind: "key-value", label: "Pairs" });

  it("reads a list", () => {
    assert.deepEqual(parsed([list], form({ items: '["one","two"]' })).items, ["one", "two"]);
  });

  it("reads a mapping", () => {
    assert.deepEqual(parsed([pairs], form({ pairs: '{"a":"1","b":"2"}' })).pairs, { a: "1", b: "2" });
  });

  /*
   * Never normalised: whitespace inside a stored value can be significant, and
   * these editors are the one place the parser must not tidy.
   */
  it("preserves whitespace inside an entry, unlike a plain text field", () => {
    assert.deepEqual(parsed([list], form({ items: '["  padded  "]' })).items, ["  padded  "]);
    assert.deepEqual(parsed([pairs], form({ pairs: '{"  key  ":"  value  "}' })).pairs, {
      "  key  ": "  value  ",
    });
  });

  it("drops the blank row the editor's add button leaves behind", () => {
    assert.deepEqual(parsed([list], form({ items: '["one","","two"]' })).items, ["one", "two"]);
  });

  it("stores an empty list rather than the previous one when the editor is cleared", () => {
    assert.deepEqual(parsed([list], form({ items: "" })).items, []);
    assert.deepEqual(parsed([pairs], form({ pairs: "" })).pairs, {});
  });

  it("normalises newlines inside an entry too", () => {
    assert.deepEqual(parsed([list], form({ items: '["a\\r\\nb"]' })).items, ["a\nb"]);
  });

  it("reports malformed JSON as a field error rather than throwing", () => {
    assert.ok(errors([list], form({ items: "{not json" })).items);
  });

  it("reports the wrong JSON shape for the editor", () => {
    assert.match(errors([list], form({ items: '{"a":"1"}' })).items, /list/i);
    assert.match(errors([pairs], form({ pairs: '["a"]' })).pairs, /pairs/i);
  });

  it("reports an entry that is not text, naming which one", () => {
    assert.match(errors([list], form({ items: '["ok",5]' })).items, /2/);
  });
});

describe("choice fields", () => {
  const choices = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ];

  it("keeps the checked values, in the vocabulary's order", () => {
    const list = field({ name: "kinds", column: blogPost.description, kind: "choice-list", choices });
    assert.deepEqual(parsed([list], form({ kinds: ["a", "b"] })).kinds, ["a", "b"]);
  });

  /*
   * A `jsonb` column cannot express a vocabulary the way a lookup table can, so
   * the constraint has to be applied on the way in.
   */
  it("drops a value posted from outside the vocabulary", () => {
    const list = field({ name: "kinds", column: blogPost.description, kind: "choice-list", choices });
    assert.deepEqual(parsed([list], form({ kinds: ["a", "smuggled"] })).kinds, ["a"]);
  });

  it("reports a select whose value is not one of its options", () => {
    const select = field({ name: "kind", column: blogPost.description, kind: "select", choices });
    assert.ok(errors([select], form({ kind: "smuggled" })).kind);
  });
});

describe("inline prefixes", () => {
  it("reads a field posted under its inline's index", () => {
    const values = parseFields([title], form({ "positions:0:title": "Row one" }), "positions:0:");
    assert.ok(values.ok);
    if (values.ok) assert.deepEqual(values.values, { title: "Row one" });
  });
});

describe("slugify", () => {
  it("makes a slug a URL can carry", () => {
    assert.equal(slugify("A New Post"), "a-new-post");
    assert.equal(slugify("Rust & Go"), "rust-go");
    assert.equal(slugify("  spaced  out  "), "spaced-out");
  });

  it("is idempotent", () => {
    const once = slugify("Some Title Here");
    assert.equal(slugify(once), once);
  });
});
