-- The application's schema, whole, from nothing.
--
-- This is the only file a new installation runs. It creates `app` and every
-- table, index, constraint and row-level-security setting in it, and it depends
-- on nothing that is already there:
--
--   node scripts/apply-migration.mjs drizzle/0000_init.sql          # dry run
--   node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
--
-- Over `STORAGE_POSTGRES_URL_NON_POOLING`, not the pooled URL. DDL is not
-- reliable through pgbouncer's transaction-mode pooling.
--
-- `scripts/check-baseline-schema.mjs` applies this into a scratch schema and
-- compares the result against the live one, so the claim above is checked
-- rather than asserted. Run it after any change here, then
-- `node scripts/gen-app-schema.mjs` to bring the Drizzle mapping back in step.
--
-- ---------------------------------------------------------------------------
-- The shape, and why it is this shape
-- ---------------------------------------------------------------------------
--
--   * **UUID keys, everywhere.** Sequential ids leak how much of a thing exists
--     and how fast it grows -- the 62nd job application would be
--     `/admin/application/62` -- and they make a row's identity a function of
--     insert order, so two environments can never hold the same id for the same
--     row. Every table here is keyed by `gen_random_uuid()`.
--
--   * **Lookup tables for closed vocabularies.** Employment type, work mode,
--     application source, the two status sets, legal document type and the six
--     the open-to-work profile answers from are rows, not free text repeated
--     across four tables. Referenced by id, editable in one place, and
--     impossible to misspell into a new category by accident. Every one of them
--     has a screen under Settings in the admin, which is the point: a
--     vocabulary nobody can edit is a vocabulary that gets edited in SQL.
--
--   * **One `tag` table.** Blog posts and projects share it rather than each
--     carrying a list of free text, where `Python` and `python` are two
--     different tags. The slug is the identity; the label is what shows.
--
--   * **One `location` table.** Location is one shape referenced by id, rather
--     than six columns on the profile, six different ones on education, and a
--     free-text field on each of experience and application.
--
--   * **One `media_asset` table.** An image is a row, so a file is named once
--     and referenced by id however many records point at it -- one photo can
--     easily be named by twenty. It also gives the admin something to render a
--     real URL from, and makes deletion reference-countable
--     (`lib/storage/cleanup.ts`).
--
--   * **Ordered lists are child tables, not arrays.** Responsibilities,
--     achievements, required skills, benefits, the openhire lists: each is a
--     table with a `position`, so a list can be queried, counted and reordered
--     without rewriting a whole document.
--
--   * **Accounts carry identity and authority, and no credential.** Everyone
--     signs in through Google or GitHub, so there is no password column to
--     leak: `account` holds identity and the three flags the app reads,
--     `account_identity` holds the provider link, and `admin_access` holds what
--     one staff account may do on each admin screen. A comment names its target
--     with a plain `target_kind` and `target_id` rather than a
--     generic-foreign-key mechanism.
--
-- `position` rather than `order`, which is reserved. Every ordering column is
-- an integer with a stable default, so a list has an order before anyone sets
-- one.

CREATE SCHEMA IF NOT EXISTS "app";--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."media_asset" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The object key inside the storage bucket, e.g. `profile/ridwaanhall.webp`.
    -- Content-addressed by `lib/storage/keys.ts`, so the same bytes uploaded
    -- twice are one row.
    "storage_key" text NOT NULL,
    "original_filename" text NOT NULL DEFAULT '',
    "alt" text NOT NULL DEFAULT '',
    "created_at" timestamptz NOT NULL DEFAULT now(),
    -- Where the file actually lives, because two kinds of image feed this site
    -- and they are not the same thing. `storage` is an object in the Supabase
    -- bucket, uploaded through the admin and named after its contents. `static`
    -- is a file bundled under `public/` and served by the app itself -- the 78
    -- skill icons are these: vector, tiny, cached with the deployment. One
    -- table with a discriminator rather than two columns on `skill` means one
    -- resolver turns either into a URL and the admin renders both the same way.
    -- `storage_key` is the bucket key for one and the public path for the other.
    "source" text NOT NULL DEFAULT 'storage',
    CONSTRAINT "media_asset_storage_key_key" UNIQUE ("storage_key"),
    CONSTRAINT "media_asset_source_check" CHECK ("source" IN ('storage', 'static'))
);--> statement-breakpoint

