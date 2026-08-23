import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { plainText } from "./plain-text";

describe("plainText", () => {
  it("strips tags", () => {
    assert.equal(plainText("<p>Hello <strong>world</strong></p>"), "Hello world");
  });

  /*
   * A tag is a word boundary. Without that, "<p>one</p><p>two</p>" collapses to
   * "onetwo" and neither word is findable by the site search.
   */
  it("treats a tag as a word boundary rather than joining the words either side", () => {
    assert.equal(plainText("<p>one</p><p>two</p>"), "one two");
    assert.equal(plainText("<li>a</li><li>b</li>"), "a b");
  });

  it("decodes the entities the sanitiser can emit", () => {
    assert.equal(plainText("Rust &amp; Go"), "Rust & Go");
    assert.equal(plainText("&lt;div&gt;"), "<div>");
    assert.equal(plainText("&quot;quoted&quot;"), '"quoted"');
    assert.equal(plainText("it&#39;s"), "it's");
    assert.equal(plainText("it&apos;s"), "it's");
  });

  it("decodes a numeric entity", () => {
    assert.equal(plainText("caf&#233;"), "café");
  });

  it("turns a non-breaking space into an ordinary one", () => {
    assert.equal(plainText("a&nbsp;b"), "a b");
  });

  it("collapses runs of whitespace and trims", () => {
    assert.equal(plainText("  <p>  spaced   out  </p>  "), "spaced out");
    assert.equal(plainText("<p>line\n\nbreak</p>"), "line break");
  });

  it("treats an absent body as empty rather than throwing", () => {
    assert.equal(plainText(""), "");
    assert.equal(plainText(undefined as unknown as string), "");
  });

  it("leaves a body that was never markup alone", () => {
    assert.equal(plainText("just words"), "just words");
  });
});
