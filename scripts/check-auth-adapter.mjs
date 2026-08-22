/**
 * Exercise the Auth.js adapter against the real database, then roll it back.
 *
 * Every operation the adapter performs writes to the *live* Supabase database
 * — the same `auth_user` rows the running site authenticates against — so this
 * runs the whole sequence inside one transaction and throws at the end to undo
 * it. Nothing is left behind; the final check re-counts the three tables to
 * prove it.
 *
 * Running it for real is the point. The things worth checking are Django's own
 * constraints, and only Postgres enforces them:
 *
 *   - `auth_user.username` is UNIQUE, and `password`, `first_name`, `last_name`,
 *     `email`, `date_joined` are all NOT NULL with no defaults
 *   - `socialaccount_socialaccount` is UNIQUE on `(provider, uid)`
 *   - `guestbook_userprofile.user_id` is UNIQUE and a FK to `auth_user`
 *
 * A stubbed database would only prove the stub agrees with itself.
 *
 *   node --env-file=.env.local scripts/check-auth-adapter.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { DjangoAdapter, touchLogin } = await import("../lib/auth/adapter.ts");
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
      (select count(*) from auth_user)::int as users,
      (select count(*) from socialaccount_socialaccount)::int as socials,
      (select count(*) from guestbook_userprofile)::int as profiles
  `).then((r) => r.rows ?? r);
  return row;
};

const before = await counts(db);
console.log(`live rows before: ${JSON.stringify(before)}\n`);

const ROLLBACK = Symbol("rollback");

try {
  await db.transaction(async (tx) => {
    const adapter = DjangoAdapter(tx);

    // --- an existing account is found, not duplicated ----------------------
    const [existing] = await tx
      .execute(sql`select provider, uid, user_id from socialaccount_socialaccount order by id limit 1`)
      .then((r) => r.rows ?? r);

    const found = await adapter.getUserByAccount({
      provider: existing.provider,
      providerAccountId: existing.uid,
    });
    check(
      "getUserByAccount matches a live socialaccount",
      found !== null && Number(found.id) === existing.user_id,
      `${existing.provider}/${existing.uid} -> user ${found?.id}`,
    );

    check(
      "getUser round-trips that id",
      (await adapter.getUser(String(existing.user_id)))?.id === String(existing.user_id),
    );
    check("getUser rejects a non-numeric id", (await adapter.getUser("not-a-number")) === null);
    check("getUserByAccount misses on an unknown uid",
      (await adapter.getUserByAccount({ provider: "google", providerAccountId: STAMP })) === null);

    // --- creating a user writes what Django expects -------------------------
    const created = await adapter.createUser({
      id: "ignored",
      name: "Ada Lovelace",
      email: `${STAMP}@example.invalid`,
      emailVerified: null,
      handle: "AdaLovelace",
    });

    const [row] = await tx
      .execute(sql`select * from auth_user where id = ${Number(created.id)}`)
      .then((r) => r.rows ?? r);

    check("createUser used the provider handle verbatim", row.username === "AdaLovelace", row.username);
    check("createUser split the name", row.first_name === "Ada" && row.last_name === "Lovelace");
    check(
      "createUser wrote an unusable password",
      row.password.startsWith("!") && row.password.length === 41,
      `${row.password.length} chars`,
    );
    check(
      "createUser left the account non-staff and active",
      row.is_staff === false && row.is_superuser === false && row.is_active === true,
    );
    check("createUser set date_joined and left last_login null",
      row.date_joined !== null && row.last_login === null);

    const [profileRow] = await tx
      .execute(sql`select * from guestbook_userprofile where user_id = ${Number(created.id)}`)
      .then((r) => r.rows ?? r);
    check(
      "createUser created the guestbook profile row",
      !!profileRow && profileRow.is_author === false && profileRow.is_co_author === false,
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
      .execute(sql`select username from auth_user where id = ${Number(taken.id)}`)
      .then((r) => r.rows ?? r);
    check("a taken handle gets a numeric suffix", second.username === "AdaLovelace2", second.username);

    const collide = await adapter.createUser({
      id: "ignored",
      name: "Ridwan Halim",
      email: `${STAMP}-3@example.invalid`,
      emailVerified: null,
    });
    const [third] = await tx
      .execute(sql`select username from auth_user where id = ${Number(collide.id)}`)
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
    await touchLogin(Number(created.id), "google", googleProfile.sub, googleProfile, tx);

    const [social] = await tx
      .execute(sql`select * from socialaccount_socialaccount where provider = 'google' and uid = ${googleProfile.sub}`)
      .then((r) => r.rows ?? r);
    check("linkAccount wrote the socialaccount row", !!social && social.user_id === Number(created.id));
    check(
      "signIn refreshed extra_data with the raw provider profile",
      social.extra_data?.picture === googleProfile.picture && social.extra_data?.name === googleProfile.name,
    );
    check("last_login was set on both rows", social.last_login !== null);

    const [afterLogin] = await tx
      .execute(sql`select last_login from auth_user where id = ${Number(created.id)}`)
      .then((r) => r.rows ?? r);
    check("auth_user.last_login was set", afterLogin.last_login !== null);

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
      .execute(sql`select count(*)::int as n from socialaccount_socialaccount where provider='google' and uid = ${googleProfile.sub}`)
      .then((r) => r.rows ?? r);
    check("re-linking the same account does not duplicate it", n === 1, `${n} row(s)`);

    // --- updateUser ---------------------------------------------------------
    const updated = await adapter.updateUser({ id: created.id, name: "Ada King Lovelace" });
    check("updateUser rewrote the name", updated.name === "Ada King Lovelace", updated.name);

    // --- profile derivation reads Google first ------------------------------
    // getUserProfile queries the pooled connection, not `tx`, so it cannot see
    // uncommitted rows -- assert against a live user instead.
    const liveProfile = await getUserProfile(existing.user_id);
    check(
      "getUserProfile resolves a live user",
      liveProfile !== null && liveProfile.id === existing.user_id,
      liveProfile ? `${liveProfile.fullName} · author=${liveProfile.isAuthor} coAuthor=${liveProfile.isCoAuthor}` : "",
    );
    check(
      "canPin is is_author || is_co_author",
      liveProfile !== null && liveProfile.canPin === (liveProfile.isAuthor || liveProfile.isCoAuthor),
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
  .execute(sql`select count(*)::int as leaked from auth_user where username like 'zz-adapter-check-%' or email like 'zz-adapter-check-%'`)
  .then((r) => r.rows ?? r);
check("no marker rows survive", leaked === 0, `${leaked} found`);

await pool.end();

const failed = checks.filter((c) => !c.pass);
console.log(failed.length === 0
  ? `\nAll ${checks.length} adapter checks passed against the live schema.`
  : `\n${failed.length} of ${checks.length} checks FAILED.`);
process.exit(failed.length === 0 ? 0 : 1);
