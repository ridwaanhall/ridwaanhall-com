import "server-only";

import { getAboutData } from "@/lib/data/about";
import { SITE_URL } from "@/lib/seo/config";
import { twinOf } from "@/lib/site/twins";

import { everyTwin, render, sentence, type Twin } from "./pages";

const entry = (twin: Twin) => `- [${twin.title}](${SITE_URL}${twinOf(twin.path)}): ${twin.summary.replace(/\s+/g, " ")}`;

/**
 * `/llms.txt`, in the llmstxt.org shape: a title, a quoted summary, a note on
 * how the site is laid out, then sections of links with a line each. The
 * Optional section is what a short context may skip.
 */
export async function llmsIndex(): Promise<string> {
  const about = await getAboutData();
  if (!about) return "# Not available\n";
  const { pages, projects, writing, optional } = await everyTwin();
  return `# ${about.name}

> ${about.role} in ${about.location.residency || about.location.regency}, Indonesia, known online as ${about.username}. ${sentence(about.short_description)} Open to work${about.is_hiring ? " and hiring through RoneAI" : ""}.

Every page on ${SITE_URL} has a Markdown twin at the same path with \`.md\` added: \`/about\` is \`/about.md\`, \`/blog/<slug>\` is \`/blog/<slug>.md\`, and the home page is \`/index.md\`. A request for the page itself with \`Accept: text/markdown\` returns the same Markdown. Drafts are never listed. [llms-full.txt](${SITE_URL}/llms-full.txt) is every page below in one file.

## Pages

${pages.map(entry).join("\n")}

## Projects

${projects.map(entry).join("\n")}

## Writing

${writing.map(entry).join("\n")}

## Optional

${optional.map(entry).join("\n")}
`;
}

/** `/llms-full.txt`: every twin, in the order `llms.txt` lists them, joined. */
export async function llmsFull(): Promise<string> {
  const about = await getAboutData();
  if (!about) return "";
  const { pages, projects, writing, optional } = await everyTwin();
  const all = [...pages, ...projects, ...writing, ...optional];
  return `# ${about.name}: the whole site\n\n> Every page of ${SITE_URL} as Markdown, in the order llms.txt lists them.\n\n${all.map((twin) => render(twin)).join("\n---\n\n")}`;
}
