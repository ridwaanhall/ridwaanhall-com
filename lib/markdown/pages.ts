import "server-only";

import {
  getAboutData,
  getApplications,
  getAwards,
  getCertifications,
  getEducation,
  getExperiences,
  getSkillsByCategory,
  type AboutData,
} from "@/lib/data/about";
import { findBySlug, getBlogs, getProjects, sortProjects, type BlogPost, type Project } from "@/lib/data/content";
import { getCv } from "@/lib/cv/load";
import { cvToMarkdown } from "@/lib/cv/markdown";
import { getLegalDocument, getLegalDocuments } from "@/lib/data/legal";
import { getHiringData, getOpenToWorkData } from "@/lib/data/openhire";
import { SITE_URL } from "@/lib/seo/config";
import { postCategory, readingMinutes, shortDate, socialLinks } from "@/lib/site/display";
import { twinOf } from "@/lib/site/twins";
import { longDate } from "@/lib/utils/format";

import { htmlToMarkdown } from "./html";

/**
 * Every page as Markdown.
 *
 * Each function draws from the cached read its page draws from, so a twin can
 * never say something the page does not -- and a draft has none, because
 * `getBlogs` and `getProjects` are the two reads that decide what is published.
 *
 * What is left out is left out on purpose. The guestbook's messages were
 * written for the page, not for a dataset, so its twin counts them and points
 * at the page; the dashboard's figures are live and a copy in a cached text
 * file is wrong by the time it is read, so its twin names the sources.
 */

/** `page` is where people read it when that is not `path`: the CV's twin is `/cv.md`, its page is the PDF. */
export type Twin = { path: string; page?: string; title: string; summary: string; body: string };

const list = (items: string[]) => items.filter(Boolean).map((item) => `- ${item}`).join("\n");
const link = (title: string, path: string) => `[${title}](${twinOf(path)})`;
/** A stored sentence that opens with a lowercase letter, set as a sentence. */
export const sentence = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);
const clip = (text: string, n = 200) => (text.length > n ? `${text.slice(0, n - 1).trimEnd()}…` : text);

function projectLine(project: Project): string {
  return `${link(project.title, `/projects/${project.slug}`)}: ${project.headline} (${project.status_label}${project.created_at ? `, ${project.created_at.getUTCFullYear()}` : ""})`;
}
function postLine(post: BlogPost): string {
  return `${link(post.title, `/blog/${post.slug}`)}: ${post.description} (${shortDate(post.created_at)}, ${readingMinutes(post.read_time, post.content_html)} min read)`;
}

