/**
 * Display formatting shared by the page components.
 *
 * One place each, so a date reads the same wherever it appears. A component
 * that formats inline is a component that drifts.
 */

/**
 * "January 23, 2026".
 *
 * Formatted in UTC rather than the viewer's timezone. The dates are editorial
 * (a post's publication day), and rendering them locally would put a post
 * published at 00:30 Jakarta on the previous day for a reader in London -- and,
 * worse, produce different HTML on the server and the client, which React
 * reports as a hydration mismatch.
 */
export function longDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** ISO 8601, for a `<time datetime=…>` attribute. */
export function isoDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString();
}

/**
 * A URL-safe slug.
 *
 * Used on blog tags, which render as `#commit-style` rather than
 * `#Commit Style`: lowercase, strip anything that is not a word character,
 * whitespace or hyphen, then collapse runs of whitespace and hyphens into a
 * single hyphen.
 */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "-");
}

/**
 * "8:55 PM WIB, Fri January 23, 2026".
 *
 * Rendered in Asia/Jakarta rather than the viewer's timezone. The site has one
 * author in one place, the abbreviation is printed alongside, and a
 * viewer-local rendering would differ between server and client and be reported
 * as a hydration mismatch.
 */
export function longDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("hour")}:${get("minute")} ${get("dayPeriod")} WIB, ${get("weekday")} ${get("month")} ${get("day")}, ${get("year")}`;
}
