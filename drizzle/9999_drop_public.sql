-- Drop the schema the previous build left behind.
--
-- ============================================================================
-- DO NOT RUN THIS UNTIL THE DOMAIN SERVES THIS APPLICATION.
-- ============================================================================
--
-- `public` is not this application's schema and nothing in this codebase reads
-- it. It is the schema the site's previous build created, and that build is
-- still answering requests on the domain until the deployment is switched over.
-- Running this before that happens takes the live site down.
--
-- The pre-flight is one request. The previous build sets a `csrftoken` cookie
-- and serves its stylesheets from `/static/css/`; this one does neither:
--
--   curl -sS -D - -o /dev/null https://ridwaanhall.com/ | grep -i csrftoken
--   curl -sS https://ridwaanhall.com/ | grep -o '/static/css/'
--
-- Both must come back empty. If either matches, stop.
--
-- Then, in order:
--
--   1. npx tsx scripts/check-schema-parity.mjs      # `app` has everything
--   2. npx tsx scripts/catch-up-from-public.mjs --apply   # if it does not
--   3. back up, so this is recoverable:
--        node -e "…" > public-backup.dump.json      # see the repository history
--      or simply keep the copy taken when this file was written.
--   4. node scripts/apply-migration.mjs drizzle/9999_drop_public.sql
--      (dry run — read what it prints)
--   5. node scripts/apply-migration.mjs drizzle/9999_drop_public.sql --apply
--   6. npx tsx scripts/check-rls.mjs and the site harnesses, once more.
--
-- Afterwards, delete this file, `scripts/check-schema-parity.mjs` and
-- `scripts/catch-up-from-public.mjs`. All three exist only for this moment.
--
-- ---------------------------------------------------------------------------
-- Why the tables and not the schema
-- ---------------------------------------------------------------------------
--
-- `drop schema public cascade` would work here — when this was written `public`
-- held 42 tables and nothing else: no extensions, no functions, no views, no
-- free-standing sequences, and no foreign key crossing to or from `app`. But an
-- empty `public` is not the same thing as no `public`. It is named in the
-- default `search_path`, and Supabase's own tooling assumes it exists. Dropping
-- the tables leaves the schema in the state a new project would have.
--
-- Written as a loop rather than 42 names so that a table added between now and
-- the cutover is dropped too, rather than being left behind as the one piece of
-- the old build that outlived it. `cascade` because the old schema's foreign
-- keys point at each other and nothing outside it depends on them.

DO $$
DECLARE
    target text;
    dropped int := 0;
BEGIN
    FOR target IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', target);
        dropped := dropped + 1;
    END LOOP;
    RAISE NOTICE 'dropped % table(s) from public', dropped;
END
$$;
