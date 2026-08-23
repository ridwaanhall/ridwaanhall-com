import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IMAGE_TYPES, MAX_KEY_LENGTH, extensionOf, objectKeyFor } from "./keys";

const bytes = (text: string) => new TextEncoder().encode(text);
const ok = (result: ReturnType<typeof objectKeyFor>) => {
  assert.ok(result.ok, `expected a key, got: ${result.ok ? "" : result.error}`);
  return result;
};

describe("extensionOf", () => {
  it("reads the extension, lower-cased", () => {
    assert.equal(extensionOf("photo.WEBP"), ".webp");
    assert.equal(extensionOf("photo.png"), ".png");
  });

  it("takes the last dot, so a dotted name is not mistaken for one", () => {
    assert.equal(extensionOf("my.photo.final.png"), ".png");
  });

  it("returns nothing when there is no extension", () => {
    assert.equal(extensionOf("photo"), "");
    assert.equal(extensionOf(""), "");
  });
});

describe("objectKeyFor", () => {
  /*
   * Content-addressed: the same bytes uploaded twice are one object, which is
   * what makes an upload idempotent and what makes reference counting on
   * delete meaningful.
   */
  it("gives the same bytes the same key, every time", () => {
    const a = ok(objectKeyFor("logo", "photo.webp", bytes("same")));
    const b = ok(objectKeyFor("logo", "photo.webp", bytes("same")));
    assert.equal(a.key, b.key);
  });

  it("gives different bytes different keys, even under the same filename", () => {
    const a = ok(objectKeyFor("logo", "photo.webp", bytes("one")));
    const b = ok(objectKeyFor("logo", "photo.webp", bytes("two")));
    assert.notEqual(a.key, b.key);
  });

  it("files the object under the prefix it was given", () => {
    assert.ok(ok(objectKeyFor("logo", "a.webp", bytes("x"))).key.startsWith("logo/"));
    assert.ok(ok(objectKeyFor("blog", "a.webp", bytes("x"))).key.startsWith("blog/"));
    assert.ok(ok(objectKeyFor("profile", "a.webp", bytes("x"))).key.startsWith("profile/"));
  });

  it("keeps the extension, and reports the content type that matches it", () => {
    const result = ok(objectKeyFor("logo", "photo.png", bytes("x")));
    assert.ok(result.key.endsWith(".png"));
    assert.equal(result.contentType, IMAGE_TYPES[".png"]);
  });

  it("slugifies the filename into the key, so a key is URL-safe by construction", () => {
    const result = ok(objectKeyFor("logo", "My Company Logo (2026)!.webp", bytes("x")));
    assert.match(result.key, /^logo\/[a-z0-9-]+-[0-9a-f]+\.webp$/);
  });

  it("still produces a key when the filename slugifies to nothing", () => {
    const result = ok(objectKeyFor("logo", "!!!.webp", bytes("x")));
    assert.match(result.key, /^logo\/image-[0-9a-f]+\.webp$/);
  });

  it("keeps the key inside the length the bucket accepts", () => {
    const result = ok(objectKeyFor("logo", `${"a".repeat(400)}.webp`, bytes("x")));
    assert.ok(result.key.length <= MAX_KEY_LENGTH, `${result.key.length} characters`);
  });

  it("still ends in the extension after truncating a very long name", () => {
    const result = ok(objectKeyFor("logo", `${"a".repeat(400)}.webp`, bytes("x")));
    assert.ok(result.key.endsWith(".webp"), result.key);
  });

  it("refuses a type that is not an image, and says which are accepted", () => {
    const result = objectKeyFor("logo", "resume.pdf", bytes("x"));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.error, /\.pdf/);
      assert.match(result.error, /\.webp/);
    }
  });

  it("refuses a file with no extension rather than guessing", () => {
    const result = objectKeyFor("logo", "photo", bytes("x"));
    assert.equal(result.ok, false);
    if (!result.ok) assert.match(result.error, /That file/);
  });

  it("refuses an executable dressed as an upload", () => {
    for (const name of ["payload.svg.exe", "script.js", "page.html"]) {
      assert.equal(objectKeyFor("logo", name, bytes("x")).ok, false, name);
    }
  });

  it("accepts every type it declares", () => {
    for (const extension of Object.keys(IMAGE_TYPES)) {
      const result = objectKeyFor("logo", `photo${extension}`, bytes("x"));
      assert.equal(result.ok, true, `${extension} should be accepted`);
    }
  });
});
