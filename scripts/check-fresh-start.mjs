/**
 * Nothing in the repository explains itself by reference to what came before.
 *
 * This project was ported from another stack, and for a while every second
 * comment was a comparison: "X did this with Y", "matching X's default",
 * "kept until cutover". Each of those was true and load-bearing while both
 * things existed side by side. None of them is now, and to somebody reading
 * this repository for the first time they are worse than noise -- they describe
 * behaviour of a system that is not here, in terms of files they cannot open.
 *
 * The reason a piece of code is the way it is nearly always survives the
 * comparison it was first written as. "Grouped by organization, the way the old
 * template's regroup tag did" is a fact about a dead template; "grouped by
 * organization, so somebody with three roles at one employer reads as one
 * entry" is the same decision, stated so it can still be checked. This fails
 * until every comment has made that trip.
 *
 * The second half is the same idea pointed inwards. A comment that cites a file
 * in this repository is only useful while the file is there, and the way that
 * stops being true is not deletion but consolidation: the migration ladder was
 * folded into one `0000_init.sql`, and eleven comments across nine files were
 * left pointing at `drizzle/0003`, `0004`, `0005` and `0007` -- four files that
 * no longer exist. Each of those comments was otherwise correct, which is why
 * nobody noticed; a reader following one finds nothing and has no way to tell
 * whether the explanation was wrong or the file merely moved.
 *
 *   node scripts/check-fresh-start.mjs
 *
 * **The needles are assembled at runtime, never spelled out.** A check written
 * to prove a word is absent, that contains the word in order to look for it,
 * can never pass -- and `git ls-files` includes this file. The same trap caught
 * `scripts/check-css-sources.mjs`, which named a Tailwind utility in order to
 * assert its absence and kept it alive for the scanner by doing so.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};

/** Built from pieces so this file does not match itself. */
const word = (...parts) => parts.join("");

/**
 * Names of the thing that used to be here.
 *
 * The first version of this check looked only for those, and it was not enough:
 * it passed while 28 comments still cited a source file by path -- a Python
 * module, a template. Those say exactly the same thing as naming the framework
 * and are just as unopenable, so the needles below match the *shape* of a
 * reference as well as the name of the stack.
 */
const needles = [
  word("dj", "ango"),
  word("all", "auth"),
  word("manage", ".p", "y"),
  word("dump", "data"),
  word("MIGRATION", ".md"),
  word("content", "_type_id"),
];

/**
 * Path-shaped references, which a substring search cannot separate from
 * ordinary use.
 *
 * A Python extension has no business in this repository at all. A template path
 * needs the slash to be a path -- `body.html` is a property on the object the
 * email renderer returns, and matching that would make this check unpassable
 * for a reason that has nothing to do with what it is for.
 */
const patterns = [
  new RegExp(word("\\", ".p", "y\\b")),
  new RegExp(word("[\\w-]+\\/[\\w-]+\\", ".htm", "l\\b")),
];

/*
 * Three places name a framework as *content* rather than as provenance, and
 * they are correct to. The site owner lists it among their skills, so it
 * belongs in the SEO keywords the same way Python and Machine Learning do, and
 * one comment uses a search for it as the example of what a `?q=` URL looks
 * like. Stripping those would be editing someone's CV to satisfy a lint rule.
 *
 * Recorded as an exact count per file rather than a blanket exemption: a new
 * comparison written into any of these still fails, because the count moves.
 */
const CONTENT_MENTIONS = {
  "lib/seo/config.ts": 1, // `technical` keywords -- a skill, listed beside Python
  "lib/seo/schema.ts": 1, // the same list again, in the JSON-LD `keywords`
  "components/site/search-form.tsx": 1, // a `?q=` example URL that searches for it
  "CODE_OF_CONDUCT.md": 1, // the Contributor Covenant's own URL, which ends in .html
};

const tracked = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

/*
 * Text only. A font or a favicon can hold any byte sequence, and a match inside
 * one says nothing about what the repository reads like.
 */
const TEXT = /\.(ts|tsx|js|jsx|mjs|cjs|json|sql|css|md|yml|yaml|txt|html|svg)$/i;

