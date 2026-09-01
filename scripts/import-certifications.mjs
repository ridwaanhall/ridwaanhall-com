/**
 * Import the certifications from a saved LinkedIn page.
 *
 * `certifications.html` is the "Licenses & certifications" page saved from a
 * profile. This reads the 110 entries out of it, matches each issuer to an
 * `app.organization`, and inserts what the database does not already hold.
 *
 * **A dry run unless given `--apply`**, and the dry run is the review: a parser
 * that writes a hundred rows deserves better than trust, and a one-off import
 * does not earn a fixture and a suite of its own. So it prints every row it
 * would insert, every organization it would create and every entry it is
 * skipping with the reason, and that output is meant to be read before the
 * second run.
 *
 * Take `scripts/export-certifications.mjs` first. There is no local database
 * here -- this writes to the live project.
 *
 *   npx tsx --conditions=react-server scripts/import-certifications.mjs
 *   npx tsx --conditions=react-server scripts/import-certifications.mjs --apply
 */
import { readFileSync, existsSync } from "node:fs";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const APPLY = process.argv.includes("--apply");
const SOURCE = process.argv.find((arg) => arg.endsWith(".html")) ?? "certifications.html";

const { db, pool } = await import("../lib/db/client.ts");
const { certification, organization } = await import("../lib/db/app-schema.ts");
const { slugify } = await import("../lib/admin/form.ts");
const { eq } = await import("drizzle-orm");

if (!existsSync(SOURCE)) {
  console.error(`${SOURCE} does not exist -- nothing to import.`);
  process.exit(1);
}

/* ---------------------------------------------------------------------------
   Reading the page
   --------------------------------------------------------------------------- */

/**
 * One issuer name this page uses that is not the organization it means.
 *
 * LinkedIn labels every LinkedIn Learning course as plain "LinkedIn", and this
 * database has both: `LinkedIn` is named by three awards and no certifications,
 * `LinkedIn Learning` by the two courses already stored. All 76 of these carry
 * a `linkedin.com/learning/certificates/...` credential, so they are the same
 * kind of thing as those two and belong with them -- sending them to `LinkedIn`
 * would file one course provider under two names.
 *
 * Written out rather than guessed at by fuzzy matching. A rule that decides two
 * names are "similar enough" is a rule that will one day merge two organizations
 * that are genuinely different, silently, and the fix is a delete that
 * `ON DELETE RESTRICT` will not allow.
 */
const ISSUER_ALIASES = new Map([["linkedin", "LinkedIn Learning"]]);

const MONTHS = Object.fromEntries(
  "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ").map((name, i) => [name, i + 1]),
);

const unescape = (value) =>
  value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    // Last, or an entity written `&amp;lt;` would decode twice.
    .replace(/&amp;/g, "&");

