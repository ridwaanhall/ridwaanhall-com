import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { outlineHtml } from "./outline";

describe("outlineHtml", () => {
  it("gives each heading an id and lists it, keeping its markup", () => {
    const { html, headings } = outlineHtml("<h2>Why it <em>matters</em></h2><p>x</p><h3>A detail</h3>");
    assert.equal(html, '<h2 id="s-why-it-matters">Why it <em>matters</em></h2><p>x</p><h3 id="s-a-detail">A detail</h3>');
    assert.deepEqual(headings, [
      { id: "s-why-it-matters", label: "Why it matters", level: 2 },
      { id: "s-a-detail", label: "A detail", level: 3 },
    ]);
  });

  it("decodes entities in the label and keeps ids unique", () => {
    const { headings } = outlineHtml("<h2>Q&amp;A</h2><h2>Q&amp;A</h2>");
    assert.deepEqual(
      headings.map((h) => [h.id, h.label]),
      [
        ["s-q-a", "Q&A"],
        ["s-q-a-2", "Q&A"],
      ],
    );
  });

  it("leaves other levels, and empty headings, alone", () => {
    const source = "<h4>Small</h4><h2> </h2>";
    assert.deepEqual(outlineHtml(source), { html: source, headings: [] });
  });
});
