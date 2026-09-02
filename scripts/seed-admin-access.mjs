/**
 * Seed the first superuser, and give every existing staff account full grants.
 *
 * The migration that added `account.is_superuser` and `app.admin_access` made
 * them; this fills them. A separate step, and not part of that SQL, because the
 * grants are one row per **registry key** and the registry lives in TypeScript
 * -- seeding from SQL would mean transcribing every key into a migration, which
 * is exactly the copy that goes quietly out of date. It is also why this script
 * outlives the delta, which is deleted once applied: the *schema* change happens
 * once, but a screen added later needs its grant rows too.
 *
 * **Running it is not optional after the migration.** Before this, `is_staff`
 * was the whole of the permission and everyone holding it reached every screen.
 * After it, a staff account's screens come from `admin_access` rows, and an
 * account with no rows has an admin with nothing in it. Seeding full grants is
 * what makes the change invisible to the people already using it: the superuser
 * then takes away what should not have been there, rather than everybody
 * waiting to be given back what they had.
 *
 * **Safe to re-run.** The superuser update is idempotent, and the grants are
 * inserted with `on conflict do nothing` on `(account_id, model_key)` -- so a
 * second run adds rows for screens that have been added since and leaves every
 * existing row exactly as the superuser last set it. It will not undo a
 * narrowing.
 *
 * A dry run unless `--apply` is passed, and the dry run is the review: it
 * prints every account it would touch and every count it would write.
 *
 * Run under `tsx`, not bare `node`: it imports `lib/auth/permissions.ts` so the
 * set of grantable screens is the same one the matrix and the gates use, and
 * that module resolves the `@/` alias that only the TypeScript config knows.
 * The check harnesses are run the same way for the same reason.
 *
 *   npx tsx scripts/seed-admin-access.mjs            # dry run
 *   npx tsx scripts/seed-admin-access.mjs --apply
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const APPLY = process.argv.includes("--apply");

const { db, pool } = await import("../lib/db/client.ts");
const { account, adminAccess } = await import("../lib/db/app-schema.ts");
const { ADMIN_ENTRIES } = await import("../lib/admin/registry.ts");
const { grantableEntries } = await import("../lib/auth/permissions.ts");
const { eq, or, sql } = await import("drizzle-orm");

/**
 * The first superuser.
 *
 * Written here rather than taken from an environment variable: this runs once,
 * against one database, and the account it names is the one that owns the site.
 * A variable would be a way for the same script to promote a different account
 * on a different day, which is not a flexibility this wants.
 */
const FIRST_SUPERUSER = "ridwaanhall.dev@gmail.com";

/**
 * The screens a grant may name.
 *
 * `access` is excluded, and by the same function the matrix screen uses:
 * granting the ability to grant is granting everything, so it is a role and not
 * a row. Seeding it would write a permission nothing ever reads.
 */
const KEYS = grantableEntries(ADMIN_ENTRIES).map((entry) => entry.key);

console.log(`${KEYS.length} grantable screens.\n`);

const accounts = await db
  .select({
    id: account.id,
    username: account.username,
    email: account.email,
    isStaff: account.isStaff,
    isSuperuser: account.isSuperuser,
    isActive: account.isActive,
  })
  .from(account)
  .where(or(eq(account.isStaff, true), eq(account.isSuperuser, true)));

if (accounts.length === 0) {
  console.error(
    "No staff account exists yet, so there is nobody to seed.\n" +
      "Sign in once so the row is created, then:\n" +
      "  update app.account set is_staff = true where email = '<you>';",
  );
  await pool.end();
  process.exit(1);
}

const first = accounts.find((row) => row.email === FIRST_SUPERUSER);

if (!first) {
  console.error(
    `No staff account has the email ${FIRST_SUPERUSER}.\n` +
      "That account must exist and be staff before it can be made superuser --\n" +
      "an account is created by a sign-in and by nothing else.\n\n" +
      `Accounts found: ${accounts.map((row) => row.email || row.username).join(", ")}`,
  );
  await pool.end();
  process.exit(1);
}

if (!first.isActive) {
  console.error(`${FIRST_SUPERUSER} is not active, so it could not sign in to use the role.`);
  await pool.end();
  process.exit(1);
}

console.log(
  first.isSuperuser
    ? `${first.username} <${first.email}> is already superuser.`
    : `${first.username} <${first.email}> -> superuser.`,
);

/*
 * What each account is missing, counted before anything is written so the dry
 * run can report the same numbers the apply would produce.
 */
const existing = await db
  .select({ accountId: adminAccess.accountId, key: adminAccess.modelKey })
  .from(adminAccess);

const held = new Map();
for (const row of existing) {
  const set = held.get(row.accountId) ?? new Set();
  set.add(row.key);
  held.set(row.accountId, set);
}

console.log("");
const work = [];
for (const row of accounts) {
  const already = held.get(row.id) ?? new Set();
  const missing = KEYS.filter((key) => !already.has(key));
  work.push({ row, missing });
  console.log(
    `  ${row.username.padEnd(20)} ${String(already.size).padStart(3)} stored` +
      `, ${String(missing.length).padStart(3)} to add` +
      (row.email === FIRST_SUPERUSER ? "  (superuser -- grants kept, not consulted)" : ""),
  );
}

const total = work.reduce((sum, item) => sum + item.missing.length, 0);
console.log(`\n${total} grant row(s) to insert.`);

if (!APPLY) {
  console.log("\ndry run -- nothing written. Pass --apply to keep it.");
  await pool.end();
  process.exit(0);
}

await db.transaction(async (tx) => {
  // Both flags: `account_superuser_is_staff` refuses one without the other, and
  // the account this promotes is selected on either.
  await tx
    .update(account)
    .set({ isSuperuser: true, isStaff: true })
    .where(eq(account.id, first.id));

  for (const { row, missing } of work) {
    if (missing.length === 0) continue;
    /*
     * `on conflict do nothing`, so a row the superuser has already narrowed is
     * left exactly as they set it. That is the difference between a seed that
     * can be re-run after a screen is added and one that quietly restores
     * everything somebody took away.
     */
    await tx
      .insert(adminAccess)
      .values(
        missing.map((key) => ({
          accountId: row.id,
          modelKey: key,
          canView: true,
          canAdd: true,
          canChange: true,
          canDelete: true,
        })),
      )
      .onConflictDoNothing({ target: [adminAccess.accountId, adminAccess.modelKey] });
  }
});

const [{ count }] = await db
  .select({ count: sql`count(*)::int` })
  .from(adminAccess);

console.log(`\ncommitted. ${count} grant row(s) in app.admin_access.`);
await pool.end();
