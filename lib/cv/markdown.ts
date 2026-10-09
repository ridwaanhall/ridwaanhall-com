import type { Cv } from "./select";

/**
 * The CV as Markdown: the same lines the PDF carries, in the same order, under
 * the same section names. Pure, so a test can hold that the two never drift
 * into saying different things -- both are drawn from one `Cv`.
 */
export function cvToMarkdown(cv: Cv): string {
  const contact = cv.contact.map((line) => (line.href ? `[${line.text}](${line.href})` : line.text)).join(" | ");
  const skill = (line: string) => {
    const at = line.indexOf(": ");
    return at > 0 ? `- **${line.slice(0, at)}**: ${line.slice(at + 2)}` : `- ${line}`;
  };
  return [
    contact,
    cv.summary && `## Summary\n\n${cv.summary}`,
    cv.skills.length > 0 && `## Skills\n\n${cv.skills.map(skill).join("\n")}`,
    cv.experience.length > 0 &&
      `## Experience\n\n${cv.experience
        .map((role) => `### ${role.title}, ${role.company}\n\n${role.period}\n\n${role.points.map((point) => `- ${point}`).join("\n")}`)
        .join("\n\n")}`,
    cv.projects.length > 0 && `## Projects\n\n${cv.projects.map((project) => `- **${project.title}**: ${project.line}`).join("\n")}`,
    cv.education.length > 0 && `## Education\n\n${cv.education.map((e) => `- **${e.degree}**, ${e.institution} (${e.years})`).join("\n")}`,
    cv.certifications.length > 0 && `## Certifications\n\n${cv.certifications.map((line) => `- ${line}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
