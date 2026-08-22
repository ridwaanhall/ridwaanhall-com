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
 * - **List order is real and must survive**, because Postgres `jsonb` preserves
 *   array order. Object key order is *not* ours -- `jsonb` normalises it -- which
 *   is why the key/value editor offers no reordering.
 * - **A field the editor never touched comes back byte-identical.**
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
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { aboutExperience, aboutOrganization, legalLegalsection } = await import(
  "../lib/db/schema.ts"
);
const { eq } = await import("drizzle-orm");

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const token = await encode({
  token: { sub: "1" },
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
  // --- GET then POST unchanged, on real rows --------------------------------
  const targets = [
    { label: "experience responsibilities", table: aboutExperience, pk: aboutExperience.id, id: 1, key: "responsibilities", path: "/admin/experience/1" },
    // Section 17 rather than the first one: it carries eleven definitions and
    // 1440 characters of them, so "changes nothing" is a claim about real
    // content rather than about an empty object.
    { label: "legal section definitions", table: legalLegalsection, pk: legalLegalsection.id, id: 17, key: "items", path: "/admin/legal-section/17" },
  ];

  for (const target of targets) {
    const before = await snapshot(target.table, target.pk, target.id);
    const wasJson = JSON.stringify(before[target.key]);

    await page.goto(BASE + target.path, { waitUntil: "load" });
    await page.waitForTimeout(900);
    await submit();

    const [after] = await db.select().from(target.table).where(eq(target.pk, target.id));
    check(
      `${target.label}: opening and saving changes nothing`,
      JSON.stringify(after[target.key]) === wasJson,
      `${wasJson.length} chars`,
    );

    // The whole row, not only the JSON column: a field the form failed to carry
    // would be blanked, and looking at one column would not see it.
    const differing = Object.keys(before).filter(
      (column) => JSON.stringify(before[column]) !== JSON.stringify(after[column]),
    );
    check(`${target.label}: no other column moved either`, differing.length === 0, differing.join(", "));
  }

  // --- the destructive cases, on a row this script owns ---------------------
  const [org] = await db.select({ id: aboutOrganization.id }).from(aboutOrganization).limit(1);

  const AWKWARD = [
    "  leading and trailing spaces  ",
    "double  spaces  inside",
    "<strong>raw HTML</strong> & an ampersand",
    "line one\nline two",
  ];

  const [scratch] = await db
    .insert(aboutExperience)
    .values({
      title: "zz-json-check",
      employmentType: "Full-time",
      locationType: "Remote",
      location: "",
      isCurrent: false,
      responsibilities: AWKWARD,
      sortOrder: 999,
      periodStart: "2020-01-01",
      periodEnd: null,
      organizationId: org.id,
    })
    .returning({ id: aboutExperience.id });
  scratchId = scratch.id;

  await page.goto(`${BASE}/admin/experience/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);

  const shown = await page.evaluate(() =>
    [...document.querySelectorAll('textarea[aria-label^="responsibility"]')].map((el) => el.value),
  );
  check(
    "the editor shows every entry exactly as stored",
    JSON.stringify(shown) === JSON.stringify(AWKWARD),
    `${shown.length} entries`,
  );

  await submit();
  const [saved] = await db
    .select({ responsibilities: aboutExperience.responsibilities })
    .from(aboutExperience)
    .where(eq(aboutExperience.id, scratchId));
  check(
    "and saves them back with nothing trimmed or collapsed",
    JSON.stringify(saved.responsibilities) === JSON.stringify(AWKWARD),
    JSON.stringify(saved.responsibilities).slice(0, 60),
  );

  // A textarea's *submission* value is CRLF-normalised per the HTML spec, and
  // none of the stored data contains a carriage return. Typing a newline is how
  // one gets in, so this types one.
  await page.goto(`${BASE}/admin/experience/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  await page.locator('textarea[aria-label="responsibility 4"]').fill("typed one\ntyped two");
  await submit();

  const [crlf] = await db
    .select({ responsibilities: aboutExperience.responsibilities })
    .from(aboutExperience)
    .where(eq(aboutExperience.id, scratchId));
  const typed = crlf.responsibilities[3];
  check(
    "a newline typed into an entry is stored as LF, never CRLF",
    typed === "typed one\ntyped two",
    JSON.stringify(typed),
  );

  // Order is meaningful and `jsonb` preserves it, so the reorder control has to
  // actually move things.
  await page.goto(`${BASE}/admin/experience/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  await page.locator('button[aria-label="Move responsibility 1 down"]').click();
  await submit();

  const [reordered] = await db
    .select({ responsibilities: aboutExperience.responsibilities })
    .from(aboutExperience)
    .where(eq(aboutExperience.id, scratchId));
  check(
    "moving an entry down reorders the stored list",
    reordered.responsibilities[0] === AWKWARD[1] && reordered.responsibilities[1] === AWKWARD[0],
    JSON.stringify(reordered.responsibilities.slice(0, 2)).slice(0, 70),
  );

  // Removing the last entry has to clear the list rather than leave the old one
  // in place -- the failure `construct_instance` caused in Django, which the
  // one-named-control shape was chosen to avoid.
  await page.goto(`${BASE}/admin/experience/${scratchId}`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  for (let index = 0; index < AWKWARD.length; index++) {
    await page.locator('button[aria-label^="Remove responsibility"]').first().click();
  }
  await submit();

  const [emptied] = await db
    .select({ responsibilities: aboutExperience.responsibilities })
    .from(aboutExperience)
    .where(eq(aboutExperience.id, scratchId));
  check(
    "clearing the list stores an empty list, not the old one",
    Array.isArray(emptied.responsibilities) && emptied.responsibilities.length === 0,
    JSON.stringify(emptied.responsibilities),
  );

  // --- the key/value editor offers no reordering ----------------------------
  await page.goto(`${BASE}/admin/legal-section/17`, { waitUntil: "load" });
  await page.waitForTimeout(900);
  const pairs = await page.locator('textarea[aria-label^="Meaning"]').count();
  check("the key/value editor renders every stored pair", pairs === 11, `${pairs} pairs`);
  const reorderControls = await page.locator('button[aria-label*="Move"]').count();
  check(
    "the key/value editor offers no reordering, since jsonb normalises key order",
    reorderControls === 0,
  );
} finally {
  if (scratchId !== null) {
    await db.delete(aboutExperience).where(eq(aboutExperience.id, scratchId));
    console.log(`  ..    cleaned up experience #${scratchId}`);
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