export async function homeTwin(about: AboutData): Promise<Twin> {
  const [projects, blogs, current] = await Promise.all([getProjects(), getBlogs(), getExperiences(true)]);
  const featured = sortProjects(projects).filter((project) => project.is_featured).slice(0, 4);
  return {
    path: "/",
    title: `${about.name} (${about.username})`,
    summary: `${about.role} in ${about.location.residency || about.location.regency}, Indonesia. ${sentence(about.short_description)}`,
    body: [
      about.short_bio,
      `- Projects: ${projects.length}; posts: ${blogs.length}`,
      featured.length ? `## Featured work\n\n${list(featured.map(projectLine))}` : "",
      current.length ? `## Now\n\n${list(current.map((role) => `${role.title}, ${role.company}`))}` : "",
      blogs.length ? `## Latest writing\n\n${list(blogs.slice(0, 3).map(postLine))}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export async function projectsTwin(): Promise<Twin> {
  const projects = sortProjects(await getProjects());
  return {
    path: "/projects",
    title: "Work",
    summary: `${projects.length} projects: APIs, web platforms and machine learning.`,
    body: list(projects.map(projectLine)),
  };
}

export async function projectTwin(slug: string): Promise<Twin | null> {
  const project = findBySlug(await getProjects(), slug);
  if (!project) return null;
  return {
    path: `/projects/${project.slug}`,
    title: project.title,
    summary: project.headline,
    body: [
      list([
        `Category: ${project.category}`,
        `Status: ${project.status_label}`,
        project.created_at ? `Started: ${longDate(project.created_at)}` : "",
        project.tech_stack.length ? `Built with: ${project.tech_stack.map((skill) => skill.name).join(", ")}` : "",
        project.demo_url ? `Live: ${project.demo_url}` : "",
        project.github_url ? `Source: ${project.github_url}` : "",
      ]),
      `## About\n\n${htmlToMarkdown(project.description_html)}`,
      project.features.length ? `## Features\n\n${list(project.features.map((f) => `**${f.title}**: ${f.description}`))}` : "",
      project.tags.length ? `## Tags\n\n${project.tags.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export async function blogTwin(): Promise<Twin> {
  const blogs = await getBlogs();
  return { path: "/blog", title: "Writing", summary: `${blogs.length} posts on machine learning, web development and open source.`, body: list(blogs.map(postLine)) };
}

export async function postTwin(slug: string, about: AboutData): Promise<Twin | null> {
  const post = findBySlug(await getBlogs(), slug);
  if (!post) return null;
  return {
    path: `/blog/${post.slug}`,
    title: post.title,
    summary: post.description,
    body: [
      list([
        `By ${post.author || about.name}, ${shortDate(post.created_at)}`,
        `${postCategory(post.category)}; ${readingMinutes(post.read_time, post.content_html)} min read`,
        post.tags.length ? `Tags: ${post.tags.join(", ")}` : "",
      ]),
      htmlToMarkdown(post.content_html),
    ].join("\n\n"),
  };
}

export async function aboutTwin(about: AboutData): Promise<Twin> {
  const [experiences, education, awards, certifications, applications, skills] = await Promise.all([
    getExperiences(),
    getEducation(),
    getAwards(),
    getCertifications(),
    getApplications(),
    getSkillsByCategory(),
  ]);
  const outcome = applications.reduce<Record<string, number>>((m, a) => ((m[a.status] = (m[a.status] ?? 0) + 1), m), {});
  const span = (a: { period: { start: { month: string; year: number } | null; end: { month: string; year: number } | "Present" } }) =>
    `${a.period.start ? `${a.period.start.month.slice(0, 3)} ${a.period.start.year}` : ""} to ${a.period.end === "Present" ? "now" : `${a.period.end.month.slice(0, 3)} ${a.period.end.year}`}`;
  return {
    path: "/about",
    title: "About",
    summary: `${about.first_name || about.name}, known online as ${about.username}. ${about.role}.`,
    body: [
      about.long_description,
      htmlToMarkdown(about.stories_html),
      experiences.length
        ? `## Experience\n\n${experiences.map((role) => `### ${role.title}, ${role.company}\n\n${span(role)} · ${[role.employment_type, role.location_type, role.location].filter(Boolean).join(" · ")}\n\n${list(role.responsibilities)}`).join("\n\n")}`
        : "",
      education.length ? `## Education\n\n${education.map((e) => `### ${e.degree}, ${e.institution}\n\n${list(e.achievements)}`).join("\n\n")}` : "",
      Object.keys(skills).length ? `## Skills\n\n${list(Object.entries(skills).map(([category, items]) => `${category}: ${items.map((s) => s.name).join(", ")}`))}` : "",
      awards.length ? `## Awards\n\n${list(awards.map((a) => `**${a.title}**, ${a.institution}. ${a.description}`))}` : "",
      certifications.length ? `## Certifications\n\n${list(certifications.map((c) => `${c.title}, ${c.institution}${c.issued ? ` (${c.issued.month.slice(0, 3)} ${c.issued.year})` : ""}`))}` : "",
      applications.length
        ? `## The job hunt, in public\n\n${applications.length} applications: ${Object.entries(outcome).map(([k, n]) => `${n} ${k.toLowerCase()}`).join(", ")}.\n\n${list(applications.map((a) => `${a.position}, ${a.company_name}: ${a.status}${a.lessons_learned ? `. ${htmlToMarkdown(a.lessons_learned).replace(/\s+/g, " ")}` : ""}`))}`
        : "",
      `## CV\n\nA PDF generated from this page: ${SITE_URL}/cv.pdf`,
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}

export async function cvTwin(): Promise<Twin | null> {
  const loaded = await getCv();
  if (!loaded) return null;
  return {
    path: "/cv",
    page: "/cv.pdf",
    title: `${loaded.cv.name}, CV`,
    summary: loaded.cv.headline,
    body: cvToMarkdown(loaded.cv),
  };
}

export function dashboardTwin(about: AboutData): Twin {
  return {
    path: "/dashboard",
    title: "Dashboard",
    summary: "The work, measured live: time in the editor, contributions and AI usage.",
    body: `The figures on this page are read live: time in the editor from WakaTime, contributions from GitHub at github.com/${about.username}, and AI usage. Nothing is typed in by hand, and they change every few minutes, so a copy here would be wrong by the time it was read. Read them on the page: ${SITE_URL}/dashboard`,
  };
}

export async function guestbookTwin(): Promise<Twin> {
  return {
    path: "/guestbook",
    title: "Guestbook",
    summary: "Messages from readers.",
    body: `Readers wrote these messages for the page, not for a dataset, so their words are not copied into Markdown. Read and add to them on the page: ${SITE_URL}/guestbook`,
  };
}

export function contactTwin(about: AboutData): Twin {
  return {
    path: "/contact",
    title: "Contact",
    summary: "Work, a question about one of the APIs, or a note to say hello.",
    body: [
      list([`Email: ${about.social_media.email}`, "Replies: in 1 to 2 hours, weekdays, GMT+7", "The form on the page is protected by Turnstile and needs a browser."]),
      `## Elsewhere online\n\n${list(socialLinks(about).map((s) => `${s.label}: ${s.href}`))}`,
    ].join("\n\n"),
  };
}

export async function openhireTwin(about: AboutData): Promise<Twin | null> {
  const [work, hiring] = await Promise.all([about.is_open_to_work ? getOpenToWorkData() : null, about.is_hiring ? getHiringData() : null]);
  if (!work && !hiring) return null;
  const parts: string[] = [];
  if (work)
    parts.push(
      `## Open to work\n\n${list([
        `Status: ${work.status}; available ${work.availability}; notice ${work.notice_period}`,
        `Level: ${work.experience_level}`,
        `Roles: ${work.preferred_roles.join(", ")}`,
        `Employment: ${work.type.join(", ")}; work mode: ${work.location_types.join(", ")}`,
        `Locations: ${work.preferred_locations.join(", ")}; remote: ${work.remote ? "yes" : "no"}; relocation: ${work.relocation ? "yes" : "no"}`,
        `Languages: ${work.languages.join(", ")}`,
        `Strongest in: ${work.skills_highlight.join(", ")}`,
        `Salary: ${work.salary_expectation}`,
      ])}\n\n${work.additional_notes}`,
    );
  if (hiring)
    parts.push(
      `## Hiring at ${hiring.company_name}\n\n${hiring.company_description}. ${hiring.website}\n\n${
        hiring.positions.length ? list(hiring.positions.map((p) => `**${p.title}**: ${[p.salary_range, p.experience_required, p.location].filter(Boolean).join("; ")}`)) : "No open roles right now."
      }\n\n### Culture\n\n${list(hiring.company_culture)}\n\n### Process\n\n${list(hiring.application_process)}`,
    );
  return {
    path: "/openhire",
    title: "Open-hire",
    summary: [work ? `Open to work (${work.status.toLowerCase()})` : "", hiring ? `${hiring.company_name} is ${hiring.hiring_status.toLowerCase()}` : ""].filter(Boolean).join(", ") + ".",
    body: parts.join("\n\n"),
  };
}

export async function legalTwin(slug: string): Promise<Twin | null> {
  const document = await getLegalDocument(slug);
  if (!document) return null;
  const rows = (items: Record<string, unknown>) => list(Object.entries(items ?? {}).map(([k, v]) => `**${k}**: ${htmlToMarkdown(String(v ?? "")).replace(/\s+/g, " ")}`));
  return {
    path: document.url,
    title: document.title,
    summary: clip(document.summary),
    body: `Last updated ${longDate(document.last_updated)}.\n\n${document.sections
      .map((s) => [`## ${s.heading}`, htmlToMarkdown(s.body), rows(s.items), ...s.children.map((c) => [`### ${c.heading}`, htmlToMarkdown(c.body), rows(c.items)].filter(Boolean).join("\n\n"))].filter(Boolean).join("\n\n"))
      .join("\n\n")}`,
  };
}

/** What `/llms.txt` lists, in order: every twin that has a path of its own. */
export async function everyTwin(): Promise<{ pages: Twin[]; projects: Twin[]; writing: Twin[]; optional: Twin[] }> {
  const about = await getAboutData();
  if (!about) return { pages: [], projects: [], writing: [], optional: [] };
  const [home, work, writing, aboutPage, cv, openhire, projects, blogs, legal] = await Promise.all([
    homeTwin(about),
    projectsTwin(),
    blogTwin(),
    aboutTwin(about),
    cvTwin(),
    openhireTwin(about),
    getProjects(),
    getBlogs(),
    getLegalDocuments(),
  ]);
  const [projectPages, postPages, legalPages, guestbook] = await Promise.all([
    Promise.all(sortProjects(projects).map((p) => projectTwin(p.slug))),
    Promise.all(blogs.map((p) => postTwin(p.slug, about))),
    Promise.all(legal.map((d) => legalTwin(d.slug))),
    guestbookTwin(),
  ]);
  const found = <T>(items: (T | null)[]) => items.filter((item): item is T => item !== null);
  return {
    pages: [home, work, writing, aboutPage, ...(cv ? [cv] : []), contactTwin(about), ...(openhire ? [openhire] : [])],
    projects: found(projectPages),
    writing: found(postPages),
    optional: [dashboardTwin(about), guestbook, ...found(legalPages)],
  };
}

export const frontMatter = (twin: Twin) =>
  `---\ntitle: ${JSON.stringify(twin.title)}\nurl: ${JSON.stringify(SITE_URL + (twin.page ?? (twin.path === "/" ? "" : twin.path)))}\nmarkdown: ${JSON.stringify(SITE_URL + twinOf(twin.path))}\nsummary: ${JSON.stringify(twin.summary)}\n---\n\n`;

export const render = (twin: Twin) => `${frontMatter(twin)}# ${twin.title}\n\n> ${twin.summary}\n\n${twin.body.trim()}\n\n## Elsewhere\n\n- This page for people: ${SITE_URL}${twin.page ?? (twin.path === "/" ? "/" : twin.path)}\n- Index of every page as Markdown: [llms.txt](${SITE_URL}/llms.txt)\n`;
