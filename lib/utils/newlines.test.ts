import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { normaliseNewlines } from "./newlines";

describe("normaliseNewlines", () => {
  it("turns a CRLF pair into one line feed", () => {
    assert.equal(normaliseNewlines("one\r\ntwo"), "one\ntwo");
  });

  it("turns a lone carriage return into one too", () => {
    assert.equal(normaliseNewlines("one\rtwo"), "one\ntwo");
  });

  it("leaves text that is already normalised exactly as it is", () => {
    const text = "one\ntwo\n\nthree";
    assert.equal(normaliseNewlines(text), text);
  });

  /*
   * The property that matters: this runs on every save, so a value that has
   * been through it once must not change again. A replacement that turned CRLF
   * into two breaks would pass the first test above and corrupt a body a little
   * more each time it was opened.
   */
  it("is idempotent, because it runs on every save", () => {
    const once = normaliseNewlines("a\r\nb\rc\nd\r\n\r\ne");
    assert.equal(normaliseNewlines(once), once);
    assert.equal(once, "a\nb\nc\nd\n\ne");
  });

  it("keeps blank lines rather than collapsing them", () => {
    assert.equal(normaliseNewlines("a\r\n\r\nb"), "a\n\nb");
  });

  it("leaves a string with no line breaks alone", () => {
    assert.equal(normaliseNewlines("just one line"), "just one line");
    assert.equal(normaliseNewlines(""), "");
  });
});