CREATE TABLE "app"."tag" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    CONSTRAINT "tag_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."category" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Which set this belongs to: skills, projects and blog posts each have
    -- their own vocabulary and must not offer each other's terms.
    "kind" text NOT NULL,
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "category_kind_slug_key" UNIQUE ("kind", "slug"),
    CONSTRAINT "category_kind_check" CHECK ("kind" IN ('skill', 'project', 'blog'))
);--> statement-breakpoint

CREATE TABLE "app"."location" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "city" text NOT NULL DEFAULT '',
    "region" text NOT NULL DEFAULT '',
    "country" text NOT NULL DEFAULT '',
    "flag" text NOT NULL DEFAULT '',
    "map_url" text NOT NULL DEFAULT '',
    -- The three parts together are the identity. `''` is a legitimate part --
    -- "Indonesia" with no city is a real value on an application -- so the
    -- columns default to empty rather than null and the key stays simple.
    CONSTRAINT "location_city_region_country_key" UNIQUE ("city", "region", "country")
);--> statement-breakpoint

CREATE TABLE "app"."organization" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "name" text NOT NULL,
    "website" text NOT NULL DEFAULT '',
    "logo_id" uuid REFERENCES "app"."media_asset"("id") ON DELETE SET NULL,
    CONSTRAINT "organization_slug_key" UNIQUE ("slug"),
    CONSTRAINT "organization_name_key" UNIQUE ("name")
);--> statement-breakpoint

CREATE TABLE "app"."employment_type" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "employment_type_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."work_mode" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "work_mode_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."application_source" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    CONSTRAINT "application_source_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."application_status" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "application_status_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."project_status" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    -- The lifecycle order the projects list sorts by. `lib/data/content.ts`
    -- reads it, so reordering these rows reorders the projects page.
    "position" integer NOT NULL DEFAULT 0,
    -- The badge's colour, as a **token** and never as a class.
    --
    -- `bg-purple-400/90 text-purple-950` is what renders; `purple` is what is
    -- stored. That distinction is the whole point: Tailwind finds classes by
    -- scanning source text, so a class that exists only as a column value
    -- produces no rule at all -- while a token is just a key, exactly like the
    -- slug beside it. `lib/data/project-status.ts` holds the eighteen pairs,
    -- each written out in full, and `scripts/check-db-classes.mjs` is what
    -- keeps the column from ever holding the class itself.
    --
    -- It is a column rather than a lookup keyed on the slug because that is
    -- what lets a status be *created* here: keyed on the slug, a new row had no
    -- colour and rendered in the neutral fallback, which reads as a broken card
    -- rather than as a status nobody has picked a colour for.
    --
    -- The check lists the tokens rather than pointing at a table, because the
    -- set is fixed by what the stylesheet can emit and is not editorial: adding
    -- one means writing its class pair out in that module first.
    "color" text NOT NULL DEFAULT 'zinc',
    CONSTRAINT "project_status_slug_key" UNIQUE ("slug"),
    CONSTRAINT "project_status_color_check" CHECK ("color" IN (
        'purple', 'violet', 'indigo', 'blue', 'sky', 'cyan', 'teal',
        'emerald', 'green', 'lime', 'yellow', 'amber', 'orange', 'red',
        'rose', 'pink', 'fuchsia', 'zinc'
    ))
);--> statement-breakpoint

CREATE TABLE "app"."legal_document_type" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "legal_document_type_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

-- The six vocabularies the open-to-work profile chooses from. Each was a
-- `text` column on that one row, which meant the set of answers existed only
-- as whatever had last been typed into it: no way to offer the options, and
-- "Mid-Level" and "Mid level" were different answers to the same question.

