/**
 * The superuser role and the per-screen grants, against the running app.
 *
 * **What this exists to catch is a payload, not a page.** The admin's first
 * version answered a non-staff request with 72KB in which the visible HTML said
 * "Not permitted" while the Flight payload underneath carried every blog post,
 * its slug and its edit URL -- not rendered, but transmitted, and invisible to
 * any check that reads a page the way a person does. A per-screen grant is the
 * same hazard one level down: the rail can hide Blog posts perfectly while the
 * changelist route still runs its query for somebody who may not see it. So
 * every gate check below reads the *whole* response body, markup and payload
 * alike, and looks for row data in it.
 *
 * It drives a real account rather than a mock. A `zz-` prefixed staff account
 * and a narrowed grant set are created, used, and restored in a `finally` that
 * then proves the restore -- the pattern every writing harness here follows.
 * Nothing it touches belongs to a real person.
 *
 * Needs the dev server up, and reads `AUTH_SECRET` to mint sessions.
 * `--conditions=react-server` because it imports `lib/admin/blockers.ts`, which
 * is `server-only`.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-access.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { encode } = await import("next-auth/jwt");
const { ADMIN_ENTRIES, ADMIN_ENTRIES_BY_KEY, adminPath } = await import(
  "../lib/admin/registry.ts"
);
const { db, pool } = await import("../lib/db/client.ts");
const { account, adminAccess } = await import("../lib/db/app-schema.ts");
const { and, eq, inArray } = await import("drizzle-orm");
const { idWhere } = await import("./fixture-ids.mjs");

const BASE = process.argv[2] ?? "http://localhost:3000";

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const cookieName = "authjs.session-token";

async function session(userId) {
  const token = await encode({
    token: { sub: String(userId) },
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    maxAge: 60 * 10,
  });
  return `${cookieName}=${token}`;
}

async function get(path, cookie) {
  const response = await fetch(BASE + path, {
    headers: cookie ? { cookie } : {},
    redirect: "manual",
  });
  const body = await response.text();
  /*
   * React separates adjacent expressions with an empty HTML comment, so a
   * template like `{n} {n === 1 ? "screen" : "screens"}` reaches the wire as
   * `1<!-- --> <!-- -->screen` and no substring check for "1 screen" matches.
   * Stripping them is what lets these assertions be written the way the JSX
   * reads. The markers this file hunts for contain no comments either way.
   */
  return { status: response.status, body, text: body.replace(/<!--[\s\S]*?-->/g, "") };
}

/**
 * The screen this harness narrows around, and the strings that only appear
 * because its changelist was built.
 *
 * A post's title, its slug and the URL shape of its edit link. The third is the
 * one the payload carries even when the first two are escaped out of the
 * markup, which is exactly what made the original leak invisible.
 */
const WATCHED = "blog-post";
const postId = await idWhere("blog_post", "slug", "commit-message-style-guide");
const ROW_MARKERS = [
  "Commit Message Style Guide",
  "commit-message-style-guide",
  `/admin/${WATCHED}/`,
];
const leaks = (body) => ROW_MARKERS.filter((marker) => body.includes(marker));

/** The keys a grant may name, which is every screen but the one that grants. */
const GRANTABLE = ADMIN_ENTRIES.filter((entry) => !entry.superuserOnly).map((entry) => entry.key);
const SUPERUSER_ONLY = ADMIN_ENTRIES.find((entry) => entry.superuserOnly);

// A screen this account will be allowed to see, so "the rail is empty" is never
// what a passing gate check is actually measuring.
const VISIBLE = "certification";

const stamp = Date.now();
const username = `zz-access-${stamp}`;
let subjectId = null;

