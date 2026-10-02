import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { prepareArticle } from "@/lib/utils/toc";

describe("prepareArticle", () => {
  it("gives every h2 and h3 an id and lists them in order", () => {
    const { html, headings } = prepareArticle(
      "<h2>Getting started</h2><p>x</p><h3>Install it</h3><h2>Going further</h2>",
    );

    assert.deepEqual(
      headings.map((h) => [h.id, h.text, h.level]),
      [
        ["getting-started", "Getting started", 2],
        ["install-it", "Install it", 3],
        ["going-further", "Going further", 2],
      ],
    );
    assert.ok(html.includes('<h2 id="getting-started">Getting started</h2>'));
    assert.ok(html.includes('<h3 id="install-it">Install it</h3>'));
  });

  it("keeps two headings that read the same addressable separately", () => {
    const { html, headings } = prepareArticle("<h2>Notes</h2><h2>Notes</h2><h3>Notes</h3>");

    assert.deepEqual(
      headings.map((h) => h.id),
      ["notes", "notes-2", "notes-3"],
    );
    // Every generated id appears exactly once in the markup.
    for (const { id } of headings) {
      assert.equal(html.split(`id="${id}"`).length - 1, 1);
    }
  });

  it("reads the heading's text, not its markup", () => {
    const { headings } = prepareArticle("<h2>Use <code>npm test</code> first</h2>");

    assert.equal(headings[0].text, "Use npm test first");
    assert.equal(headings[0].id, "use-npm-test-first");
  });

  it("still numbers a heading that slugifies to nothing", () => {
    const { headings } = prepareArticle("<h2>?!</h2>");

    assert.equal(headings.length, 1);
    assert.equal(headings[0].id, "section-1");
  });

  it("skips a heading with no text at all rather than anchoring an empty entry", () => {
    const { html, headings } = prepareArticle("<h2></h2><h2>Real</h2>");

    assert.deepEqual(
      headings.map((h) => h.id),
      ["real"],
    );
    assert.ok(html.includes("<h2></h2>"));
  });

  it("returns nothing to list for a body with no headings", () => {
    const { html, headings } = prepareArticle("<p>Just a paragraph.</p>");

    assert.deepEqual(headings, []);
    assert.equal(html, "<p>Just a paragraph.</p>");
  });

  it("handles an empty body", () => {
    assert.deepEqual(prepareArticle(""), { html: "", headings: [] });
  });

  it("does not honour an id that arrived in the content", () => {
    // The sanitiser allows `id` on no element, so an anchor in stored HTML is
    // gone before this runs -- which is what stops content naming, or
    // impersonating, an anchor the page relies on.
    const { html } = prepareArticle('<h2 id="injected">Heading</h2>');

    assert.ok(!html.includes('"injected"'));
    assert.ok(html.includes('id="heading"'));
  });

  it("leaves h4 out of the list", () => {
    const { headings } = prepareArticle("<h2>Top</h2><h4>Detail</h4>");

    assert.deepEqual(
      headings.map((h) => h.text),
      ["Top"],
    );
  });
});