const textOf = (html) => unescape(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();

/**
 * Every entry on the page, in the order it appears.
 *
 * The markup carries no stable class names -- they are build hashes, and the
 * only `data-testid` on the page names the page itself -- so the structure is
 * read from the one piece of text that is reliably shaped: a paragraph saying
 * `Issued <Mon> <Year>`. The title is the paragraph two before it and the
 * issuer the one before, which holds for all 110 and is checked below by the
 * fact that exactly eleven distinct issuers come out.
 *
 * Fourteen entries add `- Expires <Mon> <Year>`. There is no column for an
 * expiry date and adding one is a schema change this does not need, so the
 * match is anchored at the start and the rest of the line is dropped.
 */
function parseEntries(html) {
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map((match) => ({
    at: match.index,
    text: textOf(match[1]),
  }));

  const anchors = paragraphs
    .map((paragraph, index) => ({ index, issued: /^Issued ([A-Z][a-z]{2}) (\d{4})/.exec(paragraph.text) }))
    .filter((entry) => entry.issued !== null);

  // Where each entry starts, so a credential link is only ever claimed by the
  // entry it sits inside. Without the bound, an entry with no link of its own
  // silently borrows the next entry's.
  const bounds = anchors.map((entry) => paragraphs[entry.index - 2].at).concat(html.length);

  return anchors.map((entry, position) => {
    const [, month, year] = entry.issued;
    return {
      title: paragraphs[entry.index - 2].text,
      issuer: paragraphs[entry.index - 1].text,
      issued: `${year}-${String(MONTHS[month]).padStart(2, "0")}-01`,
      credentialUrl: credentialIn(html.slice(bounds[position], bounds[position + 1])),
    };
  });
}

/**
 * The credential link inside one entry, or `""`.
 *
 * Found by its text rather than by its href: an entry also links the skills it
 * is tagged with, and both are ordinary anchors. "Show credential" is the label
 * LinkedIn puts on the one that matters.
 *
 * A link to somewhere other than LinkedIn is wrapped in a redirector --
 * `linkedin.com/safety/go/?url=<the real one, percent-encoded>` -- which is
 * unwrapped here. Storing the wrapper would put a tracking hop and a signed
 * hash that expires between a reader and the certificate.
 */
function credentialIn(segment) {
  for (const match of segment.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
    if (!textOf(match[2]).includes("Show credential")) continue;
    const href = unescape(match[1]);
    if (!href.includes("/safety/go/")) return href;
    const wrapped = new URL(href).searchParams.get("url");
    return wrapped ?? href;
  }
  return "";
}

/**
 * The link as it should be stored: the tracking parameter off, nothing else.
 *
 * Deliberately not `credentialKey`, which also lower-cases and drops a trailing
 * slash. That is fine for *comparing* two links and wrong for keeping one --
 * a certificate hash is case-sensitive, and a path that has been lower-cased is
 * a link that may no longer resolve.
 *
 * `?trk=share_certificate` is LinkedIn's attribution on a link somebody shared,
 * carried by some of these and not others. It says nothing about the
 * certificate, none of the rows already stored has it, and it is the kind of
 * parameter that turns one URL into two.
 */
function storedUrl(url) {
  return url
    .trim()
    .replace(/[?&]trk=[^&]*/g, "")
    .replace(/[?&]+$/, "");
}

/**
 * A credential URL reduced to what identifies the certificate.
 *
 * Two things move without the certificate changing: LinkedIn appends
 * `?trk=share_certificate` to some of the same links and not to others, and a
 * trailing slash comes and goes. Both would defeat the duplicate check, which is
 * the one thing standing between a second run and a hundred duplicate rows.
 */
function credentialKey(url) {
  return url
    .trim()
    .toLowerCase()
    .replace(/[?&]trk=[^&]*/g, "")
    .replace(/[?&]+$/, "")
    .replace(/\/+$/, "");
}

/* ---------------------------------------------------------------------------
   Planning the write
   --------------------------------------------------------------------------- */

const entries = parseEntries(readFileSync(SOURCE, "utf8"));
if (entries.length === 0) {
  console.error(`No certifications found in ${SOURCE}. The page markup may have changed.`);
  process.exit(1);
}

const organizations = await db
  .select({ id: organization.id, name: organization.name, slug: organization.slug })
  .from(organization);
const stored = await db
  .select({
    title: certification.title,
    issued: certification.issued,
    credentialUrl: certification.credentialUrl,
    organizationName: organization.name,
  })
  .from(certification)
  .innerJoin(organization, eq(certification.organizationId, organization.id));

const orgByName = new Map(organizations.map((row) => [row.name.toLowerCase(), row]));
const orgSlugs = new Set(organizations.map((row) => row.slug));

/*
 * What the database already holds, by the two keys a duplicate can be caught on.
 *
 * The credential URL is the real identity, and the live data is why: four
 * entries on this page are already stored under a *different title* -- one is
 * listed in Indonesian as "Machine Learning Terapan" where the record says
 * "Applied Machine Learning", and another is simply reworded between the two --
 * so a title comparison would have inserted every one of them a second time.
 * Their URLs match to the character.
 *
 * Title and date are the fallback for a row with no URL to compare, which is
 * exactly one entry here.
 */
const storedUrls = new Set(stored.map((row) => credentialKey(row.credentialUrl)).filter(Boolean));
const storedTitles = new Set(stored.map((row) => `${row.title.toLowerCase()}@${row.issued}`));

/** Organizations this run would create, keyed so two entries share one. */
const creating = new Map();
const plan = [];
const skipped = [];

/**
 * One course, from one issuer, in one month.
 *
 * Seeded from the database as well as filled in as the page is read, and the
 * first half is what makes a second run a no-op. LinkedIn issues a fresh
 * certificate when a course is retaken and lists every issue, so the page holds
 * two entries for one course with two different hashes. The first run inserts
 * one and collapses the other; without the database in this set, the *second*
 * run would find the collapsed one unmatched -- its hash is nowhere -- and
 * insert it as new, so the import would add two rows every time it was run.
 */
const seenInPage = new Set(
  stored.map((row) => `${row.organizationName.toLowerCase()}@${row.title.toLowerCase()}@${row.issued}`),
);

/** Rows this page repeats, collapsed to the first, and reported. */
const collapsed = [];

for (const entry of entries) {
  const wanted = ISSUER_ALIASES.get(entry.issuer.toLowerCase()) ?? entry.issuer;
  const key = credentialKey(entry.credentialUrl);

  /*
   * Against the database, the credential URL is the identity, and the fallback
   * is only for a row that has none to compare.
   *
   * Ordering them the other way round -- title first -- is what the first
   * version did, and it read ten entries as already stored that were not: the
   * page lists the same course several times in one month, so `title@issued`
   * collides between two *new* rows and not with anything in the database at
   * all. A title is not an identity here; the certificate hash is.
   */
  if (key ? storedUrls.has(key) : storedTitles.has(`${entry.title.toLowerCase()}@${entry.issued}`)) {
    skipped.push({ entry, why: key ? "already stored (same credential)" : "already stored (same title and date)" });
    continue;
  }

  /*
   * Within the page, the same course in the same month is one row.
   *
   * Eight courses are listed two or three times, each with a certificate hash
   * of its own -- LinkedIn issues a new one on a retake and lists every issue.
   * They are genuinely distinct certificates and they would render as identical
   * cards: "Administrative Human Resources -- Dec 2024", three times, on the
   * about page and in the admin list. That reads as a fault in the site rather
   * than as three retakes, so the first is kept and the rest are reported. The
   * links that go with them are still in the saved page.
   */
  const pageKey = `${wanted.toLowerCase()}@${entry.title.toLowerCase()}@${entry.issued}`;
  if (seenInPage.has(pageKey)) {
    collapsed.push(entry);
    continue;
  }
  seenInPage.add(pageKey);

  const existing = orgByName.get(wanted.toLowerCase());
  if (!existing && !creating.has(wanted.toLowerCase())) {
    creating.set(wanted.toLowerCase(), { name: wanted, slug: uniqueSlug(wanted) });
  }

  plan.push({ ...entry, organizationName: wanted, organizationId: existing?.id ?? null });
  // So a half-applied run cannot re-plan a row a later pass already wrote.
  if (key) storedUrls.add(key);
  else storedTitles.add(`${entry.title.toLowerCase()}@${entry.issued}`);
}

/**
 * A slug no organization is using.
 *
 * `slugify` is imported from `lib/admin/form.ts` rather than repeated, so a name
 * typed into the admin and a name arriving through here reach the same slug.
 * The suffix is for a collision between two different names that reduce to one
 * -- `organization.slug` is UNIQUE, so the alternative is an insert that fails
 * halfway through the batch.
 */
function uniqueSlug(name) {
  const base = slugify(name) || "organization";
  let slug = base;
  for (let n = 2; orgSlugs.has(slug); n++) slug = `${base}-${n}`;
  orgSlugs.add(slug);
  return slug;
}

/* ---------------------------------------------------------------------------
   Reporting, then writing
   --------------------------------------------------------------------------- */

const byIssuer = new Map();
for (const row of plan) byIssuer.set(row.organizationName, (byIssuer.get(row.organizationName) ?? 0) + 1);

console.log(
  `\n${entries.length} entr(ies) in ${SOURCE}` +
    `${APPLY ? "" : "   (dry run -- pass --apply to write)"}\n`,
);

if (creating.size > 0) {
  console.log(`organizations to create (${creating.size}) -- name and slug only, the rest is yours\n`);
  for (const row of creating.values()) {
    console.log(`  + ${row.name}   ->  ${row.slug}   (${byIssuer.get(row.name) ?? 0} certification(s))`);
  }
  console.log("");
}

console.log(`certifications to insert (${plan.length})\n`);
for (const row of plan) {
  console.log(`  ${row.issued}  ${row.organizationName.slice(0, 26).padEnd(28)}${row.title}`);
  if (!row.credentialUrl) console.log(`  ${" ".repeat(40)}(no credential link)`);
}

if (collapsed.length > 0) {
  console.log(`\nlisted more than once on the page, kept once (${collapsed.length})\n`);
  for (const row of collapsed) {
    console.log(`  ${row.issued}  ${row.title.slice(0, 52).padEnd(54)}another issue of the same course`);
  }
}

if (skipped.length > 0) {
  console.log(`\nskipped (${skipped.length})\n`);
  for (const row of skipped) {
    console.log(`  ${row.entry.issued}  ${row.entry.title.slice(0, 52).padEnd(54)}${row.why}`);
  }
}

console.log(
  `\nby organization: ${[...byIssuer.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `${name} ${count}`)
    .join(", ")}\n`,
);

if (!APPLY) {
  console.log("Nothing written. Read the above, then pass --apply.\n");
  await pool.end();
  process.exit(0);
}

if (plan.length === 0 && creating.size === 0) {
  console.log("Nothing to do.\n");
  await pool.end();
  process.exit(0);
}

/*
 * One transaction for the lot.
 *
 * The organizations have to land before the certifications that name them, and
 * a run that created seven organizations and then failed on the ninetieth
 * certification would leave the database in a state where re-running is not
 * obviously safe. It is all or nothing instead, so the only two outcomes are
 * "the import happened" and "nothing happened".
 */
let created = 0;
let inserted = 0;

await db.transaction(async (tx) => {
  for (const row of creating.values()) {
    const [made] = await tx
      .insert(organization)
      .values({ name: row.name, slug: row.slug })
      .returning({ id: organization.id });
    row.id = made.id;
    created++;
  }

  for (const row of plan) {
    const organizationId =
      row.organizationId ?? creating.get(row.organizationName.toLowerCase())?.id;
    if (!organizationId) {
      // Unreachable: every row either matched an organization or put one in
      // `creating`. Throwing rolls the whole thing back rather than writing a
      // certification against nothing, which the NOT NULL would refuse anyway.
      throw new Error(`No organization for "${row.organizationName}"`);
    }

    await tx.insert(certification).values({
      organizationId,
      title: row.title,
      issued: row.issued,
      credentialUrl: storedUrl(row.credentialUrl),
      // Nothing on this page says what belongs at the top of the about page.
      // That is an editorial call, and it is made in the admin.
      isFeatured: false,
    });
    inserted++;
  }
});

console.log(`Created ${created} organization(s) and inserted ${inserted} certification(s).\n`);

await pool.end();
