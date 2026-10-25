/**
 * Patch notes from commit messages: what kind each commit is, what version the
 * push becomes, and the body of its GitHub Release.
 *
 * Pure, so the unit suite holds it. The input is the repository's own commit
 * form, `<emoji><type>(<scope>): <Description>` with no space after the emoji
 * (CONTRIBUTING.md), plus the Conventional Commits marks for a breaking change:
 * a `!` before the colon, or a `BREAKING CHANGE:` footer.
 */

export const KINDS = [
  "breaking",
  "feature",
  "fix",
  "security",
  "performance",
  "refactor",
  "style",
  "docs",
  "test",
  "chore",
  "other",
] as const;

export type Kind = (typeof KINDS)[number];

/**
 * How each kind is headed, in the order above -- which is also the order a
 * release lists them in: what a reader has to act on first, housekeeping last.
 */
export const KIND_LABEL: Record<Kind, string> = {
  breaking: "Breaking changes",
  feature: "New",
  fix: "Fixed",
  security: "Security",
  performance: "Faster",
  refactor: "Under the hood",
  style: "Design",
  docs: "Documentation",
  test: "Tests",
  chore: "Maintenance",
  other: "Other",
};

/** A commit type, as CONTRIBUTING.md spells it, to the kind it is filed under. */
const TYPE_KIND: Record<string, Kind> = {
  feat: "feature",
  fix: "fix",
  security: "security",
  perf: "performance",
  refactor: "refactor",
  style: "style",
  docs: "docs",
  test: "test",
  chore: "chore",
  ci: "chore",
  build: "chore",
  revert: "chore",
};

export type Entry = { kind: Kind; scope: string; body: string; sha: string };

/*
 * Leading emoji are skipped by what they are rather than by a list: the table
 * in CONTRIBUTING.md grows, and ♻️ and ⚡ carry a variation selector that a
 * literal list would have to spell exactly.
 */
const SUBJECT = /^[\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]*([a-z]+)(?:\(([^)]*)\))?(!)?:\s*(.+)$/iu;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m;

/**
 * One commit message as an entry, or null for a commit that is not a change
 * of its own: a merge, or one that asks to be left out with `[skip release]`.
 *
 * A subject that does not follow the convention is still kept, as `other`
 * with the subject as written: a release that silently dropped somebody's
 * commit for its spelling would be worse than one with an untidy line.
 */
export function parseCommit(message: string, sha = ""): Entry | null {
  const subject = message.split("\n", 1)[0].trim();
  if (!subject || /^Merge (pull request|branch|remote-tracking branch)\b/.test(subject)) return null;
  if (/\[(skip release|release skip)\]/i.test(message)) return null;

  const match = SUBJECT.exec(subject);
  if (!match) return { kind: "other", scope: "", body: subject, sha };

  const [, type, scope = "", bang, description] = match;
  const breaking = Boolean(bang) || BREAKING_FOOTER.test(message);
  const kind: Kind = breaking ? "breaking" : (TYPE_KIND[type.toLowerCase()] ?? "other");
  return { kind, scope: scope.trim(), body: description.trim(), sha };
}

export type Version = [number, number, number];

export function parseVersion(text: string): Version | null {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(text.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

export const formatVersion = ([major, minor, patch]: Version) => `${major}.${minor}.${patch}`;

/** Numeric, not lexical: "4.10.0" is newer than "4.9.0". */
export function compareVersions(a: Version, b: Version): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
}

/** The newest of a set of version strings, ignoring any that are not semver. */
export function latestVersion(versions: string[]): Version | null {
  return versions
    .map(parseVersion)
    .filter((v): v is Version => v !== null)
    .reduce<Version | null>((best, v) => (!best || compareVersions(v, best) > 0 ? v : best), null);
}

/**
 * Semver from what the push contains: a breaking change is a major, a new
 * feature a minor, anything else a patch. With no release before it, the
 * first one is `first`.
 */
export function nextVersion(last: Version | null, entries: Entry[], first: Version): Version {
  if (!last) return first;
  const [major, minor, patch] = last;
  if (entries.some((entry) => entry.kind === "breaking")) return [major + 1, 0, 0];
  if (entries.some((entry) => entry.kind === "feature")) return [major, minor + 1, 0];
  return [major, minor, patch + 1];
}

/**
 * A release's title when nobody has written one: its most important line.
 * Breaking first, then new, then fixed -- the same order the release lists.
 */
export function defaultTitle(entries: Entry[]): string {
  const [lead] = [...entries].sort((a, b) => KINDS.indexOf(a.kind) - KINDS.indexOf(b.kind));
  if (!lead) return "Maintenance";
  const body = lead.body.charAt(0).toUpperCase() + lead.body.slice(1);
  return entries.length > 1 ? `${body}, and ${entries.length - 1} more` : body;
}

/** Entries grouped under their kind, in `KINDS` order, empty kinds left out. */
export function groupByKind<T extends { kind: string }>(entries: T[]): [Kind, T[]][] {
  return KINDS.map((kind) => [kind, entries.filter((entry) => entry.kind === kind)] as [Kind, T[]]).filter(
    ([, list]) => list.length > 0,
  );
}

/**
 * The GitHub Release body: the summary, then one section per kind. A line
 * names its scope in bold and ends with the short commit hash, which GitHub
 * links on its own.
 */
export function releaseMarkdown(note: { summary: string; entries: Entry[] }): string {
  const sections = groupByKind(note.entries).map(
    ([kind, list]) =>
      `## ${KIND_LABEL[kind]}\n\n${list
        .map((entry) => `- ${entry.scope ? `**${entry.scope}**: ` : ""}${entry.body}${entry.sha ? ` (${entry.sha.slice(0, 7)})` : ""}`)
        .join("\n")}`,
  );
  return [note.summary.trim(), ...sections].filter(Boolean).join("\n\n");
}
