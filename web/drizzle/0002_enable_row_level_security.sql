-- Row Level Security on every table in the public schema.
--
-- HAND-WRITTEN, and it replaces something that used to happen automatically.
--
-- Supabase exposes a PostgREST API over the `public` schema to anyone holding
-- the project's anon key, entirely independently of this application. Without
-- RLS those tables -- `auth_user` and `socialaccount_socialtoken` among them --
-- are readable and writable straight through that API, bypassing every check
-- the app makes. Django closed that surface from a `post_migrate` receiver
-- (`enable_row_level_security` in `apps/core/signals.py`) which re-ran after
-- every migration, so a table added later was covered without anyone
-- remembering to do it.
--
-- That receiver disappears with the Django tree. This is the replacement, and
-- the important difference is that it runs once rather than after every schema
-- change -- so `scripts/check-rls.mjs` exists to fail loudly if a table ever
-- appears without it.
--
-- **Enabling RLS with no policies does not lock the application out**, and that
-- is worth stating because it looks like it should. The role this app connects
-- as (`postgres`) has `rolbypassrls`, verified against `pg_roles`, so its own
-- queries are unaffected. What it does lock out is every other holder of a key
-- to this project. Zero policies is the intended state: nothing outside the
-- application should read these tables at all.
--
-- Idempotent, so re-running it is safe and is the right thing to do after any
-- migration that creates a table.
--
-- **A generated migration will try to undo this.** `drizzle-kit generate` does
-- not model RLS state, reads every table as "should be disabled", and emits
-- `ALTER TABLE … DISABLE ROW LEVEL SECURITY` for all of them. Strip those lines
-- before running anything it produces. See `README.md` in this directory.

DO $$
DECLARE
    target text;
BEGIN
    FOR target IN
        SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', target);
    END LOOP;
END
$$;
