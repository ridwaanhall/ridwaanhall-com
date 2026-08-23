/**
 * Shared formatting helpers.
 *
 * Dates on this site are month-precision editorial dates, so the rendered shape
 * is a `{month, year}` pair and its ISO counterpart. The page components and the
 * JSON-LD both read them, which is why they are defined once.
 */

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

export type MonthYear = { month: string; year: number };

/**
 * A stored date as the `{ month: "Jan", year: 2024 }` pair templates expect.
 *
 * The column is a Postgres `date`, which the driver hands back as a plain
 * "YYYY-MM-DD" string. It is parsed by splitting rather than with `new Date()`
 * on purpose: `new Date("2024-01-01")` is parsed as UTC midnight and then read
 * back in local time, which in any timezone west of UTC silently reports
 * December 2023. Every date on this site is month-precision, so there is
 * nothing a Date object would add.
 */
export function monthYear(value: string | Date | null | undefined): MonthYear | null {
  const parts = dateParts(value);
  if (!parts) return null;
  return { month: MONTHS[parts.month - 1], year: parts.year };
}

/** ISO 8601 year-month, for schema.org date properties. "" when absent. */
export function isoMonth(value: string | Date | null | undefined): string {
  const parts = dateParts(value);
  if (!parts) return "";
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}`;
}

function dateParts(value: string | Date | null | undefined): { year: number; month: number } | null {
  if (!value) return null;
  if (value instanceof Date) {
    return { year: value.getUTCFullYear(), month: value.getUTCMonth() + 1 };
  }
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

/**
 * Is the site owner within working hours? Weekdays 15:00–19:59, Asia/Jakarta.
 *
 * This is the one value that must never be cached -- it is derived from the
 * current clock, so a cached copy would freeze the availability indicator.
 * Callers apply it *on top of* the cached about payload.
 */
export function isWorkingHours(now: Date = new Date()): boolean {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    hour: "numeric",
    // hourCycle rather than hour12:false -- the latter renders midnight as
    // "24" under some ICU versions, which would read as hour 24 here.
    hourCycle: "h23",
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? -1);
  const isWeekday = ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(weekday);

  return isWeekday && hour >= 15 && hour < 20;
}
