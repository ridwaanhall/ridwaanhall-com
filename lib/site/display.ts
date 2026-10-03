/**
 * Display rules for the public site: how a stored value reads on the page.
 *
 * Pure and server-safe, so pages, components and tests share one answer.
 * None of these change what is stored -- each one decides how a value that is
 * already there is shown, which is why they live beside the components rather
 * than in `lib/data`.
 */

import type { AboutData } from "@/lib/data/about";

/** Words a slug lowercases that are never written that way. */
const ACRONYMS: Record<string, string> = { api: "API", saas: "SaaS", ai: "AI", ml: "ML" };

/**
 * A vocabulary label as a reader should see it.
 *
 * Project categories were entered over time in two styles -- `Web App` beside
 * `web-development` -- and the label is editorial, so it is the admin's to
 * reword. Until somebody does, a label that is plainly a slug (lowercase,
 * hyphenated, no spaces) is shown title-cased; anything already written as a
 * label is left exactly as written.
 */
export function displayLabel(label: string | null | undefined): string {
  const value = (label ?? "").trim();
  if (!value) return "";
  if (/\s/.test(value) || /[A-Z]/.test(value)) return value;
  return value
    .split("-")
    .filter(Boolean)
    .map((word) => ACRONYMS[word] ?? word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

/** A post's category, with the shelf uncategorised posts sit on. */
export function postCategory(category: string | null | undefined): string {
  return displayLabel(category) || "Notes";
}

const WORDS_PER_MINUTE = 220;

/**
 * Minutes to read a post.
 *
 * The stored `read_time` wins when there is one. When there is not, it is
 * estimated from the body's words rather than shown as nothing, because a
 * listing where two rows have no length reads as two rows that are broken.
 */
export function readingMinutes(readTime: number | null | undefined, html: string | undefined): number {
  if (readTime && readTime > 0) return readTime;
  const words = (html ?? "")
    .replace(/<[^>]+>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** The year a date falls in, in UTC -- the zone the stored dates are in. */
export function yearOf(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getUTCFullYear();
}

/** "Jan 22, 2026", for the mono date column in listings. */
export function shortDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** Group items by a key, keeping first-seen order of the groups and of the items. */
export function groupBy<T, K>(items: T[], key: (item: T) => K): [K, T[]][] {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const k = key(item);
    const bucket = groups.get(k);
    if (bucket) bucket.push(item);
    else groups.set(k, [item]);
  }
  return [...groups.entries()];
}

export type Availability = {
  key: "open" | "hiring" | "sick";
  label: string;
  detail: string;
  href: "/openhire" | null;
};

/**
 * The profile's three flags, as the lines the navbar and hero show.
 *
 * Order is the order of consequence for a visitor: whether he is unwell
 * changes how quickly anything else gets an answer, so it comes first.
 */
export function availability(about: Pick<AboutData, "is_open_to_work" | "is_hiring" | "is_sick">): Availability[] {
  const lines: Availability[] = [];
  if (about.is_sick) {
    lines.push({
      key: "sick",
      label: "Recovering",
      detail: "Replies may be slower than usual",
      href: null,
    });
  }
  if (about.is_open_to_work) {
    lines.push({
      key: "open",
      label: "Open to work",
      detail: "Taking on new roles",
      href: "/openhire",
    });
  }
  if (about.is_hiring) {
    lines.push({
      key: "hiring",
      label: "Hiring",
      detail: "RoneAI has open positions",
      href: "/openhire",
    });
  }
  return lines;
}

/** Whether `/openhire` exists at all for this profile. */
export function hasOpenhire(about: Pick<AboutData, "is_open_to_work" | "is_hiring">): boolean {
  return about.is_open_to_work || about.is_hiring;
}

/** Strip a URL to the part a reader recognises: `github.com/ridwaanhall`. */
export function bareUrl(url: string): string {
  return url.replace(/^mailto:/, "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

/** The social links a visitor can follow, in the order they are most used. */
export function socialLinks(about: AboutData): { label: string; href: string }[] {
  const s = about.social_media;
  const entries: [string, string][] = [
    ["GitHub", s.github],
    ["LinkedIn", s.linkedin],
    ["X", s.x],
    ["Instagram", s.instagram],
    ["Medium", s.medium],
    ["RoneAI", s.website],
  ];
  return entries.filter(([, href]) => Boolean(href)).map(([label, href]) => ({ label, href }));
}
