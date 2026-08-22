-- The profile's stories, as rich text.
--
-- HAND-WRITTEN, for the reason the others give: `drizzle-kit generate` emits
-- statements that must never run against this database. See `README.md` here.
--
-- `about_profile.stories` is a JSONB array of paragraph strings, edited through
-- a list-of-textareas widget -- one box per paragraph, reordered with arrow
-- buttons. That is the last piece of prose on the site still edited that way;
-- the blog body and project descriptions became HTML with a real editor in
-- `0001`, and this is the same move for the same reason.
--
-- Additive, exactly like `0001` and unlike `0003`: `stories` stays where it is.
-- Django keeps rendering from it, so this is safe to run while production is
-- still serving Django, and the conversion stays reversible until someone
-- decides otherwise.
--
-- The conversion is in this file rather than in a script because it is one
-- statement over ten paragraphs and there is nothing to tune. Escaping is
-- correct rather than paranoid: the column was declared as allowing inline
-- markup, but all ten entries are plain text -- checked, no tag of any kind and
-- the sanitiser round-trips every one unchanged -- so `&`, `<` and `>` in them
-- are literal characters and must survive as literal characters.
--
-- Guarded on `stories_html = ''` so re-running it cannot flatten an edit made
-- through the new editor back to whatever the JSONB still says.

ALTER TABLE "about_profile" ADD COLUMN IF NOT EXISTS "stories_html" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "about_profile"
SET "stories_html" = coalesce(
  (
    SELECT string_agg(
      '<p>' || replace(replace(replace(story, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>',
      ''
      ORDER BY ordinality
    )
    FROM jsonb_array_elements_text("stories") WITH ORDINALITY AS t(story, ordinality)
  ),
  ''
)
WHERE "stories_html" = '';
