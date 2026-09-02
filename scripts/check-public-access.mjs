/**
 * What an account may do on the public site, against the live schema.
 *
 * `lib/auth/public.ts` is pure and its matrix is asserted offline. What cannot
 * be asserted offline is the wiring: that `getUserProfiles` reads the real
 * `account` flags and the real `public_access` row, and that the capabilities a
 * page or an action then asks about are the ones those rows describe. Between
 * the rule and the row there is a query, and a query is the thing that goes
 * quietly wrong -- the Screens column on the access list read 0 for every staff
 * account for exactly that reason.
 *
 * Everything here happens inside one transaction that ends by throwing, so the
 * accounts it creates never exist. `getUserProfiles` takes its connection as an
 * argument for this: the pool cannot see uncommitted rows, so the check hands
 * it the transaction.
 *
 * Rows carry a `zz-` prefix so a leftover from a crashed run is obviously a
 * harness's and not somebody's account.
 *
 *   npx tsx scripts/check-public-access.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { account, publicAccess } = await import("../lib/db/app-schema.ts");
const { getUserProfiles } = await import("../lib/auth/profile.ts");
const { publicCapabilities } = await import("../lib/auth/public.ts");
const { like, sql } = await import("drizzle-orm");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const ROLLBACK = Symbol("rollback");
const stamp = Date.now();
let n = 0;

try {
  await db.transaction(async (tx) => {
    /**
     * One account and its public-access row, with the flags asked for.
     *
     * `access` passed as null means no row at all, which is a state the read
     * path has to survive: a row is written at sign-up, and nothing downstream
     * is allowed to depend on that having happened.
     */
    async function make({ isStaff = false, isSuperuser = false, isActive = true }, access) {
      const username = `zz-pub-${stamp}-${n++}`;
      const [row] = await tx
        .insert(account)
        .values({
          username,
          email: `${username}@example.invalid`,
          firstName: "zz",
          lastName: "public",
          isStaff,
          isSuperuser,
          isActive,
        })
        .returning({ id: account.id });

      if (access) await tx.insert(publicAccess).values({ accountId: row.id, ...access });
      return { id: row.id, username };
    }

    // --- the roles -----------------------------------------------------------

    const reader = await make({}, { canComment: true, canGuestbook: true });
    const staff = await make({ isStaff: true }, { canComment: true, canGuestbook: true });
    const superuser = await make(
      { isStaff: true, isSuperuser: true },
      { canComment: true, canGuestbook: true },
    );

    const ids = [reader.id, staff.id, superuser.id];
    const profiles = await getUserProfiles(ids, tx);
    const of = (who) => profiles.get(who.id);

    check("every account resolves", ids.every((id) => profiles.has(id)), `${profiles.size} of 3`);

    check("a reader is public", of(reader)?.role === "public", of(reader)?.role);
    check("a staff account is staff", of(staff)?.role === "staff", of(staff)?.role);
    check("a superuser is superuser", of(superuser)?.role === "superuser", of(superuser)?.role);

    check(
      "a reader may post and moderate nothing",
      of(reader)?.can.comment === true &&
        of(reader)?.can.guestbook === true &&
        of(reader)?.can.moderateComments === false &&
        of(reader)?.can.pin === false &&
        of(reader)?.can.deleteMessages === false,
      JSON.stringify(of(reader)?.can),
    );

    check(
      "staff moderates comments and pins",
      of(staff)?.can.moderateComments === true && of(staff)?.can.pin === true,
    );

    /*
     * The asymmetry worth keeping: a guestbook delete is a recursive hard
     * delete with no tombstone, so it stays superuser-only while pinning and
     * comment moderation are staff. It was author-only against
     * author-or-co-author before the fold; the split survived it.
     */
    check(
      "and only a superuser deletes a guestbook message",
      of(staff)?.can.deleteMessages === false && of(superuser)?.can.deleteMessages === true,
    );

    check(
      "staff and a superuser still post like anybody else",
      of(staff)?.can.comment === true && of(superuser)?.can.guestbook === true,
    );

    // --- the two switches ----------------------------------------------------

    const muted = await make({}, { canComment: false, canGuestbook: true });
    const quiet = await make({}, { canComment: true, canGuestbook: false });
    const bothOff = await make({ isStaff: true }, { canComment: false, canGuestbook: false });

    const switched = await getUserProfiles([muted.id, quiet.id, bothOff.id], tx);

    check(
      "switching comments off refuses comments and nothing else",
      switched.get(muted.id)?.can.comment === false &&
        switched.get(muted.id)?.can.guestbook === true,
      JSON.stringify(switched.get(muted.id)?.can),
    );
    check(
      "switching the guestbook off refuses the guestbook and nothing else",
      switched.get(quiet.id)?.can.guestbook === false &&
        switched.get(quiet.id)?.can.comment === true,
    );
    /*
     * A switch is about posting, not about moderating. Taking commenting away
     * from a staff account must not quietly cost them the moderation the role
     * carries, or two settings interfere in a way nobody would predict.
     */
    check(
      "and neither costs a staff account its moderation",
      switched.get(bothOff.id)?.can.moderateComments === true &&
        switched.get(bothOff.id)?.can.pin === true,
    );

    // --- is_active -----------------------------------------------------------

    /*
     * `is_active` was documented in three places as "may sign in at all" and
     * read in exactly one -- the admin gate -- so it meant "may reach the
     * admin", and a deactivated account could still comment, post and pin
     * indefinitely.
     */
    const banned = await make({ isActive: false }, { canComment: true, canGuestbook: true });
    const bannedBoss = await make(
      { isStaff: true, isSuperuser: true, isActive: false },
      { canComment: true, canGuestbook: true },
    );
    const inactive = await getUserProfiles([banned.id, bannedBoss.id], tx);

    for (const [label, who] of [
      ["a deactivated reader", banned],
      ["a deactivated superuser", bannedBoss],
    ]) {
      const can = inactive.get(who.id)?.can;
      check(
        `${label} may do nothing at all`,
        can !== undefined && Object.values(can).every((value) => value === false),
        JSON.stringify(can),
      );
    }

    // --- the missing row -----------------------------------------------------

    const rowless = await make({}, null);
    const withoutRow = await getUserProfiles([rowless.id], tx);
    check(
      "an account with no public-access row reads as a default one",
      withoutRow.get(rowless.id)?.can.comment === true &&
        withoutRow.get(rowless.id)?.can.guestbook === true,
      JSON.stringify(withoutRow.get(rowless.id)?.can),
    );

    // --- the derivation is not asserted against itself -----------------------

    /*
     * Read the flags back out of the database and put them through the pure
     * rule, rather than trusting the profile to agree with itself. If the query
     * correlated wrongly this is where it shows: the row says one thing and the
     * profile says another.
     */
    const stored = await tx
      .select({
        id: account.id,
        isActive: account.isActive,
        isStaff: account.isStaff,
        isSuperuser: account.isSuperuser,
      })
      .from(account)
      .where(like(account.username, `zz-pub-${stamp}-%`));

    const rows = await tx
      .select({
        accountId: publicAccess.accountId,
        canComment: publicAccess.canComment,
        canGuestbook: publicAccess.canGuestbook,
      })
      .from(publicAccess);
    const byAccount = new Map(rows.map((row) => [row.accountId, row]));

    const all = await getUserProfiles(
      stored.map((row) => row.id),
      tx,
    );
    const disagreed = stored.filter((row) => {
      const switches = byAccount.get(row.id);
      const expected = publicCapabilities({
        isActive: row.isActive,
        isStaff: row.isStaff,
        isSuperuser: row.isSuperuser,
        canComment: switches ? switches.canComment : true,
        canGuestbook: switches ? switches.canGuestbook : true,
      });
      return JSON.stringify(all.get(row.id)?.can) !== JSON.stringify(expected);
    });

    check(
      "every profile agrees with the rows behind it",
      stored.length > 0 && disagreed.length === 0,
      disagreed.length === 0 ? `${stored.length} account(s)` : `${disagreed.length} disagree`,
    );

    throw ROLLBACK;
  });
} catch (error) {
  if (error !== ROLLBACK) throw error;
}

// --- and nothing survived ------------------------------------------------------

const [{ left }] = await db
  .select({ left: sql`count(*)::int` })
  .from(account)
  .where(like(account.username, "zz-pub-%"));

check("the transaction was rolled back, so no account was created", left === 0, `${left} left`);

const failed = checks.filter((entry) => !entry.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} public access checks passed.`
    : `\n${failed.length} of ${checks.length} failed.`,
);

await pool.end();
process.exit(failed.length === 0 ? 0 : 1);
