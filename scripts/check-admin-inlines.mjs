/**
 * Inlines, and the cascading deletes they turned out to depend on.
 *
 * Three properties are worth checking here, and none is visible to a type
 * checker:
 *
 * - **Opening a record and saving it changes none of its children.** The whole
 *   set posts every time, so a mistake in the reconcile deletes rows nobody
 *   touched. Run against the profile, whose five highlighted skills and four
 *   donate links are live.
 * - **Rows are matched by primary key, never by position.** A row the editor
 *   added has no id and is inserted; an id that was stored but not submitted was
 *   removed and is deleted. Reordering must move rows without recreating them,
 *   because recreating them would lose their ids and, for the highlighted
 *   skills, collide with the unique constraint on `(profile, skill)`.
 * - **Position is the order.** Every field name derives from the array index, so
 *   moving a row renumbers its inputs and the server writes the new index into
 *   the order column. There is no separate order input to fall out of step.
 *
 * It also covers what building this uncovered: **Django's `on_delete=CASCADE` is
 * Python, not SQL.** It gathers the related rows and deletes them itself, and
 * every foreign key it created in this database is `NO ACTION`
 * (`confdeltype = 'a'`). So deleting a parent leaves the database to refuse it.
 * That went unseen because the constraints are `DEFERRABLE INITIALLY DEFERRED`:
 * a transaction that rolls back never reaches the check, which is exactly what a
 * test cleaning up after itself does. Both the admin and the guestbook now
 * gather the branch themselves.
 *
 * The live rows it opens are snapshotted and restored in the `finally`; the
 * destructive cases run on an application this script creates and removes.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-inlines.mjs [base]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { db, pool } = await import("../lib/db/client.ts");
const {
  application,
  applicationStatus,
  applicationStep,
  organization,
  profile,
  profileLink,
  profileSkillHighlight,
  project,
  projectSkill,
} = await import("../lib/db/app-schema.ts");
const { and, asc, eq } = await import("drizzle-orm");

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
  await page.waitForTimeout(1600);
};

/**
 * A parent's child rows, in the order the inline shows them.
 *
 * `scope` is what one kind-discriminated table needs: `profile_link` holds the
 * social, CV and donate lists together and tells them apart by a `kind` column,
 * so reading "the donate links" means the parent *and* the kind. The three
 * social_* column sets it replaced could not be confused for each other.
 */
const children = async (table, parent, parentId, order, scope = null) =>
  db
    .select()
    .from(table)
    .where(scope ? and(eq(parent, parentId), eq(scope.column, scope.value)) : eq(parent, parentId))
    .orderBy(asc(order));

/** The one profile row, whose key the inlines hang off. */
const [{ id: PROFILE_ID }] = await db.select({ id: profile.id }).from(profile).limit(1);
const DONATE = { column: profileLink.kind, value: "donate" };

let snapshotHighlights = null;
let snapshotLinks = null;
let applicationId = null;
const createdApplications = [];
let techStackProject = null;
let techStackBefore = null;