CREATE TABLE "app"."open_to_work_status" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "open_to_work_status_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."availability" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "availability_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."experience_level" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "experience_level_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."notice_period" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "notice_period_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."work_authorization" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "work_authorization_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."contact_preference" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "label" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "contact_preference_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."account" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "username" text NOT NULL,
    "email" text NOT NULL DEFAULT '',
    "first_name" text NOT NULL DEFAULT '',
    "last_name" text NOT NULL DEFAULT '',
    -- The three flags the application reads, and no password hash: every
    -- account is OAuth, so there is no credential here to store. All three are
    -- read from this table on every request and never carried in the session
    -- token -- see lib/auth/staff.ts for why a thirty-day JWT must not be
    -- allowed to assert a privilege.
    --
    -- `is_superuser` is the whole of what that role is, and it is deliberately
    -- a column here rather than a row in `admin_access`: it is not a grant but
    -- the absence of the question, and it is what decides who may edit anyone
    -- else's grants at all.
    "is_staff" boolean NOT NULL DEFAULT false,
    "is_superuser" boolean NOT NULL DEFAULT false,
    "is_active" boolean NOT NULL DEFAULT true,
    "joined_at" timestamptz NOT NULL DEFAULT now(),
    "last_seen_at" timestamptz,
    CONSTRAINT "account_username_key" UNIQUE ("username")
);--> statement-breakpoint

CREATE TABLE "app"."admin_access" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid NOT NULL REFERENCES "app"."account"("id") ON DELETE CASCADE,
    -- A **registry key** from lib/admin/registry.ts -- `blog-post`, `tag`,
    -- `legal-section` -- and deliberately not a table name. The admin is keyed
    -- on screens rather than on tables, and the two do not line up: fourteen
    -- vocabularies share one factory over fourteen tables, `legal-document` and
    -- `legal-section` are two screens over a parent and its child, and
    -- `comment.target_id` reads two tables from one screen. A permission on a
    -- table could not say which screen it meant.
    --
    -- So no foreign key can cover this column, and nothing in the database
    -- would refuse a key naming no screen. `descriptors.test.ts` asserts the
    -- stored set against ADMIN_ENTRIES, and lib/auth/permissions.ts ignores a
    -- key it does not recognise rather than trusting it: an unknown grant fails
    -- closed.
    "model_key" text NOT NULL,
    "can_view" boolean NOT NULL DEFAULT false,
    "can_add" boolean NOT NULL DEFAULT false,
    "can_change" boolean NOT NULL DEFAULT false,
    "can_delete" boolean NOT NULL DEFAULT false,
    CONSTRAINT "admin_access_account_model_key" UNIQUE ("account_id", "model_key")
);--> statement-breakpoint

CREATE TABLE "app"."account_identity" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid NOT NULL REFERENCES "app"."account"("id") ON DELETE CASCADE,
    "provider" text NOT NULL,
    "provider_uid" text NOT NULL,
    -- The provider's raw profile payload, which is where the display name and
    -- the avatar come from -- see lib/auth/profile.ts.
    "extra" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "connected_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "account_identity_provider_uid_key" UNIQUE ("provider", "provider_uid")
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Profile
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."profile" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "first_name" text NOT NULL DEFAULT '',
    "last_name" text NOT NULL DEFAULT '',
    "username" text NOT NULL,
    "aka" text NOT NULL DEFAULT '',
    "role" text NOT NULL DEFAULT '',
    "image_id" uuid REFERENCES "app"."media_asset"("id") ON DELETE SET NULL,
    "location_id" uuid REFERENCES "app"."location"("id") ON DELETE SET NULL,
    -- The residency reads separately from the city on the profile only: the
    -- home page says "Boyolali, Indonesia" while the location record carries
    -- the full regency and province pair.
    "residency" text NOT NULL DEFAULT '',
    "is_open_to_work" boolean NOT NULL DEFAULT false,
    "is_hiring" boolean NOT NULL DEFAULT false,
    "is_sick" boolean NOT NULL DEFAULT false,
    "short_description" text NOT NULL DEFAULT '',
    "short_bio" text NOT NULL DEFAULT '',
    "short_cta" text NOT NULL DEFAULT '',
    "long_description" text NOT NULL DEFAULT '',
    "stories_html" text NOT NULL DEFAULT '',
    "personal_website" text NOT NULL DEFAULT ''
);--> statement-breakpoint

