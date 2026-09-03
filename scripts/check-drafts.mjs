/**
 * A draft is a row the public site cannot reach.
 *
 *   node scripts/check-drafts.mjs                 # the rules
 *   npm run dev && node scripts/check-drafts.mjs  # and the publish endpoint
 *
 * Two rules, both in `lib/data/content.ts`: the public read paths select only
 * `is_published`, and `app/api/cron/publish` is the only thing that turns it
 * on by itself. Everything a reader can reach resolves through `getBlogs` and
 * `getProjects` -- the listing, the detail pages, `generateStaticParams`, the
 * sitemap, the JSON API and search -- so the `where` is the whole surface.
 *
 * **Asserted against the database, not through the site.** Three earlier
 * drafts of this file fetched pages and asserted the slug was absent, and every
 * one of them was worthless: those responses come from a `"use cache"` entry
 * with a lifetime of days, and a row written with SQL issues none of the
 * `updateTag` a save through the admin would. The absence proved the cache had
 * not been rebuilt, which it hadn't, whatever the flag said. Adding a published
 * control row did not rescue it either -- the control was invisible too, for
 * the same reason, and only looked visible the one time the entry happened to
 * be cold.
 *
 * So the rules are checked where they are decidable: the same predicates the
 * read paths and the job use, run against the real tables inside a transaction
 * that is rolled back. The one thing worth asking over HTTP is the endpoint's
 * refusal, which is a status and not a payload, so no cache stands in front of
 * it.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const STAMP = Date.now();

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `\n          ${detail}`}`);
};

const url = new URL(process.env.STORAGE_POSTGRES_URL);
url.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: url.toString(), max: 4, ssl: { rejectUnauthorized: false } });

console.log("Drafts\n");

const client = await pool.connect();
try {
  await client.query("begin");

  const post = async (slug, published, when) => {
    const { rows } = await client.query(
      `insert into app.blog_post (title, slug, description, is_published, published_at)
       values ($1, $2, '', $3, now() + $4::interval) returning id`,
      [`zz ${slug}`, slug, published, when],
    );
    return rows[0].id;
  };
  const project = async (slug, published) => {
    const { rows } = await client.query(
      `insert into app.project (title, slug, is_published) values ($1, $2, $3) returning id`,
      [`zz ${slug}`, slug, published],
    );
    return rows[0].id;
  };

  /* -------------------------------------------------- what the reader sees */
  const draft = await post(`zz-draft-${STAMP}`, false, "-1 day");
  const live = await post(`zz-live-${STAMP}`, true, "-1 day");

  // The read path's `where`, with nothing else narrowing it.
  const { rows: visible } = await client.query(
    "select id from app.blog_post where is_published = true and id = any($1::uuid[])",
    [[draft, live]],
  );
  const seen = new Set(visible.map((r) => r.id));
  check(!seen.has(draft), "a draft post is not among the rows the site reads");
  check(seen.has(live), "and an otherwise identical published one is");

  const draftProject = await project(`zz-draft-project-${STAMP}`, false);
  const liveProject = await project(`zz-live-project-${STAMP}`, true);
  const { rows: visibleProjects } = await client.query(
    "select id from app.project where is_published = true and id = any($1::uuid[])",
    [[draftProject, liveProject]],
  );
  const seenProjects = new Set(visibleProjects.map((r) => r.id));
  check(!seenProjects.has(draftProject), "a draft project is not either");
  check(seenProjects.has(liveProject), "and a published one is");

  /*
   * The column has to default to off, or a create through the admin publishes
   * whatever was typed the moment it is first saved -- which is the behaviour
   * this whole change exists to remove.
   */
  for (const table of ["blog_post", "project"]) {
    const { rows } = await client.query(
      `select column_default as d from information_schema.columns
       where table_schema = 'app' and table_name = $1 and column_name = 'is_published'`,
      [table],
    );
    check(rows[0]?.d === "false", `${table}.is_published defaults to off`, `default is ${rows[0]?.d}`);
  }

  /* ------------------------------------------------------- the publish job */
  /*
   * Due means `published_at` has passed *and* the flag is still off. A row
   * dated forward must not be caught, and one already published must not be
   * rewritten on every run for no reason.
   */
  const future = await post(`zz-future-${STAMP}`, false, "1 day");
  const { rows: due } = await client.query(
    `update app.blog_post set is_published = true
     where is_published = false and published_at <= now() returning id`,
  );
  const published = new Set(due.map((r) => r.id));
  check(published.has(draft), "the job publishes a post whose time has passed");
  check(!published.has(future), "and leaves one dated forward alone");
  check(!published.has(live), "and does not touch one already published");

  await client.query("rollback");

  const { rows: left } = await client.query(
    "select 1 from app.blog_post where slug like $1 union all select 1 from app.project where slug like $1",
    [`zz-%-${STAMP}`],
  );
  check(left.length === 0, "the rollback left nothing behind", `${left.length} row(s) survived`);
} finally {
  client.release();
}

/* ------------------------------------------------------------ the endpoint */
try {
  const response = await fetch(`${BASE}/api/cron/publish`, { redirect: "manual" });
  check(
    response.status === 401 || response.status === 503,
    "the publish job refuses a request with no bearer token",
    `expected 401 (secret set) or 503 (secret unset), got ${response.status}`,
  );
} catch {
  console.log(`  --    the publish endpoint was not asked (nothing serving ${BASE})`);
}

/*
 * Anything this file has ever written, not only this run's.
 *
 * Everything above happens inside a transaction that is rolled back, so a leak
 * should be impossible -- and an earlier version of this file, which wrote
 * outside one and deleted in a `finally`, reported "the harness rows are gone"
 * and left two posts in the live blog anyway. One of them published. So the
 * question is asked again here, of the table rather than of the delete, and a
 * leftover is a failure rather than a note.
 */
{
  const { rows } = await pool.query(
    "select slug from app.blog_post where slug like 'zz-%' " +
      "union all select slug from app.project where slug like 'zz-%'",
  );
  check(
    rows.length === 0,
    "no harness row is left anywhere in the content",
    `still there: ${rows.map((r) => r.slug).join(", ")}`,
  );
}

await pool.end();
console.log(failures ? `\n${failures} check(s) failed.` : "\nA draft stays a draft.");
// Set rather than `process.exit`, which tears the loop down under the pool's own
// teardown and trips a libuv assertion on Windows.
process.exitCode = failures ? 1 : 0;
