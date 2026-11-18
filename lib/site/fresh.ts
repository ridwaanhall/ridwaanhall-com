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

/** The site's own timezone, used when the account's is unknown or unusable. */
export const FRESH_DEFAULT_ZONE = "Asia/Jakarta";

/**
 * The calendar date in `timeZone` for any instant. The formatter is built per
 * call: the zone arrives as a prop from the wire, and an unknown name makes
 * Intl throw a RangeError, which must not take the page down. Fall back to the
 * default zone instead, as if none had been given.
 */
function zoneDay(at: number, timeZone: string): string {
  let format: Intl.DateTimeFormat;
  try {
    format = new Intl.DateTimeFormat("en-CA", { timeZone });
  } catch {
    format = new Intl.DateTimeFormat("en-CA", { timeZone: FRESH_DEFAULT_ZONE });
  }
  return format.format(new Date(at));
}

/**
 * True when `fetchedAt` is older than `maxAgeMs`, or from a different calendar
 * day than `now` in `timeZone` (the account's zone): "today" is the one panel
 * that is wrong the minute the date turns, however young the copy. A stamp in
 * the future (clock skew) is fresh.
 */
export function isStale(
  fetchedAt: number,
  now: number,
  timeZone: string = FRESH_DEFAULT_ZONE,
  maxAgeMs: number = FRESH_MAX_AGE_MS,
): boolean {
  if (fetchedAt > now) return false;
  if (now - fetchedAt > maxAgeMs) return true;
  return zoneDay(fetchedAt, timeZone) !== zoneDay(now, timeZone);
}
