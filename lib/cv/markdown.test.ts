import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cvToMarkdown } from "./markdown";
import type { Cv } from "./select";

const cv: Cv = {
  name: "Ridwan Halim",
  headline: "AI Engineer | Python Developer",
  contact: [{ text: "hi@example.com" }, { text: "github.com/ridwaanhall", href: "https://github.com/ridwaanhall" }],
  summary: "Mentored 50+ coders.",
  skills: ["Languages: Python, PHP", "Also: n8n"],
  experience: [{ title: "Founder", company: "RoneAI", period: "Jan 2023 - Present", points: ["Shipped a thing."] }],
  projects: [{ title: "P", line: "A project (Python)" }],
  education: [{ degree: "S.Kom.", institution: "UTY", years: "2021 - 2025" }],
  certifications: ["Applied Machine Learning, Dicoding (2025)"],
};

describe("the CV as Markdown", () => {
  const md = cvToMarkdown(cv);

  it("carries the same sections as the PDF, in the same order", () => {
    const headings = [...md.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    assert.deepEqual(headings, ["Summary", "Skills", "Experience", "Projects", "Education", "Certifications"]);
  });

  it("links an address and bolds a skill's group", () => {
    assert.match(md, /\[github\.com\/ridwaanhall\]\(https:\/\/github\.com\/ridwaanhall\)/);
    assert.match(md, /- \*\*Languages\*\*: Python, PHP/);
  });

  it("leaves out a section with nothing in it", () => {
    assert.doesNotMatch(cvToMarkdown({ ...cv, projects: [], certifications: [] }), /## (Projects|Certifications)/);
  });
});