CREATE TABLE "app"."profile_link" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "app"."profile"("id") ON DELETE CASCADE,
    -- Eight social_* columns, three cv_* columns and a separate donate table
    -- were three shapes for "a labelled URL belonging to the profile".
    -- `kind` keeps them apart; `platform` is the label.
    "kind" text NOT NULL,
    "platform" text NOT NULL,
    "url" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "profile_link_kind_check" CHECK ("kind" IN ('social', 'cv', 'donate')),
    CONSTRAINT "profile_link_profile_kind_platform_key" UNIQUE ("profile_id", "kind", "platform")
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Career
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."skill" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "name" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "category_id" uuid REFERENCES "app"."category"("id") ON DELETE SET NULL,
    -- Was an absolute https://ridwaanhall.com/static/svg/icon/*.svg on 78
    -- rows, which pointed development and the admin at the production site and
    -- would have 404'd for every reader the moment the domain moved.
    "icon_id" uuid REFERENCES "app"."media_asset"("id") ON DELETE SET NULL,
    -- Editorial order, for the same reason `education` carries one.
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "skill_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."profile_skill_highlight" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "app"."profile"("id") ON DELETE CASCADE,
    "skill_id" uuid NOT NULL REFERENCES "app"."skill"("id") ON DELETE CASCADE,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "profile_skill_highlight_key" UNIQUE ("profile_id", "skill_id")
);--> statement-breakpoint

CREATE TABLE "app"."experience" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "app"."organization"("id") ON DELETE RESTRICT,
    "title" text NOT NULL,
    "employment_type_id" uuid REFERENCES "app"."employment_type"("id") ON DELETE SET NULL,
    "work_mode_id" uuid REFERENCES "app"."work_mode"("id") ON DELETE SET NULL,
    "location_id" uuid REFERENCES "app"."location"("id") ON DELETE SET NULL,
    "is_current" boolean NOT NULL DEFAULT false,
    "period_start" date NOT NULL,
    "period_end" date,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."experience_task" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "experience_id" uuid NOT NULL REFERENCES "app"."experience"("id") ON DELETE CASCADE,
    "body" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."education" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "app"."organization"("id") ON DELETE RESTRICT,
    "degree" text NOT NULL,
    "alias" text NOT NULL DEFAULT '',
    "is_last" boolean NOT NULL DEFAULT false,
    "location_id" uuid REFERENCES "app"."location"("id") ON DELETE SET NULL,
    -- A free-text span like "2018 - 2021" for the rows that predate exact dates.
    "years" text NOT NULL DEFAULT '',
    "date_start" date,
    "date_end" date,
    -- Editorial order. Nothing here sorts by key: a uuid sorts by its bytes,
    -- which is to say not at all, so the sequence has to be a column.
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."education_achievement" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "education_id" uuid NOT NULL REFERENCES "app"."education"("id") ON DELETE CASCADE,
    "body" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."award" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "app"."organization"("id") ON DELETE RESTRICT,
    "title" text NOT NULL,
    "credential_url" text NOT NULL DEFAULT '',
    "description" text NOT NULL DEFAULT '',
    "issued" date NOT NULL
);--> statement-breakpoint

CREATE TABLE "app"."certification" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" uuid NOT NULL REFERENCES "app"."organization"("id") ON DELETE RESTRICT,
    "title" text NOT NULL,
    "credential_url" text NOT NULL DEFAULT '',
    "is_featured" boolean NOT NULL DEFAULT false,
    "issued" date NOT NULL
);--> statement-breakpoint

CREATE TABLE "app"."certification_achievement" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "certification_id" uuid NOT NULL REFERENCES "app"."certification"("id") ON DELETE CASCADE,
    "body" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."application" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The employer is an organization like any other, so a company that also
    -- appears as an experience or a certification issuer is one row.
    "organization_id" uuid NOT NULL REFERENCES "app"."organization"("id") ON DELETE RESTRICT,
    "title" text NOT NULL,
    "status_id" uuid REFERENCES "app"."application_status"("id") ON DELETE SET NULL,
    "employment_type_id" uuid REFERENCES "app"."employment_type"("id") ON DELETE SET NULL,
    "work_mode_id" uuid REFERENCES "app"."work_mode"("id") ON DELETE SET NULL,
    "location_id" uuid REFERENCES "app"."location"("id") ON DELETE SET NULL,
    "source_id" uuid REFERENCES "app"."application_source"("id") ON DELETE SET NULL,
    "salary_range" text NOT NULL DEFAULT '',
    "lessons_learned" text NOT NULL DEFAULT ''
);--> statement-breakpoint

