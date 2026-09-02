-- The superuser flag and the per-screen grant table.
--
-- `0000_init.sql` already describes both, and it is the file a new installation
-- runs. This one exists because that file never runs against a database that
-- already has a schema -- so a delta is the only way the change reaches the
-- live one. Both must agree afterwards, which is what
-- `scripts/check-baseline-schema.mjs` proves.
--
--   node scripts/apply-migration.mjs drizzle/0001_admin_access.sql          # dry run
--   node scripts/apply-migration.mjs drizzle/0001_admin_access.sql --apply
--
-- Over `STORAGE_POSTGRES_URL_NON_POOLING`, not the pooled URL.
--
-- Then, in order:
--
--   node scripts/gen-app-schema.mjs                 # regenerate the mapping
--   npx tsx scripts/check-baseline-schema.mjs       # the file builds this schema
--   npx tsx scripts/check-app-schema.mjs            # the mapping matches it
--   npx tsx scripts/check-rls.mjs                   # RLS on every table
--   npx tsx scripts/seed-admin-access.mjs           # dry run, then --apply
--
-- **The seed is not optional and is not in this file.** Without it every
-- existing staff account has zero grants, which is an admin with nothing in
-- it. The grants are one row per registry key and the registry lives in
-- TypeScript, so seeding them from SQL would mean transcribing thirty-five
-- keys into this file -- exactly the copy that drifts. `seed-admin-access.mjs`
-- imports the registry instead.
--
-- Idempotent, so re-running it is safe: every statement is `IF NOT EXISTS`.
--
-- No `begin`/`commit` in here. `apply-migration.mjs` wraps the whole file in
-- one transaction and rolls it back unless `--apply` is passed; a `commit`
-- inside would end that transaction from the inside, so the dry run would
-- commit and still report that nothing changed.

ALTER TABLE "app"."account"
    ADD COLUMN IF NOT EXISTS "is_superuser" boolean NOT NULL DEFAULT false;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "app"."admin_access" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid NOT NULL REFERENCES "app"."account"("id") ON DELETE CASCADE,
    -- A registry key from lib/admin/registry.ts, not a table name. The reason
    -- is written up at the same table in `0000_init.sql`.
    "model_key" text NOT NULL,
    "can_view" boolean NOT NULL DEFAULT false,
    "can_add" boolean NOT NULL DEFAULT false,
    "can_change" boolean NOT NULL DEFAULT false,
    "can_delete" boolean NOT NULL DEFAULT false,
    CONSTRAINT "admin_access_account_model_key" UNIQUE ("account_id", "model_key")
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "admin_access_account_idx"
    ON "app"."admin_access" ("account_id");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Row Level Security, for the table this delta just created
-- ---------------------------------------------------------------------------
--
-- **A table created by a delta arrives with RLS off.** The loop that enables it
-- lives at the end of `0000_init.sql` and runs when that file runs, which is
-- never against a database that already exists -- so a table added here is
-- readable straight through Supabase's PostgREST API by anyone holding the
-- project's anon key, while `0000_init.sql` describes it correctly and every
-- other check passes. Seven tables were left that way once.
--
-- `admin_access` is precisely the table where that matters most: it is the
-- answer to "what may this person do", and it names accounts.
--
-- The whole loop rather than one `ALTER`, because enabling RLS twice is a
-- no-op and a loop cannot miss a table the way a hand-written list can.

DO $$
DECLARE
    target text;
BEGIN
    FOR target IN SELECT tablename FROM pg_tables WHERE schemaname = 'app'
    LOOP
        EXECUTE format('ALTER TABLE app.%I ENABLE ROW LEVEL SECURITY', target);
    END LOOP;
END
$$;
