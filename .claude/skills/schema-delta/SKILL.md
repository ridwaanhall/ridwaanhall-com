---
name: schema-delta
description: Change the database schema here (add/alter a table or column, constraint, index) the only way this repo allows - edit drizzle/0000_init.sql, apply a throwaway ALTER delta to the live database, enable RLS, regenerate the mapping, prove it, delete the delta. Use for any DDL.
---

# A schema change

Rules: `drizzle/CLAUDE.md`, `drizzle/README.md`, the RLS trap in the root
`CLAUDE.md`. Owner: `data-engineer`; reviewer: `security-engineer` for any new
table or anything on `account`.

## Steps

1. **Edit `drizzle/0000_init.sql`** so it describes the schema you want. Real
   foreign keys with real actions (CASCADE where the child means nothing alone,
   SET NULL where it does, RESTRICT where the reference is somebody else's),
   never deferrable. Uuid keys. A `position` column where order matters.
2. **Write the delta** `drizzle/<short-name>.sql` in `ALTER` / `CREATE` form,
   with **no `begin`/`commit`**. If it creates a table, end it with the same
   RLS loop as the end of `0000_init.sql` (enabling twice is a no-op):
   ```sql
   do $$ declare r record; begin
     for r in select tablename from pg_tables where schemaname = 'app' loop
       execute format('alter table app.%I enable row level security', r.tablename);
     end loop;
   end $$;
   ```
   If it adds a vocabulary colour or similar token, update the matching check
   constraint and the code map together.
3. **Dry run**, read the output: `node scripts/apply-migration.mjs drizzle/<name>.sql`
4. **Apply**: `node scripts/apply-migration.mjs drizzle/<name>.sql --apply`
5. **Regenerate the mapping**: `node scripts/gen-app-schema.mjs` (never edit
   `lib/db/app-schema.ts` by hand).
6. **Restart `next dev`**; a running server keeps the old mapping and throws
   from React frames naming nothing useful.
7. **Prove it**:
   ```bash
   npx tsx scripts/check-baseline-schema.mjs   # file vs live, in a rolled-back scratch schema
   npx tsx scripts/check-app-schema.mjs
   npx tsx scripts/check-rls.mjs
   npx tsx scripts/check-auth-adapter.mjs      # if auth tables moved
   npx tsx scripts/check-admin-usage.mjs       # if an FK into a lookup table was added
   node scripts/check-fresh-start.mjs          # fails while a second baseline file exists
   ```
8. **Delete the delta** in the same commit that lands the `0000_init.sql`
   change. A delta that stays is a rung.
9. **Follow-through**: new screen? `add-admin-screen`. New FK into a lookup
   table? Its "Used by" column. New image column? `lib/storage/cleanup.ts`
   (`check-storage`).

## Never

- Run `drizzle-kit generate` output unread (it disables RLS on every table).
- Name a table unqualified inside a `sql` template.
- Rely on the `ensure_rls` event trigger instead of step 2.
