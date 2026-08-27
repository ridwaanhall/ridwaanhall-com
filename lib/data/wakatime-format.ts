/**
 * Shared vocabulary for the two WakaTime read paths.
 *
 * `wakatime.ts` fetches the last seven days and `wakatime-year.ts` the last
 * year; they are separate fetches with separate cache lifetimes and separate
 * failure domains, and the only thing they have in common is how a duration, a
 * token count and a date are written down. That belongs here rather than in
 * either of them -- a formatter imported from the seven-day module would drag
 * its fetch logic along behind it.
 *
 * Everything in this file is pure, which is what lets `npm test` cover it
 * offline. The rules below look obvious and several of them are not: see the
 * notes on locale and on the token compactor.
 */

export const BASE = "https://wakatime.com/api/v1";
export const TIMEZONE = "Asia/Jakarta";

/** Today in Asia/Jakarta as `YYYY-MM-DD`, which is what the API's range expects. */
export function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

export function daysAgo(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** "2 hours 5 minutes", "45 minutes", "30 secs", "0 mins". */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0 mins";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const hourStr = hours > 0 ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "";
  const minuteStr = minutes > 0 ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : "";

  if (hours > 0 && minutes > 0) return `${hourStr} ${minuteStr}`;
  if (hours > 0) return hourStr;
  if (minutes > 0) return minuteStr;
  if (seconds > 0) return `${Math.floor(seconds)} secs`;
  return "0 mins";
}

/**
 * "2h 42m", "46m", "0m".
 *
 * `formatTime` writes a duration the way a sentence would, which is right for a
 * card and wrong for a chart axis: "2 hours 42 minutes" wraps to three lines in
 * a 56px gutter and lands on top of the panel title above it. This is the same
 * duration with the words taken out.
 */
export function shortTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0m";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "0m";
}

/**
 * "2.0B", "3.7M", "176".
 *
 * Token counts run to ten digits, which is unreadable in a stat card and wraps
 * on a phone. The exact figure goes in the card's tooltip instead.
 */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "0";
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return String(Math.round(value));
}

/*
 * Both of these pin `en-US` rather than taking the runtime's locale. A server
 * whose locale is `id-ID` -- which is this project's own machine -- groups
 * thousands with dots, so 12,096,512 renders as 12.096.512 and reads as a
 * decimal to everybody else. The site's copy is English; its numbers should be.
 */
export const count = (value: number) => Math.round(value).toLocaleString("en-US");

export const usd = (value: number, decimals: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

/** "August 20, 2026", in Jakarta time -- the clock the coding hours were kept on. */
export function longDateJakarta(iso: string | undefined | null): string {
  if (!iso) return "N/A";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * A share of a whole, to two decimals, safe at a zero total.
 *
 * Every breakdown on the dashboard computes this, and a `/ 0` reaching the page
 * renders as "NaN%" rather than as the "no data yet" it actually means.
 */
export function share(part: number, whole: number): number {
  if (!(whole > 0)) return 0;
  return Math.round((part / whole) * 10000) / 100;
}
