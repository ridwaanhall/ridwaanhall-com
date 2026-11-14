/**
 * A draft is a row the public site cannot reach.
 *
 *   node scripts/check-drafts.mjs
 *
 * The rule is in `lib/data/content.ts`: the public read paths select only
 * `is_published`, and nothing turns it on but a save through the admin.
 * Everything a reader can reach resolves through `getBlogs` and
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
 * read paths use, run against the real tables inside a transaction
 * that is rolled back.
 */
import { config } from "dotenv";
import { pgPool, reporter } from "./harness.mjs";

config({ path: ".env.local", quiet: true });

const STAMP = Date.now();

const { check, finish } = reporter({ detailOnFailure: true });

const pool = pgPool(4);

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
  check("a draft post is not among the rows the site reads", !seen.has(draft));
  check("and an otherwise identical published one is", seen.has(live));

  const draftProject = await project(`zz-draft-project-${STAMP}`, false);
  const liveProject = await project(`zz-live-project-${STAMP}`, true);
  const { rows: visibleProjects } = await client.query(
    "select id from app.project where is_published = true and id = any($1::uuid[])",
    [[draftProject, liveProject]],
  );
  const seenProjects = new Set(visibleProjects.map((r) => r.id));
  check("a draft project is not either", !seenProjects.has(draftProject));
  check("and a published one is", seenProjects.has(liveProject));

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
    check(`${table}.is_published defaults to off`, rows[0]?.d === "false", `default is ${rows[0]?.d}`);
  }

  await client.query("rollback");

  const { rows: left } = await client.query(
    "select 1 from app.blog_post where slug like $1 union all select 1 from app.project where slug like $1",
    [`zz-%-${STAMP}`],
  );
  check("the rollback left nothing behind", left.length === 0, `${left.length} row(s) survived`);
} finally {
  client.release();
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
    "no harness row is left anywhere in the content",
    rows.length === 0,
    `still there: ${rows.map((r) => r.slug).join(", ")}`,
  );
}

await pool.end();
// Set rather than `process.exit`, which tears the loop down under the pool's own
// teardown and trips a libuv assertion on Windows.
process.exitCode = finish("A draft stays a draft.");