const hits = [];
for (const file of tracked.filter((f) => TEXT.test(f) && existsSync(f))) {
  const body = readFileSync(file, "utf8");
  const lower = body.toLowerCase();
  const relevant =
    needles.some((needle) => lower.includes(needle.toLowerCase())) ||
    patterns.some((pattern) => pattern.test(body));
  if (!relevant) continue;

  for (const [i, line] of body.split("\n").entries()) {
    const named = needles.some((needle) => line.toLowerCase().includes(needle.toLowerCase()));
    const shaped = patterns.some((pattern) => pattern.test(line));
    if (named || shaped) hits.push(`${file}:${i + 1}`);
  }
}

/*
 * Every repository path a comment points at, and whether it is still there.
 *
 * Deliberately narrow. A path is only recognised here if it names one of the
 * directories this project actually has and ends in an extension it actually
 * uses -- anything looser starts matching URLs, package names and prose, and a
 * guard that cries wolf is one somebody switches off. Import specifiers are not
 * matched because they are written `@/lib/...`, and those the compiler checks
 * anyway; what this covers is the references only a person ever follows.
 *
 * The extensions are longest-first, which is not cosmetic: alternation matches
 * leftmost, so `ts|tsx` truncates every `.tsx` path to a `.ts` one that does not
 * exist and reports the whole component tree as dangling.
 */
const CITED = /\b((?:app|components|lib|scripts|drizzle|styles|docs|tests)\/[\w./[\]()-]*\.(?:tsx|ts|mjs|sql|css|md))(?![\w])/g;

/*
 * The lockfile is excluded, and only the lockfile. It lists the files inside
 * every installed package, thousands of which are `lib/*.mjs` by coincidence of
 * naming -- none of them a path into this repository, and none of them written
 * by anyone here.
 */
const dangling = [];
const CITABLE = tracked.filter(
  (f) => TEXT.test(f) && existsSync(f) && f !== "package-lock.json",
);

for (const file of CITABLE) {
  for (const [i, line] of readFileSync(file, "utf8").split("\n").entries()) {
    for (const [, cited] of line.matchAll(CITED)) {
      // A trailing dot belongs to the sentence, not to the filename.
      const path = cited.replace(/\.$/, "");
      if (!existsSync(path)) dangling.push(`${file}:${i + 1} -> ${path}`);
    }
  }
}

check(dangling.length === 0, "every file a comment points at is one this repository has",
  dangling.slice(0, 12).join("; "));

const byFile = new Map();
for (const hit of hits) {
  const file = hit.slice(0, hit.lastIndexOf(":"));
  byFile.set(file, (byFile.get(file) ?? 0) + 1);
}

const unexplained = [...byFile.entries()].filter(
  ([file, n]) => n !== (CONTENT_MENTIONS[file] ?? 0),
);
const worst = unexplained.sort((a, b) => b[1] - a[1]);
const total = worst.reduce((sum, [, n]) => sum + n, 0);

check(
  worst.length === 0,
  `no tracked file explains itself by what came before (${tracked.length} tracked, ${worst.length} with hits)`,
  worst.length ? `${total} line(s); worst: ${worst.slice(0, 6).map(([f, n]) => `${f} (${n})`).join(", ")}` : "",
);

// ---------------------------------------------------------------------------
// The structural half: what the tree holds, not what it says
// ---------------------------------------------------------------------------

const sql = tracked.filter((f) => f.startsWith("drizzle/") && f.endsWith(".sql"));
const baseline = sql.filter((f) => !f.includes("9999"));
check(
  baseline.length === 1 && baseline[0] === "drizzle/0000_init.sql",
  "the schema is one file, not a ladder to replay",
  sql.join(", "),
);

const comparisons = tracked.filter((f) => /^scripts\/compare-/.test(f));
check(comparisons.length === 0, "no harness diffs this site against another one", comparisons.join(", "));

/*
 * The mapping is generated from the live schema by `gen-app-schema.mjs`. A
 * second, hand-maintained mapping of a schema nothing reads was dead weight in
 * every server bundle for as long as it sat next to it.
 */
const schemaModules = tracked.filter((f) => /^lib\/db\/(schema|relations)\.ts$/.test(f));
check(schemaModules.length === 0, "only one schema mapping exists", schemaModules.join(", "));

const notes = tracked.filter((f) => /^(MIGRATION|CHANGELOG-MIGRATION)\.md$/i.test(f));
check(notes.length === 0, "no working notes from the port are still shipped", notes.join(", "));

console.log(
  failures === 0
    ? "\nThe repository reads as its own thing."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
