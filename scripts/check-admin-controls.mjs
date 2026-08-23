/**
 * The admin's form controls are the ones this site draws.
 *
 * Every control on an admin form is progressively enhanced: the server renders
 * a real `<select>` or `<input type="date">`, and once the page hydrates a
 * drawn listbox or calendar takes over and the native element is hidden behind
 * it. Almost nothing about that is visible to `tsc`, to `eslint` or to a build:
 *
 *   - **The native element still has to be there.** It is what posts, it is
 *     what works without JavaScript, and `check-admin.mjs` greps the server
 *     body for one. A refactor that replaced it outright would pass every other
 *     check in this directory.
 *   - **The stylesheet has to stay class-scoped.** `styles/admin-controls.css`
 *     is imported globally, so a rule written as `input[type="checkbox"] { … }`
 *     silently restyles the contact form, the comment box and the guestbook
 *     composer. Nothing else in the tree would notice.
 *   - **The drawn surfaces have to follow the theme.** They are new colours in
 *     a codebase where light mode is a palette remap, and a value outside the
 *     ramps simply stays dark on a white page.
 *   - **Two of them must deliberately NOT follow it**: a checkbox's tick and a
 *     calendar's chosen day are white on indigo, and their contrast target is
 *     that fill rather than the page behind it.
 *
 * Almost read-only: the last section creates one marked skill through an
 * unhydrated form and removes it again, because "it still saves without the
 * bundle" is not a claim any amount of reading can settle.
 *
 * Needs `--conditions=react-server` for the fixture ids, and `npm run dev`.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-controls.mjs [base]
 */
import { readFileSync } from "node:fs";

import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const { applicationStep, category, skill } = await import("../lib/db/app-schema.ts");
const { eq, sql } = await import("drizzle-orm");

/** Distinctive enough that a leftover row is obviously this script's. */
const MARK = `zz-admin-controls-${Date.now()}`;

