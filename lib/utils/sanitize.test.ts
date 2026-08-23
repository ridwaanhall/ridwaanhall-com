import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sanitizeRichText } from "./sanitize";

/*
 * Stored bodies are rendered through `dangerouslySetInnerHTML`, so this is the
 * only thing between the database and the page. Today the admin is the sole
 * writer, which is exactly why these need checking: nothing else would notice
 * the allow-list quietly widening.
 */
describe("sanitizeRichText", () => {
  it("drops a script rather than escaping it", () => {
    const out = sanitizeRichText('<p>before</p><script>alert(1)</script><p>after</p>');
    assert.ok(!out.includes("script"), out);
    assert.ok(!out.includes("alert"), out);
    assert.ok(out.includes("before") && out.includes("after"));
  });

  it("drops an event handler off an allowed tag", () => {
    const out = sanitizeRichText('<p onclick="steal()">text</p>');
    assert.ok(!out.includes("onclick"), out);
    assert.ok(out.includes("text"));
  });

  it("drops an unknown tag but keeps the words inside it", () => {
    const out = sanitizeRichText("<marquee>still readable</marquee>");
    assert.ok(!out.includes("marquee"), out);
    assert.ok(out.includes("still readable"));
  });

  it("keeps the vocabulary the editor produces", () => {
    const html =
      "<h2>Heading</h2><p><strong>bold</strong> <em>italic</em> <code>x</code></p>" +
      "<ul><li>one</li></ul><blockquote>quoted</blockquote>" +
      "<table><tbody><tr><td>cell</td></tr></tbody></table>";
    const out = sanitizeRichText(html);
    for (const tag of ["h2", "strong", "em", "code", "ul", "li", "blockquote", "table", "td"]) {
      assert.ok(out.includes(`<${tag}`), `expected <${tag}> to survive: ${out}`);
    }
  });

  it("allows a language class on code, because that is what a highlighter reads", () => {
    const out = sanitizeRichText('<pre><code class="language-ts">const x = 1;</code></pre>');
    assert.ok(out.includes('class="language-ts"'), out);
  });

  /*
   * The reason `class` is allowed at all is `language-*`, and the reason it is
   * allowed nowhere else is that a class in stored content is a class Tailwind
   * cannot see -- which is what `scripts/check-db-classes.mjs` guards from the
   * other end.
   */
  it("strips any other class, on code and everywhere else", () => {
    assert.ok(!sanitizeRichText('<code class="bg-red-500">x</code>').includes("bg-red-500"));
    assert.ok(!sanitizeRichText('<p class="text-2xl">x</p>').includes("text-2xl"));
    assert.ok(!sanitizeRichText('<code class="language-ts extra">x</code>').includes("extra"));
  });

  it("removes a javascript: href, which is how an anchor becomes script execution", () => {
    const out = sanitizeRichText('<a href="javascript:alert(1)">click</a>');
    assert.ok(!out.includes("javascript:"), out);
    assert.ok(out.includes("click"), out);
  });

  it("keeps the schemes a real link uses", () => {
    assert.ok(sanitizeRichText('<a href="https://example.com">x</a>').includes("https://example.com"));
    assert.ok(sanitizeRichText('<a href="mailto:hi@example.com">x</a>').includes("mailto:"));
  });

  it("sends an external link to a new tab, with the rel that has to accompany it", () => {
    const out = sanitizeRichText('<a href="https://example.com">out</a>');
    assert.ok(out.includes('target="_blank"'), out);
    assert.ok(out.includes("noopener"), out);
    assert.ok(out.includes("noreferrer"), out);
  });

  it("leaves an internal link in the same tab", () => {
    const out = sanitizeRichText('<a href="https://ridwaanhall.com/blog">in</a>');
    assert.ok(!out.includes("_blank"), out);
  });

  it("treats an absent or empty body as empty rather than throwing", () => {
    assert.equal(sanitizeRichText(""), "");
    assert.equal(sanitizeRichText(undefined as unknown as string), "");
  });
});