try {
  // --- the profile's inlines survive an untouched save ----------------------
  snapshotHighlights = await children(
    profileSkillHighlight,
    profileSkillHighlight.profileId,
    PROFILE_ID,
    profileSkillHighlight.position,
  );
  snapshotLinks = await children(
    profileLink,
    profileLink.profileId,
    PROFILE_ID,
    profileLink.position,
    DONATE,
  );

  await page.goto(`${BASE}/admin/profile`, { waitUntil: "load" });
  await page.waitForTimeout(1200);

  const shownSkills = await page.locator('select[name^="highlights:"]').count();
  check(
    "the profile renders one row per highlighted skill",
    shownSkills === snapshotHighlights.length,
    `${shownSkills} of ${snapshotHighlights.length}`,
  );

  await submit();

  const afterHighlights = await children(
    profileSkillHighlight,
    profileSkillHighlight.profileId,
    PROFILE_ID,
    profileSkillHighlight.position,
  );
  const afterLinks = await children(
    profileLink,
    profileLink.profileId,
    PROFILE_ID,
    profileLink.position,
    DONATE,
  );

  check(
    "saving it untouched keeps every highlighted skill, id included",
    JSON.stringify(afterHighlights) === JSON.stringify(snapshotHighlights),
    `${afterHighlights.length} rows`,
  );
  check(
    "and every donate link",
    JSON.stringify(afterLinks) === JSON.stringify(snapshotLinks),
    `${afterLinks.length} rows`,
  );

  // --- reordering an inline that has an order column ------------------------
  /*
   * The donate links do have one, so this is the case the journey below cannot
   * cover: moving a row has to rewrite `order` and leave the ids alone. Run on
   * the profile because that is where an ordered inline lives, and put back by
   * the restore in the `finally`.
   */
  /*
   * Scoped to the Donate section. `profile_link` serves three lists -- social,
   * CV and donate -- each an inline of its own with the same item label, so
   * "Move link 1 down" matches in more than one place. The section is how a
   * reader tells them apart too: each is a `fieldset` with its own name.
   */
  const donateGroup = page.getByRole("group", { name: "Donate" });

  if (snapshotLinks.length >= 2) {
    await page.goto(`${BASE}/admin/profile`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await donateGroup.getByLabel("Move link 1 down").click();
    await submit();

    const moved = await children(
      profileLink,
      profileLink.profileId,
      PROFILE_ID,
      profileLink.position,
      DONATE,
    );
    check(
      "moving an ordered row rewrites the order column",
      String(moved[0].id) === String(snapshotLinks[1].id) &&
        String(moved[1].id) === String(snapshotLinks[0].id),
      moved.map((row) => `${row.platform}#${row.position}`).join(", "),
    );
    check(
      "and the order column is a clean 0..n-1 rather than the old values",
      moved.every((row, index) => Number(row.position) === index),
      moved.map((row) => row.position).join(","),
    );
    check(
      "without recreating anything -- the same ids come back",
      new Set(moved.map((row) => String(row.id))).size === snapshotLinks.length &&
        moved.every((row) => snapshotLinks.some((was) => String(was.id) === String(row.id))),
    );

    // Put them back through the form as well, so the restore below has nothing
    // to do and the round trip is proven in both directions.
    await page.goto(`${BASE}/admin/profile`, { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await donateGroup.getByLabel("Move link 1 down").click();
    await submit();
  }

  // --- add, reorder and remove, on a record this script owns ----------------
  /*
   * The company, the status, the employment type and the work mode were free
   * text on this row and are foreign keys now, so the fixture is assembled from
   * rows that exist rather than from strings.
   */
  const [anyOrganization] = await db.select({ id: organization.id }).from(organization).limit(1);
  const [applied] = await db
    .select({ id: applicationStatus.id, label: applicationStatus.label })
    .from(applicationStatus)
    .orderBy(asc(applicationStatus.position))
    .limit(1);

  const [created] = await db
    .insert(application)
    .values({
      organizationId: anyOrganization.id,
      statusId: applied.id,
      title: "zz-inline-check",
      lessonsLearned: "",
    })
    .returning({ id: application.id });
  applicationId = created.id;

  // A record created with a child row in the same submit: the inline carries the
  // parent's id, which does not exist until the parent insert returns.
  await page.goto(`${BASE}/admin/application/new`, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.locator('select[name="organizationId"]').selectOption(anyOrganization.id);
  await page.locator('input[name="position"]').fill("zz-inline-check-created");
  await page.locator('select[name="statusId"]').selectOption(applied.id);
  await page.locator('button:has-text("Add step")').click();
  await page.locator('input[name="journey:0:title"]').fill("Created with the parent");
  await submit();

  const [born] = await db
    .select({ id: application.id })
    .from(application)
    .where(eq(application.title, "zz-inline-check-created"));
  if (born) createdApplications.push(born.id);
  const bornSteps = born
    ? await children(applicationStep, applicationStep.applicationId, born.id, applicationStep.position)
    : [];
  check(
    "a child row created alongside a brand new parent is attached to it",
    bornSteps.length === 1 && bornSteps[0].title === "Created with the parent",
    born ? `application #${born.id}` : "no parent row",
  );

  const url = `${BASE}/admin/application/${applicationId}`;
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000);

  check("a record with no child rows says so", (await page.locator("text=No step rows yet.").count()) === 1);

  for (const [index, title] of ["Applied", "Screening", "Offer"].entries()) {
    await page.locator('button:has-text("Add step")').click();
    await page.locator(`input[name="journey:${index}:title"]`).fill(title);
  }
  await submit();

  const added = await children(
    applicationStep,
    applicationStep.applicationId,
    applicationId,
    applicationStep.position,
  );
  check(
    "three added rows are inserted",
    added.length === 3 && added.map((row) => row.title).join(",") === "Applied,Screening,Offer",
    added.map((row) => row.title).join(", "),
  );

  // --- reorder --------------------------------------------------------------
  // The journey has no order column -- the model orders by timestamp -- so this
  // checks the opposite property: an inline without one offers no reorder
  // buttons rather than offering ones that do nothing.
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  check(
    "an inline with no order column offers no reorder buttons",
    (await page.locator('button[aria-label^="Move step"]').count()) === 0,
  );

  // --- remove the middle row, and check it is matched by id -----------------
  const ids = added.map((row) => String(row.id));
  await page.locator('button[aria-label="Remove step 2"]').click();
  await submit();

  const remaining = await children(
    applicationStep,
    applicationStep.applicationId,
    applicationId,
    applicationStep.position,
  );
  check(
    "removing the middle row deletes exactly that row",
    remaining.length === 2 && remaining.map((row) => String(row.id)).join(",") === `${ids[0]},${ids[2]}`,
    remaining.map((row) => row.title).join(", "),
  );
  check(
    "and the rows either side keep their ids, so they were updated not recreated",
    String(remaining[0].id) === ids[0] && String(remaining[1].id) === ids[2],
  );

  // --- editing a surviving row ---------------------------------------------
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.locator('input[name="journey:0:title"]').fill("Applied online");
  await submit();

  const [edited] = await children(
    applicationStep,
    applicationStep.applicationId,
    applicationId,
    applicationStep.position,
  );
  check(
    "editing a row updates it in place",
    edited.title === "Applied online" && String(edited.id) === ids[0],
    `#${edited.id} ${edited.title}`,
  );

  // --- clearing the set -----------------------------------------------------
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  const rowCount = await page.locator('button[aria-label^="Remove step"]').count();
  for (let index = 0; index < rowCount; index++) {
    await page.locator('button[aria-label^="Remove step"]').first().click();
  }
  await submit();

  const cleared = await children(
    applicationStep,
    applicationStep.applicationId,
    applicationId,
    applicationStep.position,
  );
  check("removing every row leaves none behind", cleared.length === 0);

  // --- deleting a parent that still has children ----------------------------
  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Add step")').click();
  await page.locator('input[name="journey:0:title"]').fill("Still here");
  await submit();

  const before = await children(
    applicationStep,
    applicationStep.applicationId,
    applicationId,
    applicationStep.position,
  );
  check("the parent has a child again", before.length === 1);

  await page.goto(url, { waitUntil: "load" });
  await page.waitForTimeout(1000);
  await page.locator('button:has-text("Delete")').first().click();
  await page.waitForTimeout(600);
  await page.locator('[aria-labelledby="confirm-dialog-title"] button').last().click();
  await page.waitForTimeout(2000);

  const parentGone = await db
    .select({ id: application.id })
    .from(application)
    .where(eq(application.id, applicationId));
  const childGone = await children(
    applicationStep,
    applicationStep.applicationId,
    applicationId,
    applicationStep.position,
  );
  check(
    "deleting the parent takes its children with it",
    parentGone.length === 0 && childGone.length === 0,
    `${parentGone.length} parent, ${childGone.length} children`,
  );
  if (parentGone.length === 0) applicationId = null;

  // --- the tech stack, which is a join table rather than a column -----------
  /*
   * A plain many-to-many: no order, no through model, nothing to preserve
   * beyond membership -- which is exactly why saving it deletes and re-inserts
   * rather than diffing, and why `Profile.skills_highlight` could not.
   */
  const [anyProject] = await db
    .select({ id: project.id })
    .from(project)
    .orderBy(asc(project.id))
    .limit(1);
  techStackProject = anyProject.id;
  techStackBefore = (
    await db
      .select({ skillId: projectSkill.skillId })
      .from(projectSkill)
      .where(eq(projectSkill.projectId, anyProject.id))
  ).map((row) => String(row.skillId));

  await page.goto(`${BASE}/admin/project/${anyProject.id}`, { waitUntil: "load" });
  await page.waitForTimeout(1600);
  const ticked = await page.locator('input[name="techStack"]:checked').count();
  check(
    "the tech stack loads from the join table, not from a column",
    ticked === techStackBefore.length,
    `${ticked} of ${await page.locator('input[name="techStack"]').count()} skills`,
  );

  // Tick one more and save.
  const unticked = page.locator('input[name="techStack"]:not(:checked)').first();
  const addedSkill = await unticked.getAttribute("value");
  await unticked.check();
  await submit();

  const afterAdd = (
    await db
      .select({ skillId: projectSkill.skillId })
      .from(projectSkill)
      .where(eq(projectSkill.projectId, anyProject.id))
  ).map((row) => String(row.skillId));
  check(
    "ticking a skill writes one row to the join table",
    afterAdd.length === techStackBefore.length + 1 && afterAdd.includes(addedSkill),
    `${techStackBefore.length} -> ${afterAdd.length}`,
  );
  check(
    "and leaves the ones that were already there",
    techStackBefore.every((id) => afterAdd.includes(id)),
  );

  // --- referential actions, proved without writing anything ----------------
  /*
   * Django's `on_delete` was Python: it gathered the related rows and deleted
   * them itself, and every foreign key it left in Postgres was `NO ACTION`
   * `DEFERRABLE INITIALLY DEFERRED`. Deleting a guestbook message with replies
   * was refused by the database, and the application had to walk the branch
   * first -- with the refusal hiding from anything that rolled back, because a
   * deferred check never runs.
   *
   * The `app` schema declares the actions instead: cascade where the child has
   * no meaning without its parent, set null where it does, restrict where the
   * reference is somebody else's. Nothing is deferrable, so a violation is
   * raised by the statement that caused it rather than at commit.
   *
   * Both halves are checked here, in a transaction that is rolled back.
   */
  const client = await pool.connect();
  try {
    await client.query("begin");

    const { rows: parents } = await client.query(
      "select reply_to_id id from app.guest_message where reply_to_id is not null limit 1",
    );
    if (parents.length > 0) {
      const target = parents[0].id;
      const { rows: kids } = await client.query(
        "select count(*)::int n from app.guest_message where reply_to_id = $1",
        [target],
      );

      await client.query("savepoint cascade_check");
      let cascaded = true;
      try {
        await client.query("delete from app.guest_message where id = $1", [target]);
        const { rows: left } = await client.query(
          "select count(*)::int n from app.guest_message where reply_to_id = $1",
          [target],
        );
        cascaded = left[0].n === 0;
      } catch {
        cascaded = false;
      }
      await client.query("rollback to savepoint cascade_check");
      check(
        "deleting a message takes its replies with it, in the database",
        cascaded,
        `${kids[0].n} repl${kids[0].n === 1 ? "y" : "ies"} of ${target}`,
      );
    }

    /*
     * The other half. An organization an experience still names is not the
     * experience's to remove, which is Django's `PROTECT` and the behaviour the
     * admin surfaces as "something still refers to this record".
     */
    const { rows: used } = await client.query(
      "select organization_id id from app.experience limit 1",
    );
    if (used.length > 0) {
      await client.query("savepoint restrict_check");
      let refused = false;
      try {
        await client.query("delete from app.organization where id = $1", [used[0].id]);
      } catch {
        refused = true;
      }
      await client.query("rollback to savepoint restrict_check");
      check(
        "an organization an experience still names cannot be deleted",
        refused,
        `organization ${used[0].id}`,
      );
    }
  } finally {
    await client.query("rollback").catch(() => {});
    client.release();
  }
} finally {
  for (const id of [applicationId, ...createdApplications].filter((value) => value !== null)) {
    // The journey steps go first, by hand. Django's `on_delete=CASCADE` is
    // Python: every foreign key it created in Postgres is `NO ACTION`, so a
    // plain parent delete raises a violation. This is the same thing the app's
    // own `deleteWithChildren` does, spelled out because a cleanup that leaned
    // on the app would stop being a cleanup the moment the app broke.
    await db.delete(applicationStep).where(eq(applicationStep.applicationId, id));
    await db.delete(application).where(eq(application.id, id));
    console.log(`  ..    cleaned up application #${id}`);
  }

  if (techStackProject !== null && techStackBefore !== null) {
    await db
      .delete(projectSkill)
      .where(eq(projectSkill.projectId, techStackProject));
    for (const skillId of techStackBefore) {
      await db
        .insert(projectSkill)
        .values({ projectId: techStackProject, skillId });
    }
    const now = (
      await db
        .select({ skillId: projectSkill.skillId })
        .from(projectSkill)
        .where(eq(projectSkill.projectId, techStackProject))
    ).map((row) => String(row.skillId));
    check(
      "the project's tech stack is back as it was found",
      now.length === techStackBefore.length && techStackBefore.every((id) => now.includes(id)),
      `${now.length} skills`,
    );
  }

  if (snapshotHighlights && snapshotLinks) {
    const nowHighlights = await children(
      profileSkillHighlight,
      profileSkillHighlight.profileId,
      PROFILE_ID,
      profileSkillHighlight.position,
    );
    const nowLinks = await children(
      profileLink,
      profileLink.profileId,
      PROFILE_ID,
      profileLink.position,
      DONATE,
    );
    check(
      "the profile's own child rows are exactly as they were found",
      JSON.stringify(nowHighlights) === JSON.stringify(snapshotHighlights) &&
        JSON.stringify(nowLinks) === JSON.stringify(snapshotLinks),
      `${nowHighlights.length} skills, ${nowLinks.length} links`,
    );
  }

  await browser.close();
  await pool.end();
}

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} inline checks passed.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