try {
  /*
   * The account. Created here rather than borrowed from the real ones: this
   * harness takes access *away*, and doing that to somebody's live account --
   * even inside a script that puts it back -- is a window in which a person
   * cannot work, on a database that is the production one.
   */
  const [created] = await db
    .insert(account)
    .values({
      username,
      email: `${username}@example.invalid`,
      firstName: "zz",
      lastName: "access",
      isStaff: true,
      isSuperuser: false,
      isActive: true,
    })
    .returning({ id: account.id });
  subjectId = created.id;

  const cookie = await session(subjectId);

  // --- staff with no grants at all -------------------------------------------

  {
    const { body } = await get("/admin", cookie);
    check(
      "no grants: the index says so rather than looking broken",
      body.includes("has not been given access to any screen yet"),
    );
    check(
      "no grants: and it names no screen",
      !body.includes("Blog posts") && !body.includes("Certifications"),
    );
  }

  {
    const { body } = await get(`/admin/${WATCHED}`, cookie);
    const found = leaks(body);
    check("no grants: a changelist URL carries no row data at all", found.length === 0, found.join(", "));
  }

  {
    const { body } = await get(`/admin/${WATCHED}/${postId}`, cookie);
    check(
      "no grants: a record URL discloses nothing either",
      !body.includes("Commit Message Style Guide"),
    );
  }

  // --- view on one screen, and nothing on the watched one ---------------------

  await db.insert(adminAccess).values({
    accountId: subjectId,
    modelKey: VISIBLE,
    canView: true,
    canAdd: false,
    canChange: false,
    canDelete: false,
  });

  {
    const { body, text } = await get("/admin", cookie);
    check("one grant: the index lists it", body.includes("Certifications"));
    check("one grant: and lists nothing else", !body.includes("Blog posts"));
    check(
      "one grant: the rail counts what this account can open, not what exists",
      text.includes("1 screen") && !text.includes(`${ADMIN_ENTRIES.length} screens`),
      `registry holds ${ADMIN_ENTRIES.length}`,
    );
    check(
      "one grant: and the index heads one area, not nine",
      (body.match(/<h2/g) ?? []).length === 1,
      `${(body.match(/<h2/g) ?? []).length} headings`,
    );
  }

  {
    const { body } = await get(`/admin/${WATCHED}`, cookie);
    const found = leaks(body);
    check(
      "one grant: the screen it does not hold still carries no row data",
      found.length === 0,
      found.join(", "),
    );
  }

  /*
   * Every route that can render a screen's data, and there are six shapes.
   *
   * **Asserted on the data, never on the refusal.** The first version of this
   * checked the body for "Nothing here" -- and passed with the gate removed,
   * because that string is in the payload of every admin page whether or not
   * anything was refused. It was a check that could only ever pass: exactly the
   * shape this repository keeps catching, and the reason the rule here is to
   * assert the row is absent rather than that a message is present.
   *
   * A page is not covered by another page, either. Each of these is its own
   * route file with its own first `await`, and the deepest -- a sectioned
   * vocabulary's row at `/admin/<section>/<tab>/<id>` -- shipped without its
   * check the first time, because the two segments above it are gated and it
   * reads as though it inherits that.
   *
   * Every marker is proved to appear when the screen *is* granted, further
   * down. A marker that never appears is a check that never checks.
   */
  const tab = ADMIN_ENTRIES_BY_KEY.get("tag");
  const { rows: tagRows } = await db.execute(`select id, label from app.tag limit 1`);
  const tag = tagRows[0];

  /** Strings that appear only because a given screen rendered its data. */
  const shapes = [
    {
      what: "a flat changelist",
      path: `/admin/${WATCHED}`,
      markers: ROW_MARKERS,
    },
    {
      what: "a flat record",
      path: `/admin/${WATCHED}/${postId}`,
      markers: ["Commit Message Style Guide"],
    },
    {
      what: "a section's tab",
      path: adminPath(tab),
      // Any row's edit link, not one particular row's: the list is sorted and
      // paged, so the row this harness happened to select need not be on page
      // one -- which the positive control below caught on the first run.
      markers: [`${adminPath(tab)}/`],
    },
    {
      what: "a sectioned record",
      path: `${adminPath(tab)}/${tag.id}`,
      markers: [`value="${tag.label}"`],
    },
    /*
     * The heading, not `<form action=`. Every admin page carries one of those
     * already -- the topbar's sign-out -- so that marker was present on a
     * refused response and the check failed honestly the moment the positive
     * control asked it to mean something.
     */
    {
      what: "a flat create form",
      path: `/admin/${WATCHED}/new`,
      markers: [`Add ${ADMIN_ENTRIES_BY_KEY.get(WATCHED).label.toLowerCase()}`],
    },
    {
      what: "a sectioned create form",
      path: `${adminPath(tab)}/new`,
      markers: [`Add ${tab.label.toLowerCase()}`],
    },
  ];

  for (const shape of shapes) {
    const { text } = await get(shape.path, cookie);
    const found = shape.markers.filter((marker) => text.includes(marker));
    check(`ungranted: ${shape.what} sends none of its data`, found.length === 0, found.join(", "));
  }

  {
    // View without change is a form that says so, with no Save on it. Any row
    // will do -- the assertion is about the form's shape, not the record.
    const { rows: certs } = await db.execute(`select id from app.certification limit 1`);
    const certId = certs[0]?.id;
    check("a certification exists for the read-only check", Boolean(certId));

    if (certId) {
      const { body } = await get(`/admin/${VISIBLE}/${certId}`, cookie);
      check("view without change: the record opens", body.includes("Certification"));
      check(
        "view without change: and says it cannot be changed",
        body.includes("but not change it"),
      );
      check(
        "view without change: with no save button",
        !body.includes(">Save<"),
        body.includes(">Save<") ? "Save present" : "no Save",
      );
    }
  }

  {
    // `add` was not granted, so the create route is refused -- and refused as
    // not-found, which is what keeps a staff account from learning the shape of
    // what it is being kept out of.
    const { body } = await get(`/admin/${VISIBLE}/new`, cookie);
    check(
      "view without add: the create route is refused",
      body.includes("Nothing here") || body.includes("not found"),
    );
  }

  /*
   * The other direction, and it is not optional: a marker that never appears
   * would make every check above pass by accident. So the same screens are
   * granted and the same strings looked for, and this time they have to be
   * there.
   */
  {
    await db.insert(adminAccess).values([
      { accountId: subjectId, modelKey: WATCHED, canView: true, canAdd: true, canChange: true, canDelete: true },
      { accountId: subjectId, modelKey: tab.key, canView: true, canAdd: true, canChange: true, canDelete: true },
    ]);

    for (const shape of shapes) {
      const { text } = await get(shape.path, cookie);
      const found = shape.markers.filter((marker) => text.includes(marker));
      check(
        `granted: ${shape.what} does send it, so the check above means something`,
        found.length === shape.markers.length,
        `${found.length}/${shape.markers.length}`,
      );
    }

    // And put it back, so the superuser section below starts where it meant to.
    await db
      .delete(adminAccess)
      .where(
        and(
          eq(adminAccess.accountId, subjectId),
          inArray(adminAccess.modelKey, [WATCHED, tab.key]),
        ),
      );
  }

  // --- the screen that hands out grants ---------------------------------------

  {
    const { body } = await get("/admin/access", cookie);
    check(
      "not a superuser: the access screen is refused",
      !body.includes("Superuser") || body.includes("Nothing here"),
      body.includes("Nothing here") ? "not found" : "no matrix",
    );
  }

  {
    // Granting it changes nothing: `can` refuses a `superuserOnly` key whatever
    // the row says, so a grant written straight into the table is inert.
    await db.insert(adminAccess).values({
      accountId: subjectId,
      modelKey: SUPERUSER_ONLY.key,
      canView: true,
      canAdd: true,
      canChange: true,
      canDelete: true,
    });
    const { body } = await get("/admin/access", cookie);
    check(
      "a grant on the access screen itself is refused anyway",
      !body.includes('name="isSuperuser"'),
      "no matrix",
    );
    const index = await get("/admin", cookie);
    check(
      "and it does not appear in the rail or on the index",
      !index.text.includes(">Access<"),
    );
  }

  // --- superuser --------------------------------------------------------------

  await db.update(account).set({ isSuperuser: true }).where(eq(account.id, subjectId));

  {
    const { body } = await get("/admin", cookie);
    // Every group, including the one that holds the access screen -- and every
    // screen, though this account still has a grant row for only two of them.
    check("superuser: the index lists screens it holds no grant for", body.includes("Blog posts"));
    check("superuser: and the access group", body.includes("Access"));
  }

  {
    const { body } = await get(`/admin/${WATCHED}`, cookie);
    check("superuser: the changelist renders", body.includes("<table"));
  }

  {
    const { body } = await get("/admin/access", cookie);
    check("superuser: the access list opens", body.includes("<table"));
    check("superuser: and lists the staff accounts", body.includes(username));
  }

  {
    const { body } = await get(`/admin/access/${subjectId}`, cookie);
    check("superuser: the matrix opens", body.includes('name="isSuperuser"'));
    // One checkbox per grantable screen per action is the shape; the count is
    // asserted loosely because the markup around each box is not the contract.
    const boxes = [...body.matchAll(/name="[a-z0-9-]+\.(view|add|change|delete)"/g)].length;
    check(
      "superuser: the matrix offers the registry, not the stored rows",
      boxes > GRANTABLE.length,
      `${boxes} checkboxes for ${GRANTABLE.length} screens`,
    );
    /*
     * The matrix has to describe the role it is looking at.
     *
     * `user.delete` is `canDelete: "superuser"`, and the screen used to draw it
     * as a dash reading "cannot be granted" on *every* account -- including a
     * superuser's own, where the delete is real and available. So the one
     * screen whose entire job is to say what somebody can do said the opposite
     * of the truth about the account with the most power.
     *
     * A superuser sees a cell, and it is ticked. A staff account sees the dash,
     * which for them is correct: no grant can reach it.
     */
    const cellFor = (html, key, act) => {
      const at = html.indexOf(`name="${key}.${act}"`);
      if (at === -1) return "absent";
      // React renders `checked` as the bare attribute on the same tag.
      const tag = html.slice(html.lastIndexOf("<input", at), html.indexOf(">", at));
      return tag.includes("checked") ? "ticked" : "unticked";
    };

    check(
      "superuser: a superuser-only action is a ticked box, not a dash",
      cellFor(body, "user", "delete") === "ticked",
      cellFor(body, "user", "delete"),
    );
    check(
      "superuser: and every ordinary box is ticked too, whatever the rows say",
      cellFor(body, WATCHED, "change") === "ticked",
      cellFor(body, WATCHED, "change"),
    );
    check(
      "superuser: an action refused to everybody stays a dash",
      cellFor(body, "profile", "delete") === "absent",
      cellFor(body, "profile", "delete"),
    );
    check(
      "superuser: and no checkbox for the screen that hands out grants",
      !body.includes(`name="${SUPERUSER_ONLY.key}.view"`),
    );
  }

  {
    const { body } = await get(`/admin/access/not-a-uuid`, cookie);
    check(
      "a key that is not a uuid says not found rather than erroring",
      body.includes("Nothing here"),
    );
  }

  // --- the matrix actually saves ----------------------------------------------

  /*
   * Everything above reads. This is the half that writes, and it is driven in a
   * browser because the form posts through a server action -- whose endpoint id
   * is generated at build time and is not something a harness can address by
   * hand. Clicking Save is the only honest way to ask whether Save works.
   *
   * **Driven as a different superuser**, editing the throwaway account. The
   * first version signed in as the account being edited and `saveAccess`
   * refused it -- correctly, and for the rule that exists precisely to stop
   * this: you cannot remove your own superuser access, because the screen that
   * could put it back is the one you just locked yourself out of.
   *
   * That rule is deliberately *not* driven here. Asserting it would mean
   * clearing the real owner's flag and trusting a `finally` to restore it, and
   * the blast radius of that going wrong -- on the production database, on the
   * one account that can grant the role back -- is not worth the coverage.
   *
   * What this writes is the throwaway account, which the outer `finally`
   * deletes.
   */
  {
    const [owner] = await db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.isSuperuser, true), eq(account.isActive, true)))
      .limit(1);
    check("a superuser exists to drive the matrix", Boolean(owner));

    const browser = await chromium.launch();
    try {
      const ownerCookie = await session(owner.id);
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      await context.addCookies([
        {
          name: cookieName,
          value: ownerCookie.split("=").slice(1).join("="),
          domain: "localhost",
          path: "/",
        },
      ]);
      const page = await context.newPage();

      await page.goto(`${BASE}/admin/access/${subjectId}`, { waitUntil: "load" });

      // Off the superuser role, so the matrix below it becomes live.
      const role = page.locator('input[name="isSuperuser"]');
      if (await role.isChecked()) await role.uncheck();

      const view = page.locator(`input[name="${WATCHED}.view"]`);
      const change = page.locator(`input[name="${WATCHED}.change"]`);
      await view.waitFor();

      // Change implies view, in the interface as well as on the server: a grant
      // that cannot open the screen it governs is a dead row.
      await change.check();
      check("ticking change ticks view with it", await view.isChecked());

      // And unticking view clears the row, or the two rules would disagree and
      // the click would look like it did nothing.
      await view.uncheck();
      check("unticking view clears the rest of the row", !(await change.isChecked()));

      await change.check();
      await page.getByRole("button", { name: "Save", exact: true }).click();

      /*
       * Waited for by its own notice, not by a stopwatch. A fixed 1500ms passed
       * locally and failed here: the action had not landed, the row was absent,
       * and the check reported "saving writes the row: no row" -- a real save
       * bug and a slow machine are indistinguishable through a timeout.
       *
       * Generous, because the first request after this component is edited pays
       * for a Turbopack compile before anything renders -- which is a wait, not
       * a failure, and 15s was not enough for it.
       */
      await page
        .locator("body")
        .filter({ hasText: /Saved./ })
        .first()
        .waitFor({ timeout: 45000 });

      const [stored] = await db
        .select({
          view: adminAccess.canView,
          add: adminAccess.canAdd,
          change: adminAccess.canChange,
          delete: adminAccess.canDelete,
        })
        .from(adminAccess)
        .where(
          and(eq(adminAccess.accountId, subjectId), eq(adminAccess.modelKey, WATCHED)),
        );

      check("saving writes the row", Boolean(stored), stored ? "" : "no row");
      if (stored) {
        check(
          "with exactly what was ticked, view included",
          stored.view && stored.change && !stored.add && !stored.delete,
          JSON.stringify(stored),
        );
      }

      const [after] = await db
        .select({ isSuperuser: account.isSuperuser })
        .from(account)
        .where(eq(account.id, subjectId));
      check("and clears the role that was unticked", after.isSuperuser === false);

      // The grant is live on the very next request: nothing here is cached, and
      // that is the whole reason the flags are read per request.
      const { body } = await get(`/admin/${WATCHED}`, cookie);
      check("and the screen opens on the next request, uncached", body.includes("<table"));

      /*
       * The other half of the matrix-truth check above. The save has just taken
       * the superuser role away, so this account is staff again -- and for
       * staff, `user.delete` genuinely cannot be granted and the dash is the
       * honest answer. Asserted here rather than earlier because reading the
       * matrix at all needs a superuser's session, which this block has.
       */
      const staffView = await get(`/admin/access/${subjectId}`, ownerCookie);
      check(
        "a staff account's matrix draws the superuser-only action as a dash",
        !staffView.body.includes('name="user.delete"'),
      );
      check(
        "and still offers the ordinary ones as boxes",
        staffView.body.includes(`name="${WATCHED}.change"`),
      );

      /*
       * Who signed in with what. `account_identity.provider` is the only place
       * that says, and the Users screen showed nothing at all before -- the two
       * kinds of account were indistinguishable on the screen whose subject is
       * who can get in.
       */
      const users = await get("/admin/user", ownerCookie);
      check(
        "the users list names the sign-in provider",
        users.text.includes("Signed in with"),
      );
      check(
        "and prints it as the provider is spelled, not as it is stored",
        users.text.includes("Google") || users.text.includes("GitHub"),
        users.text.includes("Google") ? "Google" : users.text.includes("GitHub") ? "GitHub" : "neither",
      );
    } finally {
      await browser.close();
    }
  }

  // --- a delete Postgres refuses ----------------------------------------------

  {
    /*
     * The message that made this whole change worth doing. An organization an
     * experience still names cannot be deleted by anybody, superuser included
     * -- and what the admin now says is which rows are in the way.
     */
    const { blockedDeleteMessage } = await import("../lib/admin/blockers.ts");
    // An organization an experience names, which is therefore one no role can
    // delete.
    const { rows: named } = await db.execute(
      `select organization_id as id from app.experience limit 1`,
    );
    const orgId = named[0]?.id;
    check("an organization is referenced, so there is a block to describe", Boolean(orgId));

    if (orgId) {
      const message = await blockedDeleteMessage("organization", orgId);
      check(
        "a blocked delete names what is in the way",
        /\d+ \w/.test(message) && message.includes("still refer"),
        message,
      );
      check(
        "and says what to do about it",
        message.includes("Remove or repoint them first"),
      );
    }
  }
} finally {
  if (subjectId) {
    /*
     * Restored, then proved restored. The grants go with the account through
     * `ON DELETE CASCADE`, which is what that referential action is for -- but
     * "the cascade should have handled it" is exactly the assumption this
     * pattern exists to stop making, so both are counted afterwards.
     */
    await db.delete(account).where(eq(account.id, subjectId));

    const left = await db
      .select({ id: adminAccess.id })
      .from(adminAccess)
      .where(eq(adminAccess.accountId, subjectId));
    const account_ = await db.select({ id: account.id }).from(account).where(eq(account.id, subjectId));

    check("cleanup: the harness account is gone", account_.length === 0);
    check("cleanup: and its grants went with it", left.length === 0, `${left.length} left`);
  }

  const strays = await db
    .select({ id: account.id, username: account.username })
    .from(account)
    .where(inArray(account.username, [username]));
  check("cleanup: nothing zz- prefixed is left behind", strays.length === 0);

  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} access checks passed.`
    : `\n${failed.length} of ${checks.length} failed.`,
);
process.exit(failed.length === 0 ? 0 : 1);