CREATE TABLE "app"."application_step" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "application_id" uuid NOT NULL REFERENCES "app"."application"("id") ON DELETE CASCADE,
    "occurred_at" timestamptz,
    "title" text NOT NULL,
    "details" text NOT NULL DEFAULT '',
    "notes" text NOT NULL DEFAULT '',
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."project" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "headline" text NOT NULL DEFAULT '',
    "description_html" text NOT NULL DEFAULT '',
    "github_url" text,
    "demo_url" text,
    "category_id" uuid REFERENCES "app"."category"("id") ON DELETE SET NULL,
    "status_id" uuid REFERENCES "app"."project_status"("id") ON DELETE SET NULL,
    "is_featured" boolean NOT NULL DEFAULT false,
    "featured_priority" integer,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "project_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."project_tag" (
    "project_id" uuid NOT NULL REFERENCES "app"."project"("id") ON DELETE CASCADE,
    "tag_id" uuid NOT NULL REFERENCES "app"."tag"("id") ON DELETE CASCADE,
    "position" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("project_id", "tag_id")
);--> statement-breakpoint

CREATE TABLE "app"."project_skill" (
    "project_id" uuid NOT NULL REFERENCES "app"."project"("id") ON DELETE CASCADE,
    "skill_id" uuid NOT NULL REFERENCES "app"."skill"("id") ON DELETE CASCADE,
    "position" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("project_id", "skill_id")
);--> statement-breakpoint

CREATE TABLE "app"."project_feature" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL REFERENCES "app"."project"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."project_image" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "project_id" uuid NOT NULL REFERENCES "app"."project"("id") ON DELETE CASCADE,
    "media_id" uuid NOT NULL REFERENCES "app"."media_asset"("id") ON DELETE RESTRICT,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."blog_post" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "title" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "content_html" text NOT NULL DEFAULT '',
    "category_id" uuid REFERENCES "app"."category"("id") ON DELETE SET NULL,
    -- The byline is a name and a handle rather than an account: every post is
    -- written by the site owner, and pointing it at `account` would make the
    -- byline depend on a sign-in record that exists for a different reason.
    "author_name" text NOT NULL DEFAULT '',
    "author_username" text NOT NULL DEFAULT '',
    "author_image_id" uuid REFERENCES "app"."media_asset"("id") ON DELETE SET NULL,
    "is_featured" boolean NOT NULL DEFAULT false,
    "read_time" integer,
    "views" integer NOT NULL DEFAULT 0,
    "published_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "blog_post_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."blog_tag" (
    "post_id" uuid NOT NULL REFERENCES "app"."blog_post"("id") ON DELETE CASCADE,
    "tag_id" uuid NOT NULL REFERENCES "app"."tag"("id") ON DELETE CASCADE,
    "position" integer NOT NULL DEFAULT 0,
    PRIMARY KEY ("post_id", "tag_id")
);--> statement-breakpoint

CREATE TABLE "app"."blog_image" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "post_id" uuid NOT NULL REFERENCES "app"."blog_post"("id") ON DELETE CASCADE,
    "media_id" uuid NOT NULL REFERENCES "app"."media_asset"("id") ON DELETE RESTRICT,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Legal
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."legal_document" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "slug" text NOT NULL,
    "title" text NOT NULL,
    -- `RESTRICT`, because a type still naming a document is not spare. The
    -- column is `NOT NULL`: every legal document is one of something.
    "type_id" uuid NOT NULL REFERENCES "app"."legal_document_type"("id") ON DELETE RESTRICT,
    "summary" text NOT NULL DEFAULT '',
    "is_published" boolean NOT NULL DEFAULT true,
    "last_updated" timestamptz NOT NULL DEFAULT now(),
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "legal_document_slug_key" UNIQUE ("slug")
);--> statement-breakpoint

