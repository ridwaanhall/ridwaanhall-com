import { cacheLife, cacheTag } from "next/cache";

import { count, formatTime, share, shortTime } from "./wakatime-format";
import { fetchJson, insightsUrl } from "./wakatime-fetch";
import { bulletAxis, rankSlots, weeklyAiTrend, type AiDay } from "./wakatime-shapes";

/**
 * The shape of a week, and where a year of it has got to.
 *
 * Three questions the dashboard could not previously answer, because every
 * panel on it reports a total: which days of the week the hours actually fall
 * on, whether the AI share is moving, and whether any of these figures is large
 * by anyone's standard but this account's.
 *
 * **Its own module and its own boundary.** Three more calls on the seven-day
 * panel's budget is the failure that budget exists to prevent -- sequential
 * timeouts summing past the platform's function limit, and a gateway error
 * instead of a page. Fetched here, a slow weekday aggregate delays one panel.
 */

export type RhythmSegment = {
  name: string;
  seconds: number;
  /** Share of that weekday's own average, so the segments of a column sum to 100. */
  percent: number;
  slot: number;
};

export type RhythmDay = {
  name: string;
  /** "Mon" -- the axis label, which has to fit seven times across 375px. */
  short: string;
  average_seconds: number;
  average: string;
  total: string;
  /** Share of the busiest weekday, which is what sets the column's height. */
  height: number;
  segments: RhythmSegment[];
  detail: string;
};

export type TrendWeek = {
  /** Position along the axis, 0 at the oldest point and 1 at the newest. */
  x: number;
  /** The AI share, 0-100. */
  y: number;
  detail: string;
};

export type WakatimeRhythm = {
  weekdays: RhythmDay[];
  /** Every category drawn, in the order the ramp hands colours out. */
  categories: { name: string; slot: number }[];
  /** The axis the columns are drawn against: the busiest weekday, and half of it. */
  peak_label: string;
  half_label: string;
  busiest: string;
  busiest_detail: string;
  most_ai: string;
  most_ai_detail: string;

  has_trend: boolean;
  trend: TrendWeek[];
  trend_now: string;
  trend_then: string;
  trend_detail: string;

  has_comparison: boolean;
  /** Every figure below is a share of `axis_seconds`, 0-100. */
  axis_seconds: number;
  axis_label: string;
  you: number;
  you_label: string;
  community_median: number;
  community_median_label: string;
  community_average: number;
  community_average_label: string;
  /** Times the median WakaTime user, as a number so the card can count it up. */
  multiple: number;
  community_max_label: string;
};

type NamedCategory = { name?: string; total?: number; average?: number };

type Weekdays = {
  data?: {
    weekdays?: {
      name?: string;
      count?: number;
      total?: number;
      average?: number;
      human_readable_total?: string;
      human_readable_average?: string;
      categories?: NamedCategory[];
    }[];
  };
};

type AiDays = { data?: { ai_days?: AiDay[] } };

type DailyAverage = {
  data?: {
    current_user?: { daily_average?: { seconds?: number; text?: string } };
    all_users?: {
      daily_average?: { average?: number; median?: number; max?: number; text?: string };
    };
  };
};

/**
 * How many categories get a colour before the rest share one.
 *
 * WakaTime returns five -- Coding, AI Coding, Writing Docs, Writing Tests and
 * Code Reviewing -- and the last two are minutes against hours, so four named
 * bands plus a leftover draws the same information with a legend that fits.
 * The ramp in `column-chart.tsx` has to agree with this number.
 */
const CATEGORY_SLOTS = 4;

/** The AI category by name, which is what the most-AI-heavy day is measured on. */
const AI_CATEGORY = "AI Coding";

const SHORT_DAY: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

