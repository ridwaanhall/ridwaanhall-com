# Drizzle migration state

`0000_colorful_paibok.sql` is the **introspection baseline**, produced by
`drizzle-kit pull` against the live Supabase database on 2026-08-20. It
describes the schema Django's migrations already created.

**Never run it.** Every table in it exists. It is here so `drizzle-kit generate`
has a starting point to diff future migrations against — that diff comes from
`meta/0000_snapshot.json`, which is why `meta/*.json` is explicitly un-ignored
in the repo's root `.gitignore` (a bare `*.json` would otherwise swallow it).

While Django is still runnable (phases 1–3 of the migration), **the schema does
not change** — Django owns it. New migrations only start after cutover.

The generated `schema.ts` / `relations.ts` live in `../lib/db/` rather than
here, because that is where application code imports them from.
