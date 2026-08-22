-- The last of the Django schema that this application does not use.
--
-- HAND-WRITTEN, for the reason `0001` and `0002` give: `drizzle-kit generate`
-- emits `DISABLE ROW LEVEL SECURITY` for all 42 tables and a rounded-off
-- `MAXVALUE` for 30 identity columns, neither of which may ever run here.
--
-- **This is the only destructive migration in the directory.** Everything up to
-- now was additive, so the port stayed reversible: `content` and `description`
-- held the original JSONB blocks alongside the converted HTML, and the old
-- rendering was always one query away. That is what this gives up, on purpose
-- and last, once the HTML had been the thing being served long enough to trust.
-- A snapshot of all three was taken first (`pre-drop-blocks.dump.json`, ignored
-- by git because it is content rather than code).
--
--   core_contentversion   Django's cache-versioning table: a counter per
--                         namespace, bumped on save, mixed into every cache key
--                         so a write invalidated the keys derived from it.
--                         Next.js does this with `cacheTag` and `updateTag`
--                         instead -- see lib/data/tags.ts -- so nothing reads or
--                         writes these four rows. No foreign key touches it.
--
--   blog_blogpost.content         The bodies as JSONB block arrays, converted to
--   projects_project.description  `content_html` / `description_html` by
--                         scripts/blocks-to-html.mjs. Verified before dropping:
--                         every one of the 20 posts and 64 projects has non-empty
--                         HTML, and no page has read the block arrays since the
--                         detail pages were ported.
--
-- **`django_content_type` stays**, and it looks just as droppable as these. It
-- is not: three live foreign keys point at it, `comments_comment.content_type_id`
-- among them. The comment model is generic in Django's sense and the column is
-- part of the schema this application still writes.

DROP TABLE IF EXISTS "core_contentversion";--> statement-breakpoint
ALTER TABLE "blog_blogpost" DROP COLUMN IF EXISTS "content";--> statement-breakpoint
ALTER TABLE "projects_project" DROP COLUMN IF EXISTS "description";
