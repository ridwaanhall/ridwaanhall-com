import { cacheLife, cacheTag } from "next/cache";

import { BASE, TIMEZONE, formatTime, jakartaToday } from "./wakatime-format";
import { fetchJson } from "./wakatime-fetch";
import {
  clock,
  hourHistogram,
  mergeDurationBlocks,
  rankSlots,
  summariseSessions,
  type DurationEntry,
  type TimelineBlock,
} from "./wakatime-shapes";

/**
 * Today, laid out along the clock.
 *
 * Every other WakaTime panel on the dashboard answers "how much"; this one
 * answers "when". `durations` is the only endpoint that carries the shape of a
 * day rather than its totals -- each entry is a sitting with the moment it
 * began -- and none of that survives the summarising the other calls do.
 *
 * **One call, sliced by language.** Asking without `slice_by` returns the same
 * day cut into 33 blocks instead of 71; asking with it returns those 71 and
 * every one still carries its project, so the sliced call is a superset and the
 * unsliced one would be a second request for a subset of what this already has.
 */

/** A block on the ribbon, with the colour slot and hover text already decided. */
export type DayBlock = TimelineBlock & {
  /** Index into the ribbon's written-out colour ramp; -1 for the leftover slot. */
  slot: number;
  detail: string;
};

export type WakatimeDay = {
  /** "August 26, 2026" -- the day the ribbon covers, on the clock it was kept on. */
  date: string;
  /** False on a day nothing has been logged to yet, which is not a failure. */
  has_activity: boolean;

  blocks: DayBlock[];
  /** The legend, biggest first. Names past the ramp collapse into one row. */
  languages: { name: string; slot: number; time: string }[];

  sessions: number;
  longest_session: string;
  /** "09:14 - 23:48", or a dash on a day with nothing on it. */
  active_window: string;
  longest_break: string;
  /** "21:00", the hour holding the most of the day. */
  peak_hour: string;
  peak_hour_detail: string;
  total: string;
};

type Durations = {
  data?: DurationEntry[];
  /** The local day's boundaries, as UTC instants. */
  start?: string;
  end?: string;
};

/**
 * How many languages get a colour of their own before the rest share one.
 *
 * Five, because the legend sits under the ribbon on one line at 375px and a
 * sixth pushes it to two -- and because a day rarely touches more than five
 * languages worth naming. `check-breakpoints.mjs` is not what holds this; the
 * ramp in `day-timeline.tsx` is, and the two have to agree.
 */
const RAMP_SLOTS = 5;

/** The legend row every unranked language shares, and the name to keep out of the ramp. */
const LEFTOVER_NAME = "Other";

async function fetchWakatimeDay(apiKey: string): Promise<WakatimeDay | null> {
  if (!apiKey) return null;

  const date = jakartaToday();
  const durations = await fetchJson<Durations>(
    `${BASE}/users/current/durations?date=${date}&slice_by=language&paywalled=true` +
      `&timezone=${encodeURIComponent(TIMEZONE)}&api_key=${encodeURIComponent(apiKey)}`,
    "durations",
  );

  // A failed call has no day to draw. An empty one does -- see `has_activity`.
  if (!durations) return null;

  const entries = (durations.data ?? []).filter(
    (entry): entry is DurationEntry => typeof entry?.time === "number",
  );

  /*
   * Midnight comes from the response rather than from arithmetic on the date.
   * WakaTime states the boundary it cut the day on, and taking it from there is
   * what makes the ribbon agree with the hours inside it across a daylight
   * saving change or a timezone edit -- neither of which Jakarta has, and
   * neither of which this should depend on not having.
   */
  const startEpoch = durations.start
    ? Date.parse(durations.start) / 1000
    : Date.parse(`${date}T00:00:00Z`) / 1000;

  const blocks = mergeDurationBlocks(entries, startEpoch);
  const sessions = summariseSessions(entries);
  const hours = hourHistogram(entries, startEpoch);

  const byLanguage = new Map<string, number>();
  for (const block of blocks) {
    byLanguage.set(block.language, (byLanguage.get(block.language) ?? 0) + block.seconds);
  }

  /*
   * WakaTime has a language bucket of its own called "Other", and so does the
   * legend below -- the row every language past the end of the ramp falls into.
   * Ranked like any other name it wins a colour, and the legend then carries two
   * rows reading "Other" in two colours, which says they are different things.
   * They are the same thing, so they are one row: the bucket is kept out of the
   * ranking and lands in the leftover with everything else unnamed.
   */
  const rankable = new Map([...byLanguage].filter(([name]) => name !== LEFTOVER_NAME));
  const slots = rankSlots(rankable, RAMP_SLOTS);

  const peakHour = hours.reduce((peak, seconds, hour) => (seconds > hours[peak] ? hour : peak), 0);
  const peakSeconds = hours[peakHour] ?? 0;

  const languages = [...byLanguage.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name, seconds]) => ({
      name: slots.has(name) ? name : LEFTOVER_NAME,
      slot: slots.get(name) ?? -1,
      seconds,
      time: formatTime(seconds),
    }))
    /*
     * Every language past the ramp shares one legend row and one colour, so
     * they share one entry too. Listing them separately against a single swatch
     * would say five things are five colours when they are one.
     */
    .reduce<{ name: string; slot: number; seconds: number; time: string }[]>((rows, row) => {
      const leftover = rows.find((existing) => existing.slot === -1);
      if (row.slot === -1 && leftover) {
        leftover.seconds += row.seconds;
        leftover.time = formatTime(leftover.seconds);
        return rows;
      }
      rows.push(row);
      return rows;
    }, [])
    .map(({ name, slot, time }) => ({ name, slot, time }));

  return {
    date: new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).format(new Date(`${date}T00:00:00Z`)),
    has_activity: blocks.length > 0,

    blocks: blocks.map((block) => ({
      ...block,
      slot: slots.get(block.language) ?? -1,
      detail: `${block.language} on ${block.project}, ${formatTime(block.seconds)} from ${clock(
        block.start * 86400,
      )}`,
    })),
    languages,

    sessions: sessions.sessions,
    longest_session: formatTime(sessions.longest_seconds),
    active_window:
      sessions.first_at === null || sessions.last_at === null
        ? "--"
        : `${clock(sessions.first_at - startEpoch)} - ${clock(sessions.last_at - startEpoch)}`,
    longest_break: formatTime(sessions.longest_break_seconds),
    peak_hour: peakSeconds > 0 ? `${String(peakHour).padStart(2, "0")}:00` : "--",
    peak_hour_detail:
      peakSeconds > 0
        ? `${formatTime(peakSeconds)} coded between ${String(peakHour).padStart(2, "0")}:00 and ${String((peakHour + 1) % 24).padStart(2, "0")}:00`
        : "Nothing logged today yet",
    total: formatTime(sessions.active_seconds),
  };
}

/**
 * Cached for fifteen minutes, and gone after thirty.
 *
 * The same pairing the seven-day panel uses and for the same reason: this is
 * about today, so it is the one WakaTime figure on the page that can change
 * between one visitor and the next. The year's hourly refresh would leave a
 * ribbon that stopped growing at lunchtime.
 *
 * The clock read that picks the date stays inside this boundary, which is what
 * Cache Components asks for -- a timestamp read while prerendering is refused
 * outright, and one read here is simply shared by every reader until the next
 * revalidation.
 */
export async function getWakatimeDay(apiKey: string): Promise<WakatimeDay | null> {
  "use cache";
  cacheTag("wakatime");
  cacheLife({ stale: 900, revalidate: 900, expire: 1800 });

  return fetchWakatimeDay(apiKey);
}