const BASE = process.argv[2] ?? "http://localhost:3000";
const COOKIE = "authjs.session-token";
/** Longer than the 200ms colour transition on `body`. */
const SETTLE = 500;

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/* -------------------------------------------------------------------------
   1. The stylesheet cannot reach the public site
   ------------------------------------------------------------------------- */
{
  const css = readFileSync("styles/admin-controls.css", "utf8");
  /*
   * Strip comments first. The header explains the rule by quoting the kind of
   * selector it forbids, and a scan that read the prose would fail on the
   * sentence describing what must not happen -- which is the same trap
   * `check-css-sources.mjs` records about naming a utility in order to assert
   * its absence.
   */
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  /*
   * The *selectors*, which is everything before each `{` -- not the lines, and
   * that distinction matters: a declaration like `appearance: none;` looks
   * exactly like an element selector followed by a pseudo-class to a
   * line-by-line scan, and the first version of this check reported all 68 of
   * them as violations.
   */
  const selectors = [...code.matchAll(/([^{}]+)\{/g)]
    .flatMap((match) => match[1].split(","))
    .map((selector) => selector.trim())
    .filter(Boolean)
    // `@media` and `@keyframes` are not element selectors, and a keyframe's own
    // `from` / `to` / `50%` steps never leave the animation they belong to.
    .filter((selector) => !selector.startsWith("@"))
    .filter((selector) => !/^(from|to|[\d.]+%)$/.test(selector));

  /*
   * A selector is safe when it is anchored to a class somewhere. `:root` is
   * allowed on its own because the only thing it declares here is two prefixed
   * custom properties, and a custom property nothing reads paints nothing.
   */
  const bare = selectors.filter(
    (selector) => selector !== ":root" && !/(^|[\s>+~])\.[a-z]/i.test(selector),
  );

  check(
    "every rule is class-scoped, so the public site cannot be reached",
    bare.length === 0,
    bare.length ? bare.join(" | ") : `${selectors.length} selectors, all anchored to a class`,
  );

  check(
    "colours come from the ramps, not from literals",
    // Two pinned whites are deliberate and are commented as such; anything
    // else hex-coded would not follow the theme.
    (code.match(/#[0-9a-f]{3,8}/gi) ?? []).every((hex) => hex.toLowerCase() === "#fff"),
    (code.match(/#[0-9a-f]{3,8}/gi) ?? []).join(" ") || "none",
  );
}

const token = await encode({
  token: { sub: await staffAccountId() },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 15,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 950 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

try {
  /* -----------------------------------------------------------------------
     2. The native controls survive in the server's HTML
     ----------------------------------------------------------------------- */
  {
    const response = await fetch(`${BASE}/admin/experience`, {
      headers: { cookie: `${COOKIE}=${token}` },
    });
    const body = await response.text();
    check(
      "the changelist's filters are real selects in the server's HTML",
      /<select[^>]*name="[^"]+"/.test(body),
      "progressive enhancement holds",
    );
  }

  await page.goto(`${BASE}/admin/experience`, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await page.locator("tbody a").first().click();
  await page.waitForTimeout(1800);

  {
    const shape = await page.evaluate(() => {
      const select = document.querySelector('select[name="organizationId"]');
      const trigger = select?.nextElementSibling;
      return {
        selectPresent: Boolean(select),
        selectHidden: select?.hasAttribute("hidden") ?? false,
        selectNamed: select?.getAttribute("name") ?? null,
        optionCount: select?.options.length ?? 0,
        triggerRole: trigger?.getAttribute("role") ?? null,
      };
    });
    check("the native select is still in the form", shape.selectPresent && shape.selectNamed === "organizationId");
    check("and hidden once the drawn one has taken over", shape.selectHidden);
    check("and still carries every option", shape.optionCount > 15, `${shape.optionCount} options`);
    check("the drawn control is a combobox", shape.triggerRole === "combobox");
  }

  /* -----------------------------------------------------------------------
     3. The listbox
     ----------------------------------------------------------------------- */
  const trigger = page.locator('select[name="organizationId"] + [role="combobox"]');

  await trigger.click();
  await page.waitForTimeout(400);
  check("it opens on a click", (await page.locator('[role="listbox"]').count()) === 1);
  check(
    "a long list grows a filter box",
    (await page.locator('input[aria-label="Filter the options"]').count()) === 1,
  );

  {
    const before = await page.locator('[role="option"]').count();
    await page.locator('input[aria-label="Filter the options"]').fill("zzzz-no-such-thing");
    await page.waitForTimeout(300);
    const after = await page.locator('[role="option"]').count();
    check("typing filters it", before > 0 && after === 0, `${before} -> ${after}`);
    check(
      "and says so rather than showing an empty box",
      (await page.locator('[role="listbox"]').innerText()).includes("Nothing matches"),
    );
    await page.locator('input[aria-label="Filter the options"]').fill("");
    await page.waitForTimeout(300);
  }

  {
    const first = await page.locator('[role="option"][data-highlighted="true"]').first().innerText();
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(200);
    const second = await page.locator('[role="option"][data-highlighted="true"]').first().innerText();
    check("the arrows move the highlight", first !== second, `${first.trim()} -> ${second.trim()}`);
  }

  {
    const chosen = await trigger.innerText();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("Escape closes it", (await page.locator('[role="listbox"]').count()) === 0);
    check("and leaves the value alone", (await trigger.innerText()) === chosen, chosen.trim());
  }

  {
    // A short list has nothing to filter, and a box over seven options is noise.
    const shortTrigger = page.locator('select[name="employmentType"] + [role="combobox"]');
    if (await shortTrigger.count()) {
      await shortTrigger.click();
      await page.waitForTimeout(400);
      check(
        "a short list does not",
        (await page.locator('input[aria-label="Filter the options"]').count()) === 0,
        `${await page.locator('[role="option"]').count()} options`,
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  }

  /* -----------------------------------------------------------------------
     4. The calendar
     ----------------------------------------------------------------------- */
  {
    const dateTrigger = page.locator('button[aria-haspopup="dialog"]').first();
    const stored = await page
      .locator('input[type="date"], input[type="datetime-local"]')
      .first()
      .inputValue();

    await dateTrigger.click();
    await page.waitForTimeout(500);
    check("the calendar opens", (await page.locator('[role="dialog"]').count()) === 1);

    const heading = await page.locator('[role="dialog"] span').first().innerText();
    const month = Number(stored.slice(5, 7));
    const year = stored.slice(0, 4);
    const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    check(
      "on the month the record stores, not on today",
      heading.includes(MONTHS[month - 1]) && heading.includes(year),
      `${stored} -> ${heading}`,
    );

    check(
      "with the stored day marked",
      (await page.locator('[role="dialog"] button[aria-pressed="true"]').count()) === 1,
    );

    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    check("and Escape closes it", (await page.locator('[role="dialog"]').count()) === 0);
  }

  /* -----------------------------------------------------------------------
     5. The drawn checkbox is still its label's control
     ----------------------------------------------------------------------- */
  {
    const box = page.locator("input.admin-check").first();
    const before = await box.isChecked();
    // Clicking the wording, not the box: a drawn checkbox that stopped being
    // inside its label would still toggle from itself and fail only here.
    await box.locator("xpath=..").click();
    await page.waitForTimeout(250);
    check("a drawn checkbox toggles from its label's text", (await box.isChecked()) !== before);
    await box.locator("xpath=..").click();
    await page.waitForTimeout(250);
    check("and back", (await box.isChecked()) === before);
  }

  /* -----------------------------------------------------------------------
     6. The drawn surfaces follow the theme -- except the two that must not
     ----------------------------------------------------------------------- */
  {
    const read = async (theme) => {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(SETTLE);
      await trigger.click();
      await page.waitForTimeout(400);
      const out = await page.evaluate(() => {
        const panel = document.querySelector("[role='listbox']")?.closest(".admin-popover");
        const option = document.querySelector("[role='option']");
        const box = document.querySelector("input.admin-check:checked") ?? document.querySelector("input.admin-check");
        const styles = (el, prop) => (el ? getComputedStyle(el)[prop] : null);
        return {
          "popover fill": styles(panel, "backgroundColor"),
          "popover border": styles(panel, "borderTopColor"),
          "option text": styles(option, "color"),
          "checkbox border": styles(box, "borderTopColor"),
        };
      });
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
      return out;
    };

    const dark = await read("dark");
    const light = await read("light");
    for (const key of Object.keys(dark)) {
      check(
        `${key} follows the theme`,
        dark[key] !== null && dark[key] !== light[key],
        `${dark[key]}  ->  ${light[key]}`,
      );
    }
  }

  {
    // The two pinned ones. A tick or a chosen day sits on indigo in both
    // themes, so a value that moved with the theme would be the bug.
    const pinned = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.className = "admin-option";
      probe.setAttribute("aria-pressed", "true");
      document.body.appendChild(probe);
      const read = () => getComputedStyle(probe).color;
      document.documentElement.setAttribute("data-theme", "dark");
      const dark = read();
      document.documentElement.setAttribute("data-theme", "light");
      const light = read();
      probe.remove();
      return { dark, light };
    });
    check(
      "a chosen day's label stays white in both themes",
      pinned.dark === pinned.light,
      `${pinned.dark} / ${pinned.light}`,
    );
  }
  /* -----------------------------------------------------------------------
     7. A timestamp survives the trip through the picker
     -----------------------------------------------------------------------
     `datetime` is the one kind whose value is *converted* on the way to the
     control and back, and getting it wrong is silent: the column is
     `timestamptz`, it arrives as UTC, and a `datetime-local` input speaks local
     time. `toISOString().slice(0, 16)` looks like the obvious way to fill one
     in and is the bug -- it is the right shape in the wrong zone, so every
     timestamp shifts by the reader's offset on the first save that touches the
     record, and nothing anywhere reports it.

     Driven in Asia/Jakarta rather than the machine's own zone, because a CI box
     on UTC cannot tell a correct conversion from a missing one.
  */
  {
    const [step] = await db
      .select({ app: applicationStep.applicationId, at: applicationStep.occurredAt })
      .from(applicationStep)
      // Not midnight: an offset error is invisible on a round hour of zero.
      .where(
        sql`${applicationStep.occurredAt} is not null and extract(hour from ${applicationStep.occurredAt}) <> 0`,
      )
      .limit(1);

    if (step) {
      const zoned = await browser.newContext({ timezoneId: "Asia/Jakarta" });
      await zoned.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
      const zonedPage = await zoned.newPage();
      try {
        await zonedPage.goto(`${BASE}/admin/application/${step.app}`, { waitUntil: "load" });
        await zonedPage.waitForTimeout(2500);

        const shown = await zonedPage.locator('input[type="datetime-local"]').first().inputValue();
        const stored = new Date(step.at).toISOString();
        check(
          "a timestamp reads back as the same instant in a non-UTC zone",
          new Date(shown).toISOString() === stored,
          `${stored} shows as ${shown}`,
        );
      } finally {
        await zoned.close();
      }
    }
  }

  /* -----------------------------------------------------------------------
     8. And all of it still works with nothing hydrated
     -----------------------------------------------------------------------
     The whole design rests on this. Every drawn control is an enhancement over
     a real one, so a page whose bundle never arrives must still be a working
     form -- and if that stopped being true, nothing else in this file would
     notice, because everything above it runs on a fully hydrated page.

     JavaScript stays ON and the chunks are blocked. `javaScriptEnabled: false`
     tests something else entirely: React streams its Suspense content into a
     `display: none` container and reveals it with a small inline script, so
     with scripting off the admin's forms are not merely unhydrated, they are
     invisible, and nothing can be driven at all.
  */
  const bare = await browser.newContext();
  await bare.route("**/_next/static/chunks/**", (route) => route.abort());
  await bare.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
  const barePage = await bare.newPage();

  try {
    const [firstCategory] = await db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.kind, "skill"))
      .limit(1);

    await barePage.goto(`${BASE}/admin/skill/new`, { waitUntil: "domcontentloaded" });
    await barePage.waitForTimeout(2500);

    check(
      "unhydrated, the native select is the visible control",
      (await barePage.locator("select:visible").count()) > 0 &&
        (await barePage.locator('[role="combobox"]').count()) === 0,
    );

    await barePage.fill('[name="name"]', `${MARK} Skill`);
    await barePage.selectOption('[name="categoryId"]', firstCategory.id);
    await barePage.fill('[name="description"]', "Written by scripts/check-admin-controls.mjs.");
    await barePage.locator('button[type="submit"]:text-matches("Create")').click();
    await barePage.waitForTimeout(3000);

    const [row] = await db
      .select({ id: skill.id, categoryId: skill.categoryId })
      .from(skill)
      .where(eq(skill.name, `${MARK} Skill`));

    check("and the form still posts and saves", Boolean(row), row ? `#${row.id}` : "no row");
    check(
      "with the value the select was set to",
      row?.categoryId === firstCategory.id,
      row ? String(row.categoryId) : "",
    );

    if (row) {
      await db.delete(skill).where(eq(skill.id, row.id));
      console.log(`  ..    cleaned up skill #${row.id}`);
    }
  } finally {
    await bare.close();
  }
} finally {
  await browser.close();
  // Whatever failed above, nothing this script made is left behind.
  const leftover = await db.select({ id: skill.id }).from(skill).where(eq(skill.name, `${MARK} Skill`));
  for (const row of leftover) {
    await db.delete(skill).where(eq(skill.id, row.id));
    console.log(`  ..    cleaned up skill #${row.id}`);
  }
  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass).length;
console.log(
  failed === 0
    ? `\nAll ${checks.length} control checks passed.`
    : `\n${failed} of ${checks.length} control checks FAILED.`,
);
process.exit(failed === 0 ? 0 : 1);
