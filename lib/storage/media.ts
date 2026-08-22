/**
 * URL for an uploaded file, from the value stored in an `ImageField` column.
 *
 * Django stores a bucket-relative key ("blog/foo.webp") and derives the URL in
 * `SupabaseStorage.url()`. Reproduced here exactly: these URLs are already
 * indexed, already embedded in JSON-LD, and already cached by the CDN, so a
 * difference of one character is a broken image, not a cosmetic change.
 *
 * Returns "" for an empty column, matching `AboutManager._image_url`, so
 * callers keep their existing falsy checks.
 */
const SUPABASE_URL = (process.env.STORAGE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

/**
 * Python's `urllib.parse.quote(s, safe="/")`, which is what Django calls.
 *
 * Deliberately not `encodeURI`, which leaves `;,?:@&=+$!*'()#` unescaped —
 * Python escapes all of those. Every key currently in the database is already
 * URL-safe, so this only matters for whatever gets uploaded next; getting it
 * right now is cheaper than debugging one broken image later.
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
