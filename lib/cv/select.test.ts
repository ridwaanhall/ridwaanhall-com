import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildCv, has, summaryOf, type CvInput } from "./select";

const base: CvInput = {
  name: "Ridwan Halim",
  username: "ridwaanhall",
  email: "hi@ridwaanhall.com",
  location: "Boyolali, Indonesia",
  roles: ["AI Engineer", "ML Engineer", "Python Developer", "Data Analyst", "Fifth Role"],
  availability: "within 1 month",
  notes: "Passionate about building web apps. Seeking growth in machine learning.",
  longDescription: "I like quiet mornings. I mentored 50+ coders at a coding camp. I shipped 45+ projects with Python. My favourite colour is green.",
  experiences: [
    { title: "Founder", company: "RoneAI", start: "Jan 2023", end: "now", responsibilities: ["a", "b", "c", "d"] },
    { title: "Chief Secretary", company: "IKA", start: "Sep 2021", end: "Jan 2022", responsibilities: ["x"] },
  ],
  education: [{ degree: "S.Kom.", institution: "UTY", years: "2021 - 2025", achievements: [] }],
  skills: [["Languages", ["Python", "PHP"]]],
  projects: [{ title: "P", headline: "H", stack: ["FastAPI"] }],
  certifications: [
    { title: "Digital Marketing Basics", institution: "X", year: 2026, month: 5 },
    { title: "Applied Machine Learning", institution: "Dicoding", year: 2025, month: 2 },
    { title: "Learn Git and GitHub", institution: "LinkedIn", year: 2024, month: 1 },
  ],
};

describe("the CV's rules", () => {
  it("matches a word whole, so git is not found in Digital", () => {
    assert.ok(!has("Digital Marketing", ["git"]));
    assert.ok(has("Learn Git and GitHub", ["git"]));
    assert.ok(has("Full Stack Developer", ["full stack"]));
  });

  it("takes only sentences that count work, never a personal one", () => {
    const summary = summaryOf(base.notes, base.longDescription);
    assert.match(summary, /mentored 50\+ coders/);
    assert.match(summary, /shipped 45\+ projects/);
    assert.doesNotMatch(summary, /quiet mornings|green/);
  });

  it("leads with the roles looked for, four at most", () => {
    assert.equal(buildCv(base).headline, "AI Engineer · ML Engineer · Python Developer · Data Analyst");
  });

  it("leaves out a role with no technical title, and caps points at three", () => {
    const { experience } = buildCv(base);
    assert.deepEqual(experience.map((role) => role.company), ["RoneAI"]);
    assert.equal(experience[0].points.length, 3);
  });

  it("lists the newest technical certificates only", () => {
    const { certifications } = buildCv(base);
    assert.equal(certifications.length, 2);
    assert.ok(!certifications.some((line) => /Digital Marketing/.test(line)));
    assert.match(certifications[0], /Applied Machine Learning/);
  });

  it("writes addresses in full and folds skills into eight lines", () => {
    const cv = buildCv({ ...base, skills: Array.from({ length: 12 }, (_, i) => [`G${i}`, [`s${i}`]] as [string, string[]]) });
    assert.ok(cv.contact.includes("github.com/ridwaanhall") && cv.contact.includes("linkedin.com/in/ridwaanhall"));
    assert.equal(cv.skills.length, 8);
    assert.match(cv.skills[7], /^Also: s7, s8/);
  });
});
