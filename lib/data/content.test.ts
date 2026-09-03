import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { searchBlogs, searchProjects } from "./content";
import type { BlogPost, Project } from "./content";

/*
 * Both search functions take rows the read path built, so a fixture only has to
 * carry the fields they read. Cast once here rather than writing out thirty
 * fields per case, and let the compiler catch a field the search starts using
 * that these do not set.
 */
const post = (fields: Partial<BlogPost>): BlogPost =>
  ({
    title: "",
    description: "",
    content_html: "",
    author: "",
    tags: [],
    ...fields,
  }) as BlogPost;

const project = (fields: Partial<Project>): Project =>
  ({
    title: "",
    headline: "",
    description_html: "",
    category: "",
    tags: [],
    ...fields,
  }) as Project;

describe("searchBlogs", () => {
  it("returns everything for an empty or blank query", () => {
    const all = [post({ title: "One" }), post({ title: "Two" })];
    assert.equal(searchBlogs(all, "").length, 2);
    assert.equal(searchBlogs(all, "   ").length, 2);
  });

  it("matches the title, the summary, the byline and a tag", () => {
    const rows = [
      post({ title: "Indexing Postgres" }),
      post({ description: "A note on indexing" }),
      post({ author: "Ridwan Halim" }),
      post({ tags: ["indexing"] }),
    ];
    assert.equal(searchBlogs(rows, "indexing").length, 3);
    assert.equal(searchBlogs(rows, "ridwan").length, 1);
  });

  /*
   * The one this file was written for. The body was not searched at all, so the
   * blog -- the only content type written at length -- was the one whose text
   * could not be found.
   */
  it("matches the body", () => {
    const rows = [post({ content_html: "<p>A paragraph about <em>pagination</em>.</p>" })];
    assert.equal(searchBlogs(rows, "pagination").length, 1);
  });

  /*
   * Searching the raw HTML would make every post carrying a link match "http"
   * and every post with emphasis match "em". The body is stripped to text
   * first, so a tag name is not a search term.
   */
  it("searches the body's text and not its markup", () => {
    const rows = [post({ content_html: '<p><a href="https://example.com">read this</a></p>' })];
    assert.equal(searchBlogs(rows, "read this").length, 1);
    assert.equal(searchBlogs(rows, "href").length, 0);
    assert.equal(searchBlogs(rows, "https").length, 0);
  });

  it("ignores case on both sides", () => {
    const rows = [post({ title: "Caching" })];
    assert.equal(searchBlogs(rows, "CACHING").length, 1);
    assert.equal(searchBlogs([post({ title: "CACHING" })], "caching").length, 1);
  });

  it("matches a phrase spanning fields only where that field holds it", () => {
    const rows = [post({ title: "Caching", description: "in Next" })];
    assert.equal(searchBlogs(rows, "caching in next").length, 0);
  });
});

describe("searchProjects", () => {
  it("returns everything for an empty query", () => {
    assert.equal(searchProjects([project({ title: "One" })], "").length, 1);
  });

  it("matches the title, headline, description, category and tags", () => {
    const rows = [
      project({ title: "Finder" }),
      project({ headline: "a finder for names" }),
      project({ description_html: "<p>the finder walks a list</p>" }),
      project({ category: "finder tools" }),
      project({ tags: ["finder"] }),
    ];
    assert.equal(searchProjects(rows, "finder").length, 5);
  });

  it("searches the description's text and not its markup", () => {
    const rows = [project({ description_html: '<p class="lead">a summary</p>' })];
    assert.equal(searchProjects(rows, "a summary").length, 1);
    assert.equal(searchProjects(rows, "class").length, 0);
  });
});
