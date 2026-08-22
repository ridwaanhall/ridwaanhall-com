# Drizzle migration state

`0000_colorful_paibok.sql` is the **introspection baseline**, produced by
`drizzle-kit pull` against the live Supabase database on 2026-08-20. It
describes the schema Django's migrations already created.

**Never run it.** Every table in it exists. It is here so `drizzle-kit generate`
has a starting point to diff future migrations against — that diff comes from
`meta/0000_snapshot.json`, which is why `meta/*.json` is explicitly un-ignored
in the repo's root `.gitignore` (a bare `*.json` would otherwise swallow it).

The generated `schema.ts` / `relations.ts` live in `../lib/db/` rather than
here, because that is where application code imports them from.

## Everything after the baseline is hand-written

`0001`, `0002` and `0003` were written by hand, and the reason is in each file's
header: `drizzle-kit generate` emits `DISABLE ROW LEVEL SECURITY` for all 42
tables and a `MAXVALUE` for 30 identity columns that has been round-tripped
through a JS double and lost precision. Neither may ever run here. Review
generated SQL line by line, or write it by hand as these are.

They are applied by hand too, over `STORAGE_POSTGRES_URL_NON_POOLING` — DDL is
not reliable through pgbouncer's transaction pooling. `drizzle-kit migrate` has
never run against this database, so `meta/_journal.json` stops at `0001` and
`meta/0001_snapshot.json` still describes the schema as it was before `0002` and
`0003`. That drift is worth knowing before running `generate`: it diffs against
that snapshot, so it will propose re-creating `core_contentversion` and the two
JSONB columns `0003` dropped. Delete those statements.

`0003` is the only destructive migration here, and the only one with an ordering
constraint: it must run **after** the Next.js app is deployed, because the
Django build it replaces reads all three of the things it drops. `MIGRATION.md`
has the detail.
