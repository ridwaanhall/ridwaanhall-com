/**
 * Exercise the Auth.js adapter against the real database, then roll it back.
 *
 * Every operation the adapter performs writes to the *live* Supabase database
 * — the same `app.account` rows the running site authenticates against — so
 * this runs the whole sequence inside one transaction and throws at the end to
 * undo it. Nothing is left behind; the final check re-counts the three tables
 * to prove it.
 *
 * Running it for real is the point. The things worth checking are constraints,
 * and only Postgres enforces them:
 *
 *   - `account.username` is UNIQUE, and `username`, `email`, `first_name`,
 *     `last_name`, `joined_at` are all NOT NULL
 *   - `account_identity` is UNIQUE on `(provider, provider_uid)`
 *   - `public_access.account_id` is UNIQUE and a FK to `account`
 *
 * A stubbed database would only prove the stub agrees with itself.
 *
 *   node --env-file=.env.local scripts/check-auth-adapter.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { accountAdapter, touchLogin } = await import("../lib/auth/adapter.ts");
const { getUserProfile } = await import("../lib/auth/profile.ts");
const { sql } = await import("drizzle-orm");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass, detail });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

/** A marker no live row could carry, so a leak would be obvious. */
const STAMP = `zz-adapter-check-${Date.now()}`;

const counts = async (database) => {
  const [row] = await database.execute(sql`
    select
      (select count(*) from app.account)::int as users,
      (select count(*) from app.account_identity)::int as socials,
      (select count(*) from app.public_access)::int as profiles
  `).then((r) => r.rows ?? r);
  return row;
};

const before = await counts(db);
console.log(`live rows before: ${JSON.stringify(before)}\n`);

const ROLLBACK = Symbol("rollback");