async function fetchWakatimeRhythm(apiKey: string): Promise<WakatimeRhythm | null> {
  if (!apiKey) return null;

  const [weekdays, aiDays, average] = await Promise.all([
    fetchJson<Weekdays>(insightsUrl("weekdays", apiKey), "weekdays"),
    fetchJson<AiDays>(insightsUrl("ai_days", apiKey), "ai days"),
    fetchJson<DailyAverage>(insightsUrl("daily_average", apiKey), "daily average"),
  ]);

  /*
   * Weekdays is the anchor: the panel is a chart of them with two strips under
   * it, and there is nothing to render around a missing chart. The other two
   * carry a flag each instead of taking the section down with them -- and a
   * flag rather than an emptiness test, because a year with no AI lines in it
   * is a real 0% and testing for zero would read it as an outage.
   */
  const rows = weekdays?.data?.weekdays ?? [];
  if (rows.length === 0) return null;

  const categoryTotals = new Map<string, number>();
  for (const row of rows) {
    for (const category of row.categories ?? []) {
      const name = category.name ?? "Other";
      categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + (category.average ?? 0));
    }
  }
  const slots = rankSlots(categoryTotals, CATEGORY_SLOTS);

  const peak = rows.reduce((most, row) => Math.max(most, row.average ?? 0), 0);

  const days: RhythmDay[] = rows.map((row) => {
    const name = row.name ?? "Unknown";
    const dayAverage = row.average ?? 0;

    /*
     * The leftover categories are folded into one segment rather than dropped.
     * A column whose bands stop short of its own height reads as a rendering
     * fault, and the minutes are real even where they are too small to name.
     */
    const named = new Map<string, number>();
    let leftover = 0;
    for (const category of row.categories ?? []) {
      const categoryName = category.name ?? "Other";
      const seconds = category.average ?? 0;
      if (seconds <= 0) continue;
      if (slots.has(categoryName)) named.set(categoryName, seconds);
      else leftover += seconds;
    }

    const segments: RhythmSegment[] = [...named.entries()]
      .sort((a, b) => (slots.get(a[0]) ?? 0) - (slots.get(b[0]) ?? 0))
      .map(([categoryName, seconds]) => ({
        name: categoryName,
        seconds: Math.round(seconds),
        percent: share(seconds, dayAverage),
        slot: slots.get(categoryName) ?? -1,
      }));

    if (leftover > 0) {
      segments.push({
        name: "Other",
        seconds: Math.round(leftover),
        percent: share(leftover, dayAverage),
        slot: -1,
      });
    }

    return {
      name,
      short: SHORT_DAY[name] ?? name.slice(0, 3),
      average_seconds: Math.round(dayAverage),
      average: formatTime(dayAverage),
      total: row.human_readable_total ?? formatTime(row.total ?? 0),
      height: share(dayAverage, peak),
      segments,
      detail: `${formatTime(dayAverage)} on an average ${name}, over ${count(row.count ?? 0)} of them`,
    };
  });

  const busiest = days.reduce(
    (most, day) => (day.average_seconds > most.average_seconds ? day : most),
    days[0],
  );

  const aiShareOf = (day: RhythmDay) =>
    share(day.segments.find((segment) => segment.name === AI_CATEGORY)?.seconds ?? 0, day.average_seconds);
  const mostAi = days.reduce((most, day) => (aiShareOf(day) > aiShareOf(most) ? day : most), days[0]);

  // --- the trend strip -----------------------------------------------------

  const series = aiDays?.data?.ai_days ?? [];
  const points = weeklyAiTrend(series);
  const hasTrend = points.length > 1;

  const trend: TrendWeek[] = points.map((point, index) => ({
    x: Math.round((index / Math.max(1, points.length - 1)) * 10000) / 10000,
    y: point.percent,
    detail: `${point.percent}% of ${count(point.ai + point.human)} lines in the week to ${point.end}`,
  }));

  const now = points[points.length - 1];
  const then = points[0];

  // --- the comparison strip ------------------------------------------------

  const you = average?.data?.current_user?.daily_average?.seconds ?? 0;
  const community = average?.data?.all_users?.daily_average;
  const median = community?.median ?? 0;
  const communityAverage = community?.average ?? 0;
  const hasComparison = you > 0 && median > 0;
  const axis = bulletAxis([you, communityAverage, median]);

  return {
    weekdays: days,
    categories: [...slots.entries()]
      .sort((a, b) => a[1] - b[1])
      .map(([name, slot]) => ({ name, slot }))
      .concat(days.some((day) => day.segments.some((segment) => segment.slot === -1))
        ? [{ name: "Other", slot: -1 }]
        : []),
    peak_label: shortTime(peak),
    half_label: shortTime(peak / 2),
    busiest: busiest.name,
    busiest_detail: busiest.detail,
    most_ai: mostAi.name,
    most_ai_detail: `${aiShareOf(mostAi)}% of an average ${mostAi.name} is AI Coding`,

    has_trend: hasTrend,
    trend,
    trend_now: hasTrend ? `${now.percent}%` : "0%",
    trend_then: hasTrend ? `${then.percent}%` : "0%",
    trend_detail: hasTrend
      ? `${now.percent}% of lines in the week to ${now.end}, against ${then.percent}% in the week to ${then.end}`
      : "No line history yet",

    has_comparison: hasComparison,
    axis_seconds: axis,
    axis_label: formatTime(axis),
    you: share(you, axis),
    you_label: average?.data?.current_user?.daily_average?.text ?? formatTime(you),
    community_median: share(median, axis),
    community_median_label: formatTime(median),
    community_average: share(communityAverage, axis),
    community_average_label: formatTime(communityAverage),
    /*
     * Against the median rather than the mean. The community's daily averages
     * run to nearly eighteen hours at the top, which drags a mean well above
     * the middle of the distribution -- the median is the figure that answers
     * "compared with a typical one of them".
     */
    multiple: median > 0 ? Math.round((you / median) * 10) / 10 : 0,
    community_max_label: formatTime(community?.max ?? 0),
  };
}

/**
 * Cached for an hour, and gone after two.
 *
 * The same pairing the year panel uses, for the same reason: all three of these
 * aggregates end yesterday and WakaTime recomputes them on its own schedule,
 * about once a day. A fifteen-minute refresh would spend three calls to receive
 * three identical bodies.
 */
export async function getWakatimeRhythm(apiKey: string): Promise<WakatimeRhythm | null> {
  "use cache";
  cacheTag("wakatime");
  cacheLife({ stale: 3600, revalidate: 3600, expire: 7200 });

  return fetchWakatimeRhythm(apiKey);
}
