import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { availability, displayLabel, groupBy, postCategory, readingMinutes, yearOf } from "./display";

describe("displayLabel", () => {
  it("title-cases a label that is plainly a slug", () => {
    assert.equal(displayLabel("web-development"), "Web Development");
    assert.equal(displayLabel("saas-platform"), "SaaS Platform");
    assert.equal(displayLabel("gaming"), "Gaming");
  });

  it("leaves a label somebody wrote as a label alone", () => {
    assert.equal(displayLabel("Web App"), "Web App");
    assert.equal(displayLabel("API"), "API");
    assert.equal(displayLabel("Machine Learning"), "Machine Learning");
  });

  it("is empty for nothing", () => {
    assert.equal(displayLabel(null), "");
    assert.equal(displayLabel("  "), "");
  });
});

describe("postCategory", () => {
  it("puts an uncategorised post on the Notes shelf", () => {
    assert.equal(postCategory(""), "Notes");
    assert.equal(postCategory(null), "Notes");
    assert.equal(postCategory("Science & Space"), "Science & Space");
  });
});

describe("readingMinutes", () => {
  it("prefers the stored value", () => {
    assert.equal(readingMinutes(4, "<p>one</p>"), 4);
  });

  it("estimates from the words, ignoring markup, when nothing is stored", () => {
    const body = `<p>${"word ".repeat(660)}</p>`;
    assert.equal(readingMinutes(null, body), 3);
  });

  it("never says zero", () => {
    assert.equal(readingMinutes(null, ""), 1);
  });
});

describe("yearOf", () => {
  it("reads the UTC year, the zone dates are stored in", () => {
    assert.equal(yearOf(new Date("2025-12-31T17:00:00Z")), 2025);
    assert.equal(yearOf(null), null);
  });
});

describe("groupBy", () => {
  it("keeps first-seen order of groups and items", () => {
    const groups = groupBy([3, 1, 4, 1, 5], (n) => n % 2);
    assert.deepEqual(groups, [
      [1, [3, 1, 1, 5]],
      [0, [4]],
    ]);
  });
});

describe("availability", () => {
  it("leads with being unwell, since it changes every other answer's speed", () => {
    const keys = availability({ is_open_to_work: true, is_hiring: true, is_sick: true }).map((a) => a.key);
    assert.deepEqual(keys, ["sick", "open", "hiring"]);
  });

  it("says nothing when no flag is set", () => {
    assert.deepEqual(availability({ is_open_to_work: false, is_hiring: false, is_sick: false }), []);
  });
});
