import "server-only";

/**
 * Supabase Storage, over its own object REST API.
 *
 * A port of `apps/core/storage.py`'s `SupabaseStorage`, which talks to Supabase
 * directly rather than through the S3-compatible layer -- there it avoided
 * pulling django-storages and boto3 into a Lambda with a 15mb cap; here `fetch`
 * is already there and an SDK would buy nothing.
 *
 * **The budget is on the whole upload, not on each attempt.** This is the
 * mistake that produced a live 504: a 30s per-attempt timeout with three
 * attempts and 1.5s/3.0s backoff came to 94.5s, past Cloudflare's 100s origin
 * timeout, so a struggling upload returned a gateway error rather than either
 * saving or failing cleanly. `_TOTAL_BUDGET` caps the lot, each attempt's
 * timeout is clamped to what is left, and a backoff that would overrun the
 * deadline is skipped rather than slept through.
 *
 * One thing is better here than in the original. Python's `requests` treats
 * `timeout=` as the gap allowed *between socket reads*, so a slow-but-
 * progressing upload was never bounded by it at all -- only the total budget
 * saved it. `AbortSignal.timeout()` is a deadline for the whole call, so both
 * limits are real.
 *
 * The service-role key is read here and never leaves the server; this module is
 * `server-only` for that reason as much as for the `fetch` it does.
 */

const SUPABASE_URL = (process.env.STORAGE_SUPABASE_URL ?? "").replace(/\/+$/, "");
const SERVICE_ROLE_KEY = process.env.STORAGE_SUPABASE_SERVICE_ROLE_KEY ?? "";
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "media";

const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const TOTAL_BUDGET_MS = 25_000;

/**
 * Deliberately shorter than the cleanup budget: a cascade issues one delete per
 * row, so no single one may consume the whole allowance.
 */
const DELETE_TIMEOUT_MS = 5_000;

/**
 * Retrying these can plausibly succeed. Anything else -- a bad key, a malformed
 * request, an object too large -- fails identically every time, so retrying only
 * spends the budget the retryable cases need.
 */
function isRetryable(status: number): boolean {
  return status === 408 || status === 429 || (status >= 500 && status < 600);
}

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${SERVICE_ROLE_KEY}`, apikey: SERVICE_ROLE_KEY };
}

/** Python's `urllib.parse.quote(s, safe="/")`, as `mediaUrl` already does it. */
function quote(value: string): string {
  return value.replace(/[^A-Za-z0-9_.\-~/]/g, (char) =>
    Array.from(new TextEncoder().encode(char))
      .map((byte) => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`)
      .join(""),
  );
}

function objectUrl(key: string): string {
  return `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${quote(key)}`;
}

export class StorageError extends Error {}

/**
 * Put bytes at a key, replacing whatever is there.
 *
 * `x-upsert: true` matches the original and is what makes the naming in
 * `lib/storage/keys.ts` safe: a key is derived from the content, so a re-upload
 * of the same bytes writes the same bytes to the same place.
 */
export async function putObject(
  key: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<void> {
  if (!storageConfigured()) throw new StorageError("Supabase Storage is not configured.");

  const deadline = Date.now() + TOTAL_BUDGET_MS;
  let attempts = 0;
  let detail = `no attempt completed within ${TOTAL_BUDGET_MS / 1000}s`;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    attempts++;

    let response: Response;
    try {
      response = await fetch(objectUrl(key), {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": contentType, "x-upsert": "true" },
        body: bytes as BodyInit,
        signal: AbortSignal.timeout(Math.min(TIMEOUT_MS, remaining)),
      });
    } catch (error) {
      // A timeout or a dropped connection. Both are worth another attempt for
      // the same reason a 503 is, so they take the same path.
      detail = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_ATTEMPTS - 1 && !overrunsDeadline(attempt, deadline)) {
        await sleep(backoffMs(attempt));
        continue;
      }
      break;
    }

    if (response.ok) return;

    detail = `${response.status} ${(await response.text()).slice(0, 200)}`;
    if (!isRetryable(response.status)) break;
    if (attempt < MAX_ATTEMPTS - 1 && !overrunsDeadline(attempt, deadline)) {
      await sleep(backoffMs(attempt));
    }
  }

  throw new StorageError(
    `Could not upload "${key}" after ${attempts} attempt(s): ${detail}`,
  );
}

const backoffMs = (attempt: number) => 1500 * (attempt + 1);

/** Sleeping past the deadline would only delay the failure. */
const overrunsDeadline = (attempt: number, deadline: number) =>
  Date.now() + backoffMs(attempt) >= deadline;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Remove an object. A key that is not there is not an error.
 *
 * **Supabase reports a missing object as HTTP 400**, with a body of
 * `{"statusCode": "404", "code": "NoSuchKey"}` -- not a plain 404 -- so the
 * status alone cannot identify it and the body has to be read.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!storageConfigured()) throw new StorageError("Supabase Storage is not configured.");

  const response = await fetch(objectUrl(key), {
    method: "DELETE",
    headers: authHeaders(),
    signal: AbortSignal.timeout(DELETE_TIMEOUT_MS),
  });

  if (response.ok) return;

  const body = await response.text();
  if (isMissing(response.status, body)) return;

  throw new StorageError(`Could not delete "${key}": ${response.status} ${body.slice(0, 200)}`);
}

function isMissing(status: number, body: string): boolean {
  if (status === 404) return true;
  if (status !== 400) return false;
  try {
    const parsed = JSON.parse(body) as { statusCode?: unknown; code?: unknown };
    return String(parsed.statusCode) === "404" || parsed.code === "NoSuchKey";
  } catch {
    return false;
  }
}

/**
 * Is there an object at this key?
 *
 * Through the authenticated endpoint rather than the public URL. The public one
 * is CDN-fronted and will answer for an object that has just been deleted, or
 * miss one that has just been written -- neither of which is what a caller
 * asking "is it there" wants to hear.
 */
export async function objectExists(key: string): Promise<boolean> {
  if (!storageConfigured()) return false;
  const response = await fetch(objectUrl(key), {
    method: "HEAD",
    headers: authHeaders(),
    signal: AbortSignal.timeout(DELETE_TIMEOUT_MS),
  });
  return response.ok;
}