CREATE TABLE "app"."legal_section" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "document_id" uuid NOT NULL REFERENCES "app"."legal_document"("id") ON DELETE CASCADE,
    "parent_id" uuid REFERENCES "app"."legal_section"("id") ON DELETE CASCADE,
    "heading" text NOT NULL,
    "body" text NOT NULL DEFAULT '',
    -- Still JSONB: a legal section's bullet list is an ordered list of prose
    -- with no identity of its own, edited as one block and never referenced.
    -- Splitting it would add a table nothing joins to.
    "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- OpenHire
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."hiring_profile" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "company_name" text NOT NULL,
    "company_description" text NOT NULL DEFAULT '',
    "website" text NOT NULL DEFAULT '',
    "hiring_status" text NOT NULL DEFAULT '',
    "contact_email" text NOT NULL DEFAULT '',
    "contact_application_email" text NOT NULL DEFAULT '',
    "contact_response_time" text NOT NULL DEFAULT '',
    "contact_interview_process" text NOT NULL DEFAULT '',
    "additional_notes" text NOT NULL DEFAULT ''
);--> statement-breakpoint

CREATE TABLE "app"."hiring_list_item" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "hiring_profile_id" uuid NOT NULL REFERENCES "app"."hiring_profile"("id") ON DELETE CASCADE,
    -- Four JSONB arrays of prose on one row, each edited as a block. One
    -- child table with a `kind` beats four columns nothing can order or count.
    "kind" text NOT NULL,
    "body" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "hiring_list_item_kind_check"
        CHECK ("kind" IN ('process', 'culture', 'requirement_general', 'requirement_technical'))
);--> statement-breakpoint

CREATE TABLE "app"."job_opening" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "hiring_profile_id" uuid NOT NULL REFERENCES "app"."hiring_profile"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "employment_type_id" uuid REFERENCES "app"."employment_type"("id") ON DELETE SET NULL,
    "location_id" uuid REFERENCES "app"."location"("id") ON DELETE SET NULL,
    "salary_range" text NOT NULL DEFAULT '',
    "experience_required" text NOT NULL DEFAULT '',
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

CREATE TABLE "app"."job_opening_list_item" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "job_opening_id" uuid NOT NULL REFERENCES "app"."job_opening"("id") ON DELETE CASCADE,
    "kind" text NOT NULL,
    "body" text NOT NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "job_opening_list_item_kind_check"
        CHECK ("kind" IN ('skill', 'responsibility', 'benefit'))
);--> statement-breakpoint

CREATE TABLE "app"."open_to_work_profile" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Six answers from six closed sets. Nullable, and `SET NULL` on delete:
    -- these were `text NOT NULL DEFAULT ''`, so "not answered yet" is a state
    -- the profile is allowed to be in and the read path renders as empty.
    "status_id" uuid REFERENCES "app"."open_to_work_status"("id") ON DELETE SET NULL,
    "availability_id" uuid REFERENCES "app"."availability"("id") ON DELETE SET NULL,
    "experience_level_id" uuid REFERENCES "app"."experience_level"("id") ON DELETE SET NULL,
    "notice_period_id" uuid REFERENCES "app"."notice_period"("id") ON DELETE SET NULL,
    "work_authorization_id" uuid REFERENCES "app"."work_authorization"("id") ON DELETE SET NULL,
    "contact_preference_id" uuid REFERENCES "app"."contact_preference"("id") ON DELETE SET NULL,
    "remote" boolean NOT NULL DEFAULT false,
    "relocation" boolean NOT NULL DEFAULT false,
    "show_all_tools_skills" boolean NOT NULL DEFAULT false,
    -- Prose, not a vocabulary: a range, a sentence about when, and free notes.
    "salary_expectation" text NOT NULL DEFAULT '',
    "interview_availability" text NOT NULL DEFAULT '',
    "additional_notes" text NOT NULL DEFAULT ''
);--> statement-breakpoint

CREATE TABLE "app"."open_to_work_list_item" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "open_to_work_profile_id" uuid NOT NULL
        REFERENCES "app"."open_to_work_profile"("id") ON DELETE CASCADE,
    -- Seven JSONB arrays on one row became one child table. `preferred_location`
    -- and `remote_location` carry a `location_id` where the string matched a
    -- known place, and the text either way so nothing is lost.
    "kind" text NOT NULL,
    "body" text NOT NULL,
    "location_id" uuid REFERENCES "app"."location"("id") ON DELETE SET NULL,
    "position" integer NOT NULL DEFAULT 0,
    CONSTRAINT "open_to_work_list_item_kind_check"
        CHECK ("kind" IN ('employment_type', 'preferred_role', 'skill_highlight',
                          'language', 'preferred_location', 'work_mode', 'remote_location'))
);--> statement-breakpoint

