/**
 * The structured `jsonb` editors, checked for fidelity against the live rows.
 *
 * `CLAUDE.md` names the combination that matters here: a round-trip test plus
 * **a GET-then-POST-unchanged pass over the change forms**, because that pair is
 * what catches CRLF corruption, silently dropped fields and change-detection
 * regressions -- none of which a unit test on the parser alone would see.
 *
 * The rules being defended are Django's, and each has a reason recorded at the
 * original:
 *
 * - **Nothing is trimmed.** Two stored `class` strings contain double spaces and
 *   block text is raw HTML, so normalising would corrupt real data. The one
 *   exception is CRLF, which the browser introduces and the stored data has none
 *   of.
 * - **Object key order is not ours.** `jsonb` normalises it, which is why the
 *   key/value editor offers no reordering -- and why this asserts the absence
 *   of the controls rather than their effect.
 * - **A field the editor never touched comes back byte-identical.**
 *
 * This used to cover the string-list editor too, over
 * `about_experience.responsibilities` and eleven other `jsonb` arrays. Those
 * columns are child tables now -- an experience's tasks are rows, ordered by a
 * `position` column, reachable by id -- so the list editors have no descriptor
 * using them and `scripts/check-admin-inlines.mjs` is what covers that data.
 * `legal_section.items` is the one structured `jsonb` column the admin still
 * edits, and a definition list is genuinely a mapping rather than a table.
 *
 * Every live row it opens is snapshotted first and restored in the `finally`,
 * whatever happens, and the throwaway row it creates for the destructive cases
 * is removed there too.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-json.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { legalDocument, legalSection } = await import("../lib/db/app-schema.ts");
const { eq, sql } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const token = await encode({
  token: { sub: await staffAccountId() },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 15,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

const submit = async () => {
  await page
    .locator('form:has(button[type="submit"]:text-matches("Save|Create"))')
    .locator('button[type="submit"]')
    .click();
  await page.waitForTimeout(1400);
};

/** Whole-row snapshots, put back in the `finally` however this run ends. */
const snapshots = [];
let scratchId = null;

async function snapshot(table, pk, id) {
  const [row] = await db.select().from(table).where(eq(pk, id));
  snapshots.push({ table, pk, id, row });
  return row;
}

