/**
 * When a statically served dashboard copy is too old to show.
 *
 * The panels are cached reads stamped with the moment they were fetched, so a
 * CDN that hands back an old page carries an old stamp and the client can tell.
 * Plain module on purpose: the server and the client guard both import it, and a
 * constant exported from a client file arrives on the server as a reference.
 */

/** Matches the dashboard reads' `expire` of 1800 seconds, so a normal window never triggers a refresh. */
export const FRESH_MAX_AGE_MS = 30 * 60_000;

/** Wait before each refresh attempt; its length is the attempt limit. */
export const FRESH_RETRY_DELAYS_MS = [0, 5_000, 15_000];

/** The calendar date in Asia/Jakarta, the site's one timezone, for any instant. */
function jakartaDay(at: number): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date(at));
}

/**
 * True when `fetchedAt` is older than `maxAgeMs`, or from a different Jakarta
 * day than `now`: "today" is the one panel that is wrong the minute the date
 * turns, however young the copy. A stamp in the future (clock skew) is fresh.
 */
export function isStale(fetchedAt: number, now: number, maxAgeMs: number = FRESH_MAX_AGE_MS): boolean {
  if (fetchedAt > now) return false;
  if (now - fetchedAt > maxAgeMs) return true;
  return jakartaDay(fetchedAt) !== jakartaDay(now);
}