CREATE TABLE "app"."portfolio_highlight" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "open_to_work_profile_id" uuid NOT NULL
        REFERENCES "app"."open_to_work_profile"("id") ON DELETE CASCADE,
    "title" text NOT NULL,
    "description" text NOT NULL DEFAULT '',
    "position" integer NOT NULL DEFAULT 0
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Community
-- ---------------------------------------------------------------------------

CREATE TABLE "app"."guest_profile" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid NOT NULL REFERENCES "app"."account"("id") ON DELETE CASCADE,
    "is_author" boolean NOT NULL DEFAULT false,
    "is_co_author" boolean NOT NULL DEFAULT false,
    "co_author_order" integer NOT NULL DEFAULT 0,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "guest_profile_account_key" UNIQUE ("account_id")
);--> statement-breakpoint

CREATE TABLE "app"."guest_message" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid NOT NULL REFERENCES "app"."account"("id") ON DELETE CASCADE,
    "body" text NOT NULL,
    "posted_at" timestamptz NOT NULL DEFAULT now(),
    "reply_to_id" uuid REFERENCES "app"."guest_message"("id") ON DELETE CASCADE,
    "is_pinned" boolean NOT NULL DEFAULT false,
    "pinned_at" timestamptz
);--> statement-breakpoint

CREATE TABLE "app"."comment" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "account_id" uuid NOT NULL REFERENCES "app"."account"("id") ON DELETE CASCADE,
    -- The target is named directly rather than through a generic reference into
    -- a table of every model in the project: there are exactly two things a
    -- comment can be attached to, and a join on every read bought nothing.
    "target_kind" text NOT NULL,
    "target_id" uuid NOT NULL,
    "body" text NOT NULL,
    "is_deleted" boolean NOT NULL DEFAULT false,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "reply_to_id" uuid REFERENCES "app"."comment"("id") ON DELETE CASCADE,
    CONSTRAINT "comment_target_kind_check" CHECK ("target_kind" IN ('blog_post', 'project'))
);--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Indexes on the columns the site actually filters and orders by
-- ---------------------------------------------------------------------------

CREATE INDEX "project_status_featured_idx" ON "app"."project" ("status_id", "is_featured");--> statement-breakpoint
CREATE INDEX "project_created_idx" ON "app"."project" ("created_at" DESC);--> statement-breakpoint
CREATE INDEX "blog_post_published_idx" ON "app"."blog_post" ("published_at" DESC);--> statement-breakpoint
CREATE INDEX "blog_post_featured_idx" ON "app"."blog_post" ("is_featured");--> statement-breakpoint
CREATE INDEX "guest_message_posted_idx" ON "app"."guest_message" ("posted_at" DESC);--> statement-breakpoint
CREATE INDEX "guest_message_pinned_idx" ON "app"."guest_message" ("is_pinned", "pinned_at" DESC);--> statement-breakpoint
CREATE INDEX "comment_target_idx" ON "app"."comment" ("target_kind", "target_id", "created_at");--> statement-breakpoint
CREATE INDEX "experience_position_idx" ON "app"."experience" ("position");--> statement-breakpoint
CREATE INDEX "application_status_idx" ON "app"."application" ("status_id");--> statement-breakpoint
-- Every request by a staff account reads that account's whole grant set, so
-- this is the one lookup on the table that happens on every admin page.
CREATE INDEX "admin_access_account_idx" ON "app"."admin_access" ("account_id");--> statement-breakpoint

-- ---------------------------------------------------------------------------
-- Row Level Security, on every table, with no policies
-- ---------------------------------------------------------------------------
--
-- Supabase serves a PostgREST API over the schemas it is configured to expose,
-- to anyone holding the project's anon key and independently of this
-- application. `account` and `account_identity` are exactly the tables that
-- must never be readable that way. Enabled with no policies at all, which is
-- the intended state: the role this application connects as has
-- `rolbypassrls`, so its own queries are unaffected, and everything else is
-- refused by default rather than by a rule somebody has to get right.
--
-- Whether `app` is reachable through PostgREST is a project setting somebody
-- can change in a dashboard. This is what makes that change survivable.
-- `scripts/check-rls.mjs` fails if any table here ever appears without it.

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
