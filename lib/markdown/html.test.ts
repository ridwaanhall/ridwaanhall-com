import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { htmlToMarkdown, htmlToText } from "./html";

describe("htmlToMarkdown", () => {
  it("turns headings, paragraphs and emphasis into Markdown", () => {
    const md = htmlToMarkdown("<h2>Why it works</h2><p>It is <strong>fast</strong> and <em>small</em>.</p>");
    assert.equal(md, "## Why it works\n\nIt is **fast** and _small_.");
  });

  it("keeps links and images with their address", () => {
    const md = htmlToMarkdown('<p>See <a href="https://python.org">python.org</a>.</p><p><img src="/a.webp" alt="A diagram"></p>');
    assert.match(md, /\[python\.org\]\(https:\/\/python\.org\)/);
    assert.match(md, /!\[A diagram\]\(\/a\.webp\)/);
  });

  it("numbers an ordered list and dashes an unordered one", () => {
    assert.equal(htmlToMarkdown("<ul><li>One</li><li>Two</li></ul>"), "- One\n- Two");
    assert.equal(htmlToMarkdown("<ol><li>One</li><li>Two</li></ol>"), "1. One\n2. Two");
  });

  it("fences code with its language and leaves what is inside it alone", () => {
    const md = htmlToMarkdown('<pre><code class="language-python">print("a &lt; b")\n</code></pre>');
    assert.equal(md, '```python\nprint("a < b")\n```');
  });

  it("quotes a blockquote line by line", () => {
    assert.equal(htmlToMarkdown("<blockquote><p>First</p><p>Second</p></blockquote>"), "> First\n>\n> Second");
  });

  it("leaves no tag behind, however they are nested", () => {
    const md = htmlToMarkdown("<p><span><b>bold</b> <u>under</u></span></p><div>loose</div><p>a<<b>b</b>>c</p>");
    assert.doesNotMatch(md, /<\/?(span|u|div|b)>/);
  });

  it("returns an empty string for nothing", () => {
    assert.equal(htmlToMarkdown(""), "");
    assert.equal(htmlToMarkdown(null), "");
  });

  it("reduces markup to its words even when removing a tag would assemble another", () => {
    // Taking out the inner tag of `<scr<b>ipt>` leaves `<script>` behind, so
    // one pass is not enough; stripping runs until nothing changes.
    for (const html of ["<scr<b>ipt>alert(1)</scr<b>ipt>", "<<b>script>x<</b>/script>", "a <span class='x'>b</span> &amp; c"]) {
      const text = htmlToText(html);
      assert.doesNotMatch(text, /<\/?[a-z]/i, html);
    }
    assert.equal(htmlToText("a <span class='x'>b</span> &amp; c"), "a b & c");
  });
});
