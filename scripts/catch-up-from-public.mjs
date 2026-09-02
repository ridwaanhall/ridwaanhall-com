/**
 * Copy into `app` whatever the previous build wrote to `public` afterwards.
 *
 * The data was copied across once, in bulk. The previous build kept serving the
 * domain afterwards, so `public` has gone on collecting sign-ups, guestbook
 * messages and page views that `app` never saw. This closes that gap, and is
 * the last thing that has to happen before `public` can be dropped.
 *
 *   npx tsx scripts/catch-up-from-public.mjs           # dry run + report
 *   npx tsx scripts/catch-up-from-public.mjs --apply
 *
 * `public` is never written to. Everything runs in ONE transaction that rolls
 * back unless `--apply` is passed, so a half-finished catch-up is not a state
 * this can leave the database in.
 *
 * **This must never become "copy everything again".** A bulk re-copy clears the
 * `app` tables first, which would delete the accounts and content created
 * through this admin since the cutover began, and re-randomise every uuid in
 * all 45 tables. Sessions are thirty-day
 * JWTs whose `token.sub` *is* the account uuid, so every signed-in reader would
 * be logged out; `lib/storage/cleanup.ts` counts references by `media_asset`
 * id. This one only ever inserts what is missing.
 *
 * **The copy is done in SQL, not through JavaScript.** Both schemas live in the
 * same database, so an `insert ... select` moves a row without it ever becoming
 * a JS value. That matters for timestamps: `pg` hands back a `Date`, which is
 * millisecond-resolution, and the original migration lost the microseconds off
 * every row whose clock had them. Rows copied here keep theirs.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const APPLY = process.argv.includes("--apply");
const raw = process.env.STORAGE_POSTGRES_URL_NON_POOLING ?? process.env.STORAGE_POSTGRES_URL;
if (!raw) throw new Error("STORAGE_POSTGRES_URL_NON_POOLING is not set (see .env.example)");
const url = new URL(raw);
url.searchParams.delete("sslmode");

const client = new pg.Client({ connectionString: url.toString(), ssl: { rejectUnauthorized: false } });
await client.connect();

const done = [];
const step = async (label, sql) => {
  const { rowCount } = await client.query(sql);
  done.push([label, rowCount]);
  console.log(`  ${String(rowCount).padStart(4)}  ${label}`);
  return rowCount;
};

console.log(APPLY ? "Applying.\n" : "Dry run — nothing will be kept. Pass --apply to commit.\n");
await client.query("begin");

try {
  /*
   * An account's identity across the two schemas is its username: the key is a
   * serial on one side and a uuid on the other, so it cannot be the join, and
   * the email can be blank. `not exists` is what makes this re-runnable and
   * what protects the accounts that only `app` has.
   */
  await step("accounts", `
    insert into app.account (username, email, first_name, last_name, is_staff, is_active, joined_at, last_seen_at)
    select u.username, coalesce(u.email, ''), coalesce(u.first_name, ''), coalesce(u.last_name, ''),
           u.is_staff, u.is_active, u.date_joined, u.last_login
      from public.auth_user u
     where not exists (select 1 from app.account a where a.username = u.username)`);

  await step("linked identities", `
    insert into app.account_identity (account_id, provider, provider_uid, extra, connected_at)
    select a.id, s.provider, s.uid, coalesce(s.extra_data, '{}'::jsonb), s.date_joined
      from public.socialaccount_socialaccount s
      join public.auth_user u on u.id = s.user_id
      join app.account a on a.username = u.username
     where not exists (
       select 1 from app.account_identity i
        where i.provider = s.provider and i.provider_uid = s.uid)`);

  /*
   * The legacy roles land on `account`, not beside the row they came from.
   *
   * `guestbook_userprofile.is_author` and `is_co_author` were a second role
   * system; they folded into `is_superuser` and `is_staff`, so a catch-up has
   * to write them where they live now. `app.public_access` inherits nothing
   * from that table -- its two columns default to true and the old one had no
   * equivalent, so a row is created empty of history.
   */
  await step("legacy author roles", `
    update app.account a
       set is_staff = true, is_superuser = true
      from public.guestbook_userprofile p
      join public.auth_user u on u.id = p.user_id
     where a.username = u.username and p.is_author`);

  await step("legacy co-author roles", `
    update app.account a
       set is_staff = true
      from public.guestbook_userprofile p
      join public.auth_user u on u.id = p.user_id
     where a.username = u.username and p.is_co_author`);

  await step("public access rows", `
    insert into app.public_access (account_id, created_at)
    select a.id, p.created_at
      from public.guestbook_userprofile p
      join public.auth_user u on u.id = p.user_id
      join app.account a on a.username = u.username
     where not exists (select 1 from app.public_access g where g.account_id = a.id)`);

  /*
   * Matched on author, body and the clock truncated to the millisecond -- the
   * three messages the original migration truncated would otherwise look like
   * rows `app` has not got, and be inserted a second time. Two messages carry
   * byte-identical text, which is why the author and the clock are in the key
   * as well as the body.
   */
  const matched = `
    select 1 from app.guest_message g
      join app.account ga on ga.id = g.account_id
     where ga.username = u.username
       and g.body = m.message
       and date_trunc('milliseconds', g.posted_at) = date_trunc('milliseconds', m.timestamp)`;

  await step("guestbook messages", `
    insert into app.guest_message (account_id, body, posted_at, is_pinned, pinned_at)
    select a.id, m.message, m.timestamp, m.is_pinned, m.pinned_at
      from public.guestbook_chatmessage m
      join public.auth_user u on u.id = m.user_id
      join app.account a on a.username = u.username
     where not exists (${matched})`);

  /*
   * Replies are resolved after the fact, because a reply and the message it
   * answers can both be new and the parent's uuid does not exist until it is
   * inserted. Only rows that still have no parent are touched, so a thread
   * `app` already knows about is left alone.
   */
  await step("replies re-pointed", `
    update app.guest_message child
       set reply_to_id = parent_app.id
      from public.guestbook_chatmessage child_pub
      join public.auth_user child_user on child_user.id = child_pub.user_id
      join public.guestbook_chatmessage parent_pub on parent_pub.id = child_pub.reply_to_id
      join public.auth_user parent_user on parent_user.id = parent_pub.user_id
      join app.account parent_account on parent_account.username = parent_user.username
      join app.guest_message parent_app
        on parent_app.account_id = parent_account.id
       and parent_app.body = parent_pub.message
       and date_trunc('milliseconds', parent_app.posted_at) = date_trunc('milliseconds', parent_pub.timestamp)
      join app.account child_account on child_account.username = child_user.username
     where child.reply_to_id is null
       and child.account_id = child_account.id
       and child.body = child_pub.message
       and date_trunc('milliseconds', child.posted_at) = date_trunc('milliseconds', child_pub.timestamp)`);

  /*
   * `views` is the one column readers move on both sides at once, so there is
   * no reading of it that is simply correct: the migration copied a total, and
   * both applications have been adding to their own copy ever since. Taking the
   * larger of the two never loses a count and never double-counts the shared
   * baseline, which is the most defensible answer available -- and the quantity
   * is a reader tally on a portfolio, where the gap is at most four.
   */
  await step("blog view counts raised", `
    update app.blog_post a
       set views = p.views
      from public.blog_blogpost p
     where p.slug = a.slug and p.views > a.views`);

  const total = done.reduce((n, [, c]) => n + c, 0);
  if (APPLY) {
    await client.query("commit");
    console.log(`\nCommitted. ${total} row(s) affected.`);
  } else {
    await client.query("rollback");
    console.log(`\nRolled back. ${total} row(s) would be affected. Pass --apply to keep them.`);
  }
} catch (error) {
  await client.query("rollback");
  console.error("\nRolled back:", error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