try {
  // --- GET then POST unchanged, on a real row -------------------------------
  /*
   * The section with the most stored definitions, found rather than named. It
   * was section 17, chosen because it carries eleven of them and 1440
   * characters -- so "changes nothing" is a claim about real content and not
   * about an empty object. The reason still holds; the number does not.
   */
  const [richest] = await db
    .select({ id: legalSection.id, items: legalSection.items, heading: legalSection.heading })
    .from(legalSection)
    // By stored size rather than by entry count: `items` is an object, and
    // `jsonb_array_length` refuses one outright.
    .orderBy(sql`length(${legalSection.items}::text) desc`)
    .limit(1);

  const target = {
    label: "legal section definitions",
    table: legalSection,
    pk: legalSection.id,
    id: richest.id,
    key: "items",
    path: `/admin/legal-section/${richest.id}`,
  };
  const storedPairs = Object.keys(richest.items).length;

  {
    const before = await snapshot(target.table, target.pk, target.id);
    const wasJson = JSON.stringify(before[target.key]);

    await page.goto(BASE + target.path, { waitUntil: "load" });
    await page.waitForTimeout(900);
    await submit();

    const [after] = await db.select().from(target.table).where(eq(target.pk, target.id));
    check(
      `${target.label}: opening and saving changes nothing`,
      JSON.stringify(after[target.key]) === wasJson,
      `${wasJson.length} chars, ${storedPairs} pairs`,
    );

    // The whole row, not only the JSON column: a field the form failed to carry
    // would be blanked, and looking at one column would not see it.
    const differing = Object.keys(before).filter(
      (column) => JSON.stringify(before[column]) !== JSON.stringify(after[column]),
    );
    check(`${target.label}: no other column moved either`, differing.length === 0, differing.join(", "));
  }

  check(
    "the key/value editor renders every stored pair",
    (await page.locator('textarea[aria-label^="Meaning"]').count()) === storedPairs,
    `${storedPairs} pairs`,
  );
  check(
    "the key/value editor offers no reordering, since jsonb normalises key order",
    (await page.locator('button[aria-label*="Move"]').count()) === 0,
  );

  // --- the destructive cases, on a row this script owns ---------------------
  const [document] = await db.select({ id: legalDocument.id }).from(legalDocument).limit(1);

  /*
   * Values chosen to break anything that normalises on the way through: the
   * spaces and double spaces are what stored `class` strings actually contain,
   * the HTML is what block text actually is, and the newline is the one thing
   * the browser rewrites on its own.
   */
  const AWKWARD = {
    "  padded term  ": "  leading and trailing spaces  ",
    "double  spaced": "double  spaces  inside",
    "markup": "<strong>raw HTML</strong> & an ampersand",
    "multiline": "line one\nline two",
  };

  const [scratch] = await db
    .insert(legalSection)
    .values({
      documentId: document.id,
      heading: "zz-json-check",
      body: "",
      items: AWKWARD,
      position: 999,
    })
    .returning({ id: legalSection.id });
  scratchId = scratch.id;

  await page.goto(`${BASE}/admin/legal-section/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);

  /*
   * Compared as a mapping, never as a list of pairs. `jsonb` does not preserve
   * object key order -- it is the reason the editor offers no reordering, and
   * it means the order the fields come back in is not ours to assert.
   */
  const canonical = (mapping) =>
    JSON.stringify(Object.fromEntries(Object.entries(mapping).sort(([a], [b]) => a.localeCompare(b))));

  const shown = await page.evaluate(() => {
    const terms = [...document.querySelectorAll('input[aria-label^="Term"]')].map((el) => el.value);
    const meanings = [...document.querySelectorAll('textarea[aria-label^="Meaning"]')].map((el) => el.value);
    return Object.fromEntries(terms.map((term, index) => [term, meanings[index]]));
  });
  check(
    "the editor shows every pair exactly as stored",
    canonical(shown) === canonical(AWKWARD),
    `${Object.keys(shown).length} pairs`,
  );

  await submit();
  const [saved] = await db
    .select({ items: legalSection.items })
    .from(legalSection)
    .where(eq(legalSection.id, scratchId));
  check(
    "and saves them back with nothing trimmed or collapsed",
    canonical(saved.items) === canonical(AWKWARD),
    canonical(saved.items).slice(0, 70),
  );

  // A textarea's *submission* value is CRLF-normalised per the HTML spec, and
  // none of the stored data contains a carriage return. Typing a newline is how
  // one gets in, so this types one.
  await page.goto(`${BASE}/admin/legal-section/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  // Found by its term, not by its position: which row the multiline entry lands
  // on is decided by `jsonb`, not by the order it was written in.
  const multilineRow = await page.evaluate(() =>
    [...document.querySelectorAll('input[aria-label^="Term"]')].findIndex(
      (el) => el.value === "multiline",
    ),
  );
  await page
    .locator(`textarea[aria-label="Meaning ${multilineRow + 1}"]`)
    .fill("typed one\ntyped two");
  await submit();

  const [crlf] = await db
    .select({ items: legalSection.items })
    .from(legalSection)
    .where(eq(legalSection.id, scratchId));
  const typed = crlf.items["multiline"];
  check(
    "a newline typed into an entry is stored as LF, never CRLF",
    typed === "typed one\ntyped two",
    JSON.stringify(typed),
  );

  // Removing the last entry has to clear the mapping rather than leave the old
  // one in place -- the failure `construct_instance` caused in Django, which
  // the one-named-control shape was chosen to avoid.
  await page.goto(`${BASE}/admin/legal-section/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const entries = await page.locator('button[aria-label^="Remove entry"]').count();
  for (let index = 0; index < entries; index++) {
    await page.locator('button[aria-label^="Remove entry"]').first().click();
  }
  await submit();

  const [emptied] = await db
    .select({ items: legalSection.items })
    .from(legalSection)
    .where(eq(legalSection.id, scratchId));
  check(
    "clearing the editor stores an empty mapping, not the old one",
    emptied.items && Object.keys(emptied.items).length === 0,
    JSON.stringify(emptied.items),
  );
} finally {
  if (scratchId !== null) {
    await db.delete(legalSection).where(eq(legalSection.id, scratchId));
    console.log(`  ..    cleaned up legal section #${scratchId}`);
  }

  for (const { table, pk, id, row } of snapshots) {
    await db.update(table).set(row).where(eq(pk, id));
  }

  // Prove the restore, rather than trusting it.
  let restored = true;
  for (const { table, pk, id, row } of snapshots) {
    const [now] = await db.select().from(table).where(eq(pk, id));
    if (JSON.stringify(now) !== JSON.stringify(row)) restored = false;
  }
  check(`every row this opened is back as it was (${snapshots.length})`, restored);

  await browser.close();
  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} JSON editor checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
