-- Rich-text columns, added alongside the existing JSONB ones.
--
-- HAND-WRITTEN. `drizzle-kit generate` produced these two statements plus 72
-- others that must never run, and the same will happen to the next person who
-- runs it against this database:
--
--   * `ALTER TABLE … DISABLE ROW LEVEL SECURITY` for all 42 tables. Drizzle does
--     not model RLS state, so it reads every table as "should be disabled".
--     Running it would open every public table to anyone holding the Supabase
--     anon key, via the PostgREST API that sits in front of this schema
--     independently of the application. RLS is force-enabled on purpose.
--
--   * `ALTER COLUMN "id" SET MAXVALUE 9223372036854776000` for 30 identity
--     columns. The real bigint maximum is 9223372036854775807; that value has
--     been round-tripped through a JS double and lost precision. It is not a
--     difference, it is a rounding error.
--
-- So: review generated SQL line by line before running it, or write it here by
-- hand as this one is.
--
-- Both columns are additive and defaulted, which is what lets Django keep
-- running unchanged through the rest of the migration -- its ORM selects named
-- columns and never sees these, and its inserts satisfy the NOT NULL via the
-- default. `content` and `description` stay as they are and are dropped at
-- cutover.

ALTER TABLE "blog_blogpost" ADD COLUMN IF NOT EXISTS "content_html" text DEFAULT '' NOT NULL;
ALTER TABLE "projects_project" ADD COLUMN IF NOT EXISTS "description_html" text DEFAULT '' NOT NULL;
