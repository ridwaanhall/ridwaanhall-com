import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { escapeHtml, messageHtml } from "./escape";

describe("escapeHtml", () => {
  it("escapes the characters that would otherwise become markup", () => {
    assert.equal(escapeHtml("<b>"), "&lt;b&gt;");
    assert.equal(escapeHtml("a & b"), "a &amp; b");
  });

  /*
   * Quotes too, not just angle brackets: these values land in HTML attributes
   * as well as in text, and an unescaped quote closes the attribute early.
   */
  it("escapes both quote characters, because these land in attributes too", () => {
    assert.equal(escapeHtml('say "hi"'), "say &quot;hi&quot;");
    assert.equal(escapeHtml("it's"), "it&#x27;s");
  });

  /*
   * `&` has to go first. Escaping it last would turn the `&` of an already
   * written `&lt;` into `&amp;lt;`, and the reader would see the entity.
   */
  it("does not double-encode what it has already escaped", () => {
    assert.equal(escapeHtml("<"), "&lt;");
    assert.ok(!escapeHtml("<").includes("&amp;"));
  });

  it("neutralises an injection attempt into plain characters", () => {
    const out = escapeHtml('<img src=x onerror="alert(1)">');
    assert.ok(!out.includes("<img"));
    assert.ok(!out.includes('"'));
    assert.ok(out.includes("&lt;img"));
  });

  it("leaves ordinary text alone", () => {
    assert.equal(escapeHtml("Hello there"), "Hello there");
    assert.equal(escapeHtml(""), "");
  });
});

describe("messageHtml", () => {
  it("turns newlines into breaks so a typed message keeps its shape", () => {
    assert.equal(messageHtml("one\ntwo"), "one<br>two");
    assert.equal(messageHtml("a\nb\nc"), "a<br>b<br>c");
  });

  /*
   * The order is what makes this the only safe place raw text becomes markup:
   * escape first, then add the breaks. Reversed, the `<br>` would be escaped
   * and a `<script>` would not.
   */
  it("escapes before it adds breaks, so typed markup stays text", () => {
    const out = messageHtml("<script>alert(1)</script>\nnext line");
    assert.ok(!out.includes("<script"));
    assert.ok(out.includes("&lt;script&gt;"));
    assert.ok(out.includes("<br>"));
  });

  it("leaves a single-line message unchanged apart from escaping", () => {
    assert.equal(messageHtml("just text"), "just text");
  });
});
