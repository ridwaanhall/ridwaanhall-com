/**
 * Every row the previous build wrote has a counterpart in `app`.
 *
 * `app` was populated from `public` once, and both schemas have taken writes
 * since: the previous build is still serving the domain, and this admin has
 * been writing to `app`. So neither is a superset of the other, and the
 * question this answers is the narrow one that matters before `public` can be
 * dropped -- *is there anything in `public` that `app` has not got?*
 *
 * Read-only. Nothing here writes to either schema.
 *
 *   npx tsx scripts/check-schema-parity.mjs
 *
 * **Timestamps are not an identity.** The migration read rows through `pg`,
 * which hands back a JavaScript `Date`, and `Date` is millisecond-resolution --
 * so the three messages written with microseconds on the clock arrived in
 * `app` truncated (-814us, -36us, -105us). Comparing on an exact timestamp
 * reports those three as missing when they are the same rows. Every key below
 * that includes a time truncates it to the millisecond first.
 *
 * **Bodies are not an identity either.** Two guestbook messages carry byte-
 * identical text, so a key has to name the author and the clock as well.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const raw = process.env.STORAGE_POSTGRES_URL_NON_POOLING ?? process.env.STORAGE_POSTGRES_URL;
if (!raw) throw new Error("STORAGE_POSTGRES_URL_NON_POOLING is not set (see .env.example)");
const url = new URL(raw);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 3, ssl: { rejectUnauthorized: false } });
const q = (text, params = []) => pool.query(text, params).then((r) => r.rows);

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};

/** A timestamp rendered the way both sides can agree on: UTC, to the millisecond. */
const ms = (expr) => `to_char(date_trunc('milliseconds', ${expr}) at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.MS')`;

/**
 * The tables production can still add rows to. Each names the identity a row
 * has on both sides -- never the primary key, which is a serial on one side and
 * a uuid on the other.
 */
const TRACKED = [
  {
    label: "accounts",
    pub: `select username as k, username as shown from public.auth_user`,
    app: `select username as k from app.account`,
  },
  {
    label: "linked identities",
    pub: `select s.provider || ' ' || s.uid as k, u.username || ' via ' || s.provider as shown
            from public.socialaccount_socialaccount s join public.auth_user u on u.id = s.user_id`,
    app: `select i.provider || ' ' || i.provider_uid as k from app.account_identity i`,
  },
  {
    label: "guestbook profiles",
    pub: `select u.username as k, u.username as shown
            from public.guestbook_userprofile p join public.auth_user u on u.id = p.user_id`,
    app: `select a.username as k from app.guest_profile g join app.account a on a.id = g.account_id`,
  },
  {
    label: "guestbook messages",
    pub: `select u.username || '|' || m.message || '|' || ${ms("m.timestamp")} as k,
                 u.username || ': ' || left(m.message, 48) as shown
            from public.guestbook_chatmessage m join public.auth_user u on u.id = m.user_id`,
    app: `select a.username || '|' || g.body || '|' || ${ms("g.posted_at")} as k
            from app.guest_message g join app.account a on a.id = g.account_id`,
  },
  {
    label: "comments",
    pub: `select c.body || '|' || ${ms("c.created_at")} as k, left(c.body, 48) as shown
            from public.comments_comment c`,
    app: `select c.body || '|' || ${ms("c.created_at")} as k from app.comment c`,
  },
];

console.log("Rows in `public` with no counterpart in `app`:\n");
const missing = {};
for (const t of TRACKED) {
  const have = new Set((await q(t.app)).map((r) => r.k));
  const absent = (await q(t.pub)).filter((r) => !have.has(r.k));
  missing[t.label] = absent;
  check(absent.length === 0, t.label, absent.map((r) => r.shown).join(" | "));
}

/**
 * Everything else is content, edited through an admin rather than by visitors.
 * A count is enough to notice a row appearing on one side and not the other;
 * the tracked tables above are the ones that needed a real key.
 */
const COUNTED = [
  ["about_application", "application"], ["about_award", "award"], ["about_certification", "certification"],
  ["about_education", "education"], ["about_experience", "experience"],
  ["about_journeystep", "application_step"], ["about_organization", "organization"], ["about_profile", "profile"],
  ["about_skill", "skill"], ["about_profileskillhighlight", "profile_skill_highlight"],
  ["blog_blogimage", "blog_image"], ["blog_blogpost", "blog_post"],
  ["legal_legaldocument", "legal_document"], ["legal_legalsection", "legal_section"],
  ["openhire_position", "job_opening"], ["openhire_portfoliohighlight", "portfolio_highlight"],
  ["projects_project", "project"], ["projects_projectimage", "project_image"],
  ["projects_feature", "project_feature"],
];

console.log("\nContent tables, by count:\n");
const short = [];
for (const [pub, app] of COUNTED) {
  const [{ c: p }] = await q(`select count(*)::int c from public."${pub}"`);
  const [{ c: a }] = await q(`select count(*)::int c from app."${app}"`);
  if (a < p) short.push(`${app} ${a} < ${p}`);
}
check(short.length === 0, `all ${COUNTED.length} content tables hold at least what \`public\` does`, short.join(", "));

/**
 * `views` is the one column visitors move on both sides at once -- each build
 * increments it on every read of a post. A row where `public` is ahead is a
 * count that would be lost.
 */
const behind = await q(`
  select p.slug, p.views as pub, a.views as app
    from public.blog_blogpost p join app.blog_post a on a.slug = p.slug
   where p.views > a.views order by p.views - a.views desc`);
check(behind.length === 0, "no post's view count is ahead in `public`",
  `${behind.length} post(s), largest gap ${behind[0] ? behind[0].pub - behind[0].app : 0}`);

console.log(
  failures === 0
    ? "\n`app` holds everything `public` does."
    : `\n${failures} check(s) failed — \`public\` still has rows \`app\` has not got.`,
);
await pool.end();
process.exit(failures === 0 ? 0 : 1);
