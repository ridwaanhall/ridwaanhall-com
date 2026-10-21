/**
 * Compact date rendering for the changelist.
 *
 * Deliberately not `lib/utils/format.ts`'s `longDate` / `longDateTime`. Those
 * are the public site's editorial formats -- "January 23, 2026" and
 * "2:05 PM WIB, Fri January 23, 2026" -- which are right in an article byline
 * and wrong in a column beside twenty-four others. This is `YYYY-MM-DD`, which
 * is unambiguous, aligns in a column, and reads in the same order as the sort
 * it usually sits under.
 *
 * Jakarta, not UTC: the admin has one audience, in one timezone, and a row
 * created at 06:30 WIB should not show yesterday's date to them. The public
 * site formats in UTC instead, because that has to render identically on a
 * server and in an arbitrary reader's browser.
 */
const JAKARTA = "Asia/Jakarta";

export function adminDate(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: JAKARTA }).format(date);
}

export function adminDateTime(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${adminDate(date)} ${time}`;
}

/**
 * A stored instant as a `datetime-local` control's value, in Jakarta.
 *
 * The control has no zone of its own, so whoever renders it decides one. It
 * used to be the *runtime's*: the server rendered the form in UTC, the browser
 * re-rendered it in the reader's zone, and `parseFormValues` read the posted
 * text back in the server's. From Jakarta against a UTC deployment every
 * timestamp moved seven hours on the first save that touched its record,
 * including the saves where nothing was edited. Pinning both directions to the
 * admin's one zone makes the round trip exact wherever either half runs.
 */
export function toAdminLocalInput(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: JAKARTA,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${adminDate(date)}T${time}`;
}

/**
 * The control's value back as an ISO instant, read as Jakarta time.
 *
 * Asia/Jakarta has kept +07:00 without daylight saving since 1964, so the
 * offset is a constant rather than a lookup. A value that already names its
 * zone (`Z`, `+07:00`) is taken at its word.
 */
export function fromAdminLocalInput(text: string): string | null {
  const zoned = /(Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const naive = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(text);
  const when = new Date(naive && !zoned ? `${text}+07:00` : text);
  return Number.isNaN(when.getTime()) ? null : when.toISOString();
}
