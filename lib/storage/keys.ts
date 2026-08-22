import { createHash } from "node:crypto";

/**
 * What an uploaded file is called in the bucket.
 *
 * Django derived the key from the uploaded filename and kept it *deterministic*
 * -- `get_available_name` was overridden to skip the exists-check-and-rename
 * loop, because the importer that wrote these files already deduplicated by its
 * own cache and wanted stable names. That left one sharp edge, recorded in
 * `CLAUDE.md`: re-uploading under a name that already exists is an in-place
 * replace, and Supabase's read path is CDN-fronted, so the old bytes can be
 * served for a while afterwards. The advice was to pick a new filename by hand
 * when the change had to be visible.
 *
 * **The key carries a digest of the content, which removes that edge rather
 * than documenting it.** Same bytes, same key -- so a re-upload is a no-op and
 * a stale CDN copy is byte-identical to the fresh one. Different bytes, different
 * key -- a new object, and a freshly-created key is immediately consistent. The
 * case that used to bite cannot arise.
 *
 * It also makes uploads idempotent, which matters for a retry: the second
 * attempt of an upload that may or may not have landed writes to the same place.
 */

/** The `upload_to` of each `ImageField`, kept exactly as Django had it. */
export const UPLOAD_PREFIXES = {
  profile: "profile/",
  logo: "logo/",
  blog: "blog/",
  project: "project/",
  // Skill icons. The 74 that exist are bundled SVGs under `public/` and are
  // never uploaded; this is where a replacement would go.
  icon: "icon/",
} as const;

export type UploadPrefix = keyof typeof UPLOAD_PREFIXES;

/**
 * `varchar(100)` on every one of the five columns that holds a key, so the name
 * has to fit -- the longest in the database today is 66 characters. The budget
 * below leaves room for the prefix, the digest, the separator and the extension.
 */
export const MAX_KEY_LENGTH = 100;

const DIGEST_LENGTH = 8;

/**
 * Extensions this accepts, and the content type each one is stored as.
 *
 * An allowlist rather than a check for "image/*": the value ends up as the
 * `Content-Type` Supabase serves the object with, and letting the browser's
 * claim through unchecked would let an upload be served as `text/html` from the
 * site's own storage host.
 */
export const IMAGE_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

/** Django's `slugify`, applied to the filename rather than to a title. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

export type KeyProblem = { ok: false; error: string };
export type KeyResult = { ok: true; key: string; contentType: string } | KeyProblem;

/**
 * Build the key for an upload, or say why the file is not acceptable.
 *
 * The extension decides the stored content type, and an unknown one is refused
 * outright -- SVG is allowed because 78 skill icons in the database are SVGs, and
 * it is served from a storage host rather than the site's own origin.
 */
export function objectKeyFor(
  prefix: UploadPrefix,
  filename: string,
  bytes: Uint8Array,
): KeyResult {
  const extension = extensionOf(filename);
  const contentType = IMAGE_TYPES[extension];
  if (!contentType) {
    return {
      ok: false,
      error: `${extension || "That file"} is not an image type this accepts (${Object.keys(IMAGE_TYPES).join(", ")}).`,
    };
  }

  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, DIGEST_LENGTH);
  const folder = UPLOAD_PREFIXES[prefix];
  const room = MAX_KEY_LENGTH - folder.length - DIGEST_LENGTH - 1 - extension.length;

  const stem = slugify(filename.slice(0, filename.length - extension.length)) || "image";
  return {
    ok: true,
    key: `${folder}${stem.slice(0, Math.max(1, room))}-${digest}${extension}`,
    contentType,
  };
}
