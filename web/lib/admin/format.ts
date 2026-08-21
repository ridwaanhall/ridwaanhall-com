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
