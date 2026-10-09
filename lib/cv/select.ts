/**
 * What goes on the CV, chosen from the About page by rule.
 *
 * The CV is generated, never written: every line is picked from rows the
 * About page already shows, so editing About in the admin changes the next
 * CV. The rules are the point of this file, and it is pure so `npm test` can
 * hold them:
 *
 * - the roles being looked for are the headline;
 * - the summary is the open-to-work note plus every sentence that *counts
 *   work* (coders mentored, interns guided, projects shipped);
 * - skills fold into eight lines;
 * - a role with no technical title is left out -- it stays on About;
 * - certificates are the five newest technical ones;
 * - a word is matched whole: `git` must not match inside "Digital".
 */

export type CvInput = {
  name: string;
  username: string;
  email: string;
  location: string;
  roles: string[];
  availability: string;
  notes: string;
  longDescription: string;
  experiences: { title: string; company: string; start: string; end: string; responsibilities: string[] }[];
  education: { degree: string; institution: string; years: string; achievements: string[] }[];
  skills: [string, string[]][];
  projects: { title: string; headline: string; stack: string[] }[];
  certifications: { title: string; institution: string; year: number | null; month: number }[];
};

export type Cv = {
  name: string;
  headline: string;
  contact: { text: string; href?: string }[];
  summary: string;
  skills: string[];
  experience: { title: string; company: string; period: string; points: string[] }[];
  projects: { title: string; line: string }[];
  education: { degree: string; institution: string; years: string }[];
  certifications: string[];
};

/** Whole-word test, case-insensitive: `has("Digital Marketing", "git")` is false. */
export function has(text: string, words: string[]): boolean {
  return words.some((word) => new RegExp(`(^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(text));
}

const TECHNICAL_TITLE = ["developer", "engineer", "founder", "intern", "mentor", "programmer", "architect", "analyst", "scientist", "full stack", "backend", "frontend", "machine learning", "ai", "software", "data", "web"];
const TECHNICAL_CERT = [
  "python", "django", "flask", "fastapi", "javascript", "typescript", "react", "node", "sql", "postgresql", "git", "github", "docker", "linux", "api", "web", "html", "css",
  "machine learning", "deep learning", "data", "ai", "tensorflow", "pytorch", "cloud", "aws", "azure", "devops", "algorithm", "programming", "software", "cybersecurity", "network",
];
const COUNTS_WORK = /\b\d[\d,.]*\+?\s+(?:\w+\s+){0,3}?(coders?|interns?|projects?|developers?|students?|engineers?|users?|visitors?|stars?|repositories|apps?|websites?)\b|\b(mentored|guided|shipped|built|led|launched|founded)\b.{0,60}\b\d/i;

export const sentences = (text: string) => (text.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? []).map((s) => s.trim()).filter(Boolean);

export function summaryOf(notes: string, longDescription: string): string {
  const counted = sentences(longDescription).filter((sentence) => COUNTS_WORK.test(sentence));
  const seen = new Set<string>();
  return [...sentences(notes).slice(0, 2), ...counted.slice(0, 3)]
    .filter((sentence) => !seen.has(sentence.toLowerCase()) && seen.add(sentence.toLowerCase()))
    .join(" ");
}

export function buildCv(input: CvInput): Cv {
  const roles = input.roles.slice(0, 4);
  const technical = input.experiences.filter((role) => has(role.title, TECHNICAL_TITLE));
  const byCompany = new Map<string, typeof technical>();
  technical.forEach((role) => byCompany.set(role.company, [...(byCompany.get(role.company) ?? []), role]));

  const newestCerts = input.certifications
    .filter((cert) => has(cert.title, TECHNICAL_CERT))
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.month - a.month)
    .slice(0, 5);

  return {
    name: input.name,
    headline: roles.join(" · "),
    contact: [
      { text: input.email },
      { text: `github.com/${input.username}`, href: `https://github.com/${input.username}` },
      { text: `linkedin.com/in/${input.username}`, href: `https://www.linkedin.com/in/${input.username}` },
      { text: input.location },
      { text: input.availability ? `Available ${input.availability}` : "" },
    ].filter((line) => line.text),
    summary: summaryOf(input.notes, input.longDescription),
    // Eight lines at most: the first seven groups, then the rest folded into one.
    skills: foldSkills(input.skills),
    experience: [...byCompany.values()].map((list) => ({
      title: list.map((role) => role.title).slice(0, 2).join(" / "),
      company: list[0].company,
      period: `${list[list.length - 1].start} - ${list[0].end}`,
      points: list.flatMap((role) => role.responsibilities).slice(0, 3),
    })),
    projects: input.projects.slice(0, 4).map((project) => ({ title: project.title, line: `${project.headline}${project.stack.length ? ` (${project.stack.slice(0, 5).join(", ")})` : ""}` })),
    education: input.education.map((e) => ({ degree: e.degree, institution: e.institution, years: e.years })),
    certifications: newestCerts.map((cert) => `${cert.title}, ${cert.institution}${cert.year ? ` (${cert.year})` : ""}`),
  };
}

function foldSkills(groups: [string, string[]][]): string[] {
  const lines = groups.filter(([, names]) => names.length).map(([category, names]) => `${category}: ${names.join(", ")}`);
  if (lines.length <= 8) return lines;
  const head = lines.slice(0, 7);
  // Capped: ninety names on one line is a wall, and the About page has them all.
  const rest = groups.slice(7).flatMap(([, names]) => names).slice(0, 16);
  return [...head, `Also: ${rest.join(", ")}`];
}
