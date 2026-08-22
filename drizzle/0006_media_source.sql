-- Where a media asset actually lives.
--
-- Two kinds of image feed this site and they are not the same thing:
--
--   storage  an object in the Supabase bucket, uploaded through the admin,
--            named after its contents by lib/storage/keys.ts. Photos, logos.
--   static   a file bundled under public/ and served by the app itself. The
--            78 skill icons are these -- vector, tiny, cached with the
--            deployment. They were stored as absolute
--            https://ridwaanhall.com/static/... URLs, which pointed the admin
--            and development at the production site and would have broken all
--            78 the moment the domain moved.
--
-- Modelling them as one table with a discriminator rather than two columns on
-- `skill` means one resolver turns either into a URL, and the admin renders
-- both the same way. `storage_key` is the bucket key for one and the public
-- path for the other.

ALTER TABLE "app"."media_asset"
    ADD COLUMN "source" text NOT NULL DEFAULT 'storage';--> statement-breakpoint
ALTER TABLE "app"."media_asset"
    ADD CONSTRAINT "media_asset_source_check" CHECK ("source" IN ('storage', 'static'));
