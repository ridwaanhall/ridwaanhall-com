# Uploaded media

Guidance for working in `lib/storage/`. The root `CLAUDE.md` covers everything that applies everywhere.

## Other things worth knowing here

- **Uploaded files are named after their contents**, and are reference-counted
  on delete. One author photo is named by twenty-one rows; deleting because one
  row stopped naming it would break the others. The key lives on `media_asset`
  and everything else points at it with a foreign key, so the count is over
  those eight columns — `lib/storage/cleanup.ts` lists them and
  `scripts/check-storage.mjs` proves the list against the catalogue.
- **A form works in storage keys; the schema works in asset ids.** A column like
  `project_image.media_id` names a `media_asset` row, because one file is named
  by many records and repeating the string in each is what reference counting
  exists to avoid. `lib/admin/media.ts` is the one place that converts, and
  **nothing in the type system says a caller went through it** — both sides are
  `string`, so handing a uuid to something expecting a key type checks, builds,
  lints and renders. It renders wrongly: the admin asked the bucket for
  `.../media/<uuid>` and Supabase answered `NoSuchKey`, so every blog and project
  gallery previewed broken. Only the record's own fields were converted; its
  inline rows were not, in all four directions — the preview, the staleness
  comparison, the cleanup list, and the write, where a key going into a uuid
  column raises `22P02`. **Cross that seam through `lib/admin/media.ts`, never by
  passing the column value along.**
- **A storage key does not say where the file is served from.**
  `media_asset.source` does: `storage` is an object in the bucket, `static` is a
  path under `public/`. `assetUrl` is the single thing that knows which, and
  `mediaUrl` alone sends a static key to the bucket, which is how all 78 icon
  previews once became `NoSuchKey`.
  Every asset is `storage` today — the 74 skill icons were the last `static`
  ones and `scripts/migrate-icons-to-storage.mjs` moved them — but the column
  still permits either, and the branch is what keeps the next `static` asset
  from repeating that bug. **Never assume the source; read it.**
  `scripts/check-admin-media.mjs` proves both halves: every image a form renders
  is a key, and every URL it builds resolves.
  The icons stay in `public/static/svg/icon/` as the source to re-seed from.
  That matters because `skill.iconId` is one of the columns
  `lib/storage/cleanup.ts` counts references over: unlinking the last skill that
  names an icon now deletes the object and its row for good, where before the
  delete aimed at a path that had never been in the bucket.
- **An image field takes bytes from two places, and only one of them is a
  file.** Beside the upload there is a box for a link, and the link is a
  *source* of bytes rather than a place the site points at: `saveRecord` fetches
  it, `lib/storage/link.ts` decides whether what came back is acceptable, and
  the bytes are then stored under the same content-addressed key an upload gets.
  So a linked image and an uploaded one are the same thing by the time anything
  renders either — one `media_asset` row with `source: "storage"`, one entry in
  the reference count, one URL.
  **That is the whole reason the URL is not stored.** Rendering a foreign host
  would need `images.remotePatterns` in `next.config.ts` opened to arbitrary
  hostnames, which makes `/_next/image` an open image proxy for anyone who finds
  it, and the CSP's `img-src` widened to all of `https:` — and every image on
  the site would then depend on somebody else's server staying up and permitting
  hotlinks.
  Three things the fetch must keep doing, none of them visible to `tsc`:
  the hostname is **resolved and checked against the private ranges**, on every
  redirect hop, because a link is otherwise a way to make this server issue
  requests inside its own network; the body is **capped while it streams**,
  since a limit applied to a finished response is a report on memory already
  spent; and the type is **read from the bytes, never from `Content-Type`**,
  because that header is what Supabase then serves the object with, so
  believing it stores a page of HTML and serves it as an image.
  The rules are pure and tested offline in `lib/storage/link.test.ts` and
  `lib/admin/image-source.test.ts`; `scripts/check-admin-image-link.mjs` drives
  the rest against the live bucket.
