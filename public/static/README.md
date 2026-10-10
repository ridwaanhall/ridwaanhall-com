# What is in `/static/`

Three things use this directory, and none of them is a database row any more.

- **`img/ridwaanhall.webp`** is the share image a page falls back to when it has
  none of its own (`DEFAULT_IMAGE` in `lib/seo/config.ts`), served at
  `https://ridwaanhall.com/static/img/ridwaanhall.webp`. Moving it breaks every
  link preview that relies on the fallback.
- **`svg/icon/`** holds the skill icons as files, and the site does not serve
  them from here. `scripts/migrate-icons-to-storage.mjs` uploaded them to
  Supabase Storage and repointed each skill's `icon_id`, and every
  `media_asset` now has `source: "storage"`. The directory is what that script
  re-seeds from if somebody unlinks an icon, so its path is written into the
  script.
- **The `static` source** is still understood. `media_asset.source` may say
  `static`, which makes the key a path under `public/` served from here
  (`assetUrl` in `lib/storage/media.ts`); nothing uses it today.

No column in the `app` schema holds a `/static/` address: a scan of every text
and `jsonb` column found none. `app/robots.ts` disallows `/static/`, so none of
this is crawled in its own right.