try {
  await db.transaction(async (tx) => {
    const adapter = accountAdapter(tx);

    // --- an existing account is found, not duplicated ----------------------
    const [existing] = await tx
      .execute(sql`select provider, provider_uid, account_id from app.account_identity order by connected_at limit 1`)
      .then((r) => r.rows ?? r);

    const found = await adapter.getUserByAccount({
      provider: existing.provider,
      providerAccountId: existing.provider_uid,
    });
    check(
      "getUserByAccount matches a live identity",
      found !== null && found.id === existing.account_id,
      `${existing.provider}/${existing.provider_uid} -> account ${found?.id}`,
    );

    check(
      "getUser round-trips that id",
      (await adapter.getUser(existing.account_id))?.id === existing.account_id,
    );
    // Not merely "no such row": a uuid column compared against this raises
    // `22P02`, so the adapter has to answer before the query runs.
    check("getUser rejects an id that is not a uuid", (await adapter.getUser("not-a-uuid")) === null);
    check("getUserByAccount misses on an unknown uid",
      (await adapter.getUserByAccount({ provider: "google", providerAccountId: STAMP })) === null);

    // --- creating a user writes what the schema demands ----------------------
    const created = await adapter.createUser({
      id: "ignored",
      name: "Ada Lovelace",
      email: `${STAMP}@example.invalid`,
      emailVerified: null,
      handle: "AdaLovelace",
    });

    const [row] = await tx
      .execute(sql`select * from app.account where id = ${created.id}`)
      .then((r) => r.rows ?? r);

    check("createUser used the provider handle verbatim", row.username === "AdaLovelace", row.username);
    check("createUser split the name", row.first_name === "Ada" && row.last_name === "Lovelace");
    /*
     * There is no password to check, and no column to check one against. Every
     * account here signs in through Google or GitHub, so a password column
     * could only ever hold a value meaning "not applicable" -- which is a
     * column that has to be filled, migrated and reasoned about forever in
     * exchange for nothing.
     */
    check(
      "createUser left the account non-staff and active",
      row.is_staff === false && row.is_active === true,
    );
    check("createUser set joined_at and left last_seen_at null",
      row.joined_at !== null && row.last_seen_at === null);

    const [profileRow] = await tx
      .execute(sql`select * from app.public_access where account_id = ${created.id}`)
      .then((r) => r.rows ?? r);
    check(
      "createUser created the public-access row, open by default",
      !!profileRow && profileRow.can_comment === true && profileRow.can_guestbook === true,
    );

    // --- the username rule dedupes against live rows ------------------------
    const taken = await adapter.createUser({
      id: "ignored",
      name: "Ada Second",
      email: `${STAMP}-2@example.invalid`,
      emailVerified: null,
      handle: "AdaLovelace",
    });
    const [second] = await tx
      .execute(sql`select username from app.account where id = ${taken.id}`)
      .then((r) => r.rows ?? r);
    check("a taken handle gets a numeric suffix", second.username === "AdaLovelace2", second.username);

    const collide = await adapter.createUser({
      id: "ignored",
      name: "Ridwan Halim",
      email: `${STAMP}-3@example.invalid`,
      emailVerified: null,
    });
    const [third] = await tx
      .execute(sql`select username from app.account where id = ${collide.id}`)
      .then((r) => r.rows ?? r);
    check(
      "a name colliding with a live username is suffixed",
      third.username !== "ridwan" && third.username.startsWith("ridwan"),
      third.username,
    );

    // --- linking an account, and the profile read-back ----------------------
    const googleProfile = {
      sub: `${STAMP}-sub`,
      name: "Ada from Google",
      picture: "https://example.invalid/ada.png",
      email: `${STAMP}@example.invalid`,
      email_verified: true,
    };
    await adapter.linkAccount({
      userId: created.id,
      provider: "google",
      providerAccountId: googleProfile.sub,
      type: "oidc",
    });
    await touchLogin(created.id, "google", googleProfile.sub, googleProfile, tx);

    const [social] = await tx
      .execute(sql`select * from app.account_identity where provider = 'google' and provider_uid = ${googleProfile.sub}`)
      .then((r) => r.rows ?? r);
    check("linkAccount wrote the identity row", !!social && social.account_id === created.id);
    check(
      "signIn refreshed extra with the raw provider profile",
      social.extra?.picture === googleProfile.picture && social.extra?.name === googleProfile.name,
    );

    const [afterLogin] = await tx
      .execute(sql`select last_seen_at from app.account where id = ${created.id}`)
      .then((r) => r.rows ?? r);
    check("account.last_seen_at was set", afterLogin.last_seen_at !== null);

    // getUserByAccount now finds the account it just linked.
    const relinked = await adapter.getUserByAccount({
      provider: "google",
      providerAccountId: googleProfile.sub,
    });
    check("the newly linked account resolves to its user", relinked?.id === created.id);

    // Linking the same (provider, uid) again must refresh, not violate the
    // unique pair -- this is what a returning reader does on every sign-in.
    await adapter.linkAccount({
      userId: created.id,
      provider: "google",
      providerAccountId: googleProfile.sub,
      type: "oidc",
    });
    const [{ n }] = await tx
      .execute(sql`select count(*)::int as n from app.account_identity where provider='google' and provider_uid = ${googleProfile.sub}`)
      .then((r) => r.rows ?? r);
    check("re-linking the same account does not duplicate it", n === 1, `${n} row(s)`);

    // --- updateUser ---------------------------------------------------------
    const updated = await adapter.updateUser({ id: created.id, name: "Ada King Lovelace" });
    check("updateUser rewrote the name", updated.name === "Ada King Lovelace", updated.name);

    // --- profile derivation reads Google first ------------------------------
    // getUserProfile queries the pooled connection, not `tx`, so it cannot see
    // uncommitted rows -- assert against a live user instead.
    const liveProfile = await getUserProfile(existing.account_id);
    check(
      "getUserProfile resolves a live user",
      liveProfile !== null && liveProfile.id === existing.account_id,
      liveProfile ? `${liveProfile.fullName} · role=${liveProfile.role}` : "",
    );
    /*
     * The capabilities are derived, not stored, so this asserts the derivation
     * against the flags the row actually carries rather than against itself.
     */
    const [flags] = await tx
      .execute(
        sql`select is_active, is_staff, is_superuser from app.account
             where id = ${existing.account_id}`,
      )
      .then((r) => r.rows ?? r);
    check(
      "the role comes from the account's own flags",
      liveProfile !== null &&
        liveProfile.role === (flags.is_superuser ? "superuser" : flags.is_staff ? "staff" : "public"),
      liveProfile ? `${liveProfile.role} for staff=${flags.is_staff} su=${flags.is_superuser}` : "",
    );
    check(
      "pinning is staff-or-better and deleting a message is superuser-only",
      liveProfile !== null &&
        liveProfile.can.pin === (flags.is_active && flags.is_staff) &&
        liveProfile.can.deleteMessages === (flags.is_active && flags.is_superuser),
    );

    throw ROLLBACK;
  });
} catch (error) {
  if (error !== ROLLBACK) {
    console.error("\nUnexpected error — the transaction was rolled back anyway:\n", error);
    await pool.end();
    process.exit(1);
  }
}

const after = await counts(db);
const clean =
  after.users === before.users &&
  after.socials === before.socials &&
  after.profiles === before.profiles;
console.log("");
check("the transaction was rolled back — no rows left behind", clean, JSON.stringify(after));

const [{ leaked }] = await db
  .execute(sql`select count(*)::int as leaked from app.account where username like 'zz-adapter-check-%' or email like 'zz-adapter-check-%'`)
  .then((r) => r.rows ?? r);
check("no marker rows survive", leaked === 0, `${leaked} found`);

await pool.end();

const failed = checks.filter((c) => !c.pass);
console.log(failed.length === 0
  ? `\nAll ${checks.length} adapter checks passed against the live schema.`
  : `\n${failed.length} of ${checks.length} checks FAILED.`);
process.exit(failed.length === 0 ? 0 : 1);
