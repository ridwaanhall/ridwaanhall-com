import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { renderSitemap, type SitemapEntry } from "./sitemap";

const entry = (over: Partial<SitemapEntry> = {}): SitemapEntry => ({
  url: "https://ridwaanhall.com/",
  lastModified: new Date("2026-01-23T18:45:12.000Z"),
  changeFrequency: "daily",
  priority: 1,
  ...over,
});

describe("renderSitemap", () => {
  it("declares the document and the namespace a crawler expects", () => {
    const xml = renderSitemap([entry()]);
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
    assert.ok(xml.trimEnd().endsWith("</urlset>"));
  });

  it("emits one <url> per entry", () => {
    const xml = renderSitemap([entry(), entry({ url: "https://ridwaanhall.com/about" })]);
    assert.equal(xml.match(/<url>/g)?.length, 2);
  });

  /*
   * A plain date, not a timestamp: the source is a row's own `updated_at` and
   * claiming second precision for an editorial change is precision the data
   * does not have.
   */
  it("emits lastmod as a plain date", () => {
    assert.ok(renderSitemap([entry()]).includes("<lastmod>2026-01-23</lastmod>"));
  });

  it("emits priority to one decimal, as the schema expects", () => {
    assert.ok(renderSitemap([entry({ priority: 0.8 })]).includes("<priority>0.8</priority>"));
    assert.ok(renderSitemap([entry({ priority: 1 })]).includes("<priority>1.0</priority>"));
  });

  /*
   * An unescaped `&` makes the whole document malformed, and a crawler rejects
   * the file rather than the one URL -- so every page falls out of the index at
   * once.
   */
  it("escapes a URL that would otherwise break the document", () => {
    const xml = renderSitemap([entry({ url: "https://ridwaanhall.com/blog?a=1&b=2" })]);
    assert.ok(xml.includes("&amp;"), xml);
    assert.ok(!/[^&]&[^a-z#]/.test(xml), "a bare ampersand reached the document");
  });

  it("renders a valid, empty document when there is nothing to list", () => {
    const xml = renderSitemap([]);
    assert.ok(xml.includes("<urlset"));
    assert.ok(!xml.includes("<url>"));
  });
});
