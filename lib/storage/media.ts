/**
 * URL for an uploaded file, from the value stored in an `ImageField` column.
 *
 * The column stores a bucket-relative key ("blog/foo.webp") and the URL is
 * derived from it here. These URLs are indexed, embedded in JSON-LD and cached
 * by the CDN, so a difference of one character is a broken image rather than a
 * cosmetic change.
 *
 * Returns "" for an empty column, matching `AboutManager._image_url`, so
 * callers keep their existing falsy checks.
 */
const SUPABASE_URL = (process.env.STORAGE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

/**
 * Percent-encode everything except `/`.
 *
 * Deliberately not `encodeURI`, which leaves `;,?:@&=+$!*'()#` unescaped — all
 * of which are legal in a storage key and none of which survive a URL intact.
 * Every key currently in the database is already URL-safe, so this only matters
 * for whatever gets uploaded next; getting it right now is cheaper than
 * debugging one broken image later.
 */
function quote(value: string): string {
  return value.replace(/[^A-Za-z0-9_.\-~/]/g, (char) =>
    Array.from(new TextEncoder().encode(char))
      .map((byte) => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`)
      .join(""),
  );
}

export function mediaUrl(key: string | null | undefined): string {
  if (!key) return "";
  // Already absolute — OAuth avatars are stored as full URLs.
  if (/^https?:\/\//i.test(key)) return key;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${quote(key)}`;
}

/**
 * The URL for a `media_asset` row, whichever kind of asset it is.
 *
 * Two things feed images into this site and they are not the same:
 *
 *   storage  an object in the Supabase bucket, uploaded through the admin.
 *   static   a file bundled under `public/` and served by the app. The 78 skill
 *            icons are these, and they used to be stored as absolute
 *            `https://ridwaanhall.com/static/...` URLs -- which pointed
 *            development and the admin at the production site, and would have
 *            broken every one of them the moment the domain moved.
 *
 * A static asset keeps a site-relative path on purpose. It is served from the
 * same origin as whatever is asking, so it is correct in development, in the
 * admin and in production without anything having to know which of those it is.
 */
export function assetUrl(
  asset: { storageKey: string; source: string } | null | undefined,
): string {
  if (!asset?.storageKey) return "";
  if (asset.source === "static") {
    return asset.storageKey.startsWith("/") ? asset.storageKey : `/${asset.storageKey}`;
  }
  return mediaUrl(asset.storageKey);
}
