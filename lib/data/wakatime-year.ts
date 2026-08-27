import { cacheLife, cacheTag } from "next/cache";

import { buildCalendar, type CalendarMonth, type CalendarWeek } from "@/lib/utils/coding-calendar";

import {
  compactNumber,
  count,
  formatTime,
  longDateJakarta,
  share,
  usd,
} from "./wakatime-format";
import { fetchJson, insightsUrl } from "./wakatime-fetch";
import type { WakatimeEntry } from "./wakatime";

/**
 * A year of WakaTime, for the panel beneath the seven-day one.
 *
 * **Two calls, not nine.** WakaTime publishes an `insights/<thing>/last_year`
 * endpoint for each of languages, projects, editors, operating systems, best
 * day, daily average and weekdays -- and `insights/stats/last_year` returns all
 * of them in one body, along with the AI block and the holiday counts. The only
 * thing it does not carry is the per-day series, which is what the heatmap is,
 * so `insights/days/last_year` is the second call and there is no third.
 *
 * **Its own module, its own cache, its own Suspense boundary.** The seven-day
 * path already explains why its three calls share one time budget rather than
 * three; adding two more to that budget would spend the page's whole allowance
 * on a panel about last year. Fetched separately, a slow or broken year leaves
 * today's numbers alone, and vice versa.
 *
 * The one thing deliberately left on the floor: `insights/stats` also returns
 * `machines`, a 1,397-entry `dependencies` list, and -- through the sibling
 * heuristics endpoint -- `top_files`, whose entries are absolute paths on the
 * author's own disk. None of that belongs on a public page.
 */

export type WakatimeYear = {
  /** "August 25, 2025 to August 25, 2026" -- the window WakaTime actually cut. */
  range: string;
  total: string;
  daily_average: string;
  best_day: string;
  best_day_date: string;
  /** Days with any coding on them, against the days in the window. */
  days_coded: number;
  days_total: number;

  ai_spend: string;
  ai_sessions: number;
  ai_prompts: string;
  ai_prompt_avg: string;
  ai_line_percent: number;
  ai_lines: string;
  human_lines: string;
  tokens: string;
  tokens_exact: string;

  languages: WakatimeEntry[];
  projects: WakatimeEntry[];
  systems: WakatimeEntry[];

  /** The heatmap, cut into the 53 columns the grid draws. */
  weeks: CalendarWeek[];
  months: CalendarMonth[];
  /** The busiest day in the window, which is what the colour ramp is read against. */
  peak_seconds: number;
};

/** A named total. Every breakdown in the stats body has this shape. */
type NamedTotal = { name?: string; total_seconds?: number };

type YearStats = {
  data?: {
    start?: string;
    end?: string;
    human_readable_total?: string;
    human_readable_daily_average?: string;
    total_seconds?: number;
    best_day?: { date?: string; text?: string };
    days_including_holidays?: number;
    days_minus_holidays?: number;

    ai_additions?: number;
    ai_deletions?: number;
    human_additions?: number;
    human_deletions?: number;
    ai_model_total_cost?: number;
    ai_sessions?: number;
    ai_prompt_events_total?: number;
    ai_prompt_length_avg?: number;
    ai_input_tokens?: number;
    ai_cached_input_tokens?: number;
    ai_output_tokens?: number;

    languages?: NamedTotal[];
    projects?: NamedTotal[];
    operating_systems?: NamedTotal[];
  };
};

type YearDays = { data?: { days?: { date?: string; total?: number }[] } };

/**
 * Top three by time, sharing one denominator so the bars are comparable.
 *
 * A year turns up long tails -- 30 languages, 117 projects, and an "Unknown OS"
 * holding 22 seconds of it. Anything under a tenth of a percent is dropped
 * rather than shown, because that is the point where the row prints "0%" beside
 * a bar with no width, and a reader takes that for a broken row rather than a
 * small one. The rows that survive are the ones the panel can actually draw.
 */
function topThree(rows: NamedTotal[] | undefined, whole: number): WakatimeEntry[] {
  return (rows ?? [])
    .map((row) => ({
      name: row.name ?? "Unknown",
      percent: share(row.total_seconds ?? 0, whole),
      time: formatTime(row.total_seconds ?? 0),
    }))
    .filter((entry) => entry.percent >= 0.1)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
}

async function fetchWakatimeYear(apiKey: string): Promise<WakatimeYear | null> {
  if (!apiKey) return null;

  const [stats, series] = await Promise.all([
    fetchJson<YearStats>(insightsUrl("stats", apiKey), "year stats"),
    fetchJson<YearDays>(insightsUrl("days", apiKey), "year days"),
  ]);

  // The whole panel is about the year's totals. Without them there is nothing
  // to render around a heatmap, so this one failure takes the section with it.
  const data = stats?.data;
  if (!data) return null;

  const days = (series?.data?.days ?? [])
    .filter((day): day is { date: string; total: number } => typeof day.date === "string")
    .map((day) => ({ date: day.date, value: day.total ?? 0 }));

  const { weeks, months } = buildCalendar(days);

  const total = data.total_seconds ?? 0;
  const aiLines = (data.ai_additions ?? 0) + (data.ai_deletions ?? 0);
  const humanLines = (data.human_additions ?? 0) + (data.human_deletions ?? 0);
  const tokensIn = (data.ai_input_tokens ?? 0) + (data.ai_cached_input_tokens ?? 0);

  return {
    range: `${longDateJakarta(data.start)} to ${longDateJakarta(data.end)}`,
    total: data.human_readable_total ?? formatTime(total),
    daily_average: data.human_readable_daily_average ?? "0 mins",
    best_day: data.best_day?.text ?? "0 mins",
    best_day_date: longDateJakarta(
      data.best_day?.date ? `${data.best_day.date}T00:00:00Z` : undefined,
    ),
    /*
     * WakaTime calls a day with no coding on it a holiday, and reports the two
     * counts rather than the difference. `days_minus_holidays` is therefore
     * "days you actually coded", which is the honest way round to say it.
     */
    days_coded: data.days_minus_holidays ?? 0,
    days_total: data.days_including_holidays ?? 0,

    // Whole dollars, as the seven-day card does: cents on a four-figure
    // estimate are noise.
    ai_spend: usd(data.ai_model_total_cost ?? 0, 0),
    ai_sessions: data.ai_sessions ?? 0,
    ai_prompts: count(data.ai_prompt_events_total ?? 0),
    ai_prompt_avg: `${count(data.ai_prompt_length_avg ?? 0)} chars`,
    ai_line_percent: Math.round(share(aiLines, aiLines + humanLines) * 10) / 10,
    ai_lines: count(aiLines),
    human_lines: count(humanLines),
    tokens: compactNumber(tokensIn + (data.ai_output_tokens ?? 0)),
    tokens_exact: `${count(tokensIn)} in + ${count(data.ai_output_tokens ?? 0)} out`,

    languages: topThree(data.languages, total),
    projects: topThree(data.projects, total),
    systems: topThree(data.operating_systems, total),

    weeks,
    months,
    peak_seconds: days.reduce((peak, day) => Math.max(peak, day.value), 0),
  };
}

/**
 * Cached for an hour, and gone after two.
 *
 * Far longer than the seven-day panel's fifteen minutes, and deliberately: these
 * aggregates are recomputed by WakaTime on its own schedule -- the responses
 * carry a `modified_at` that moves about once a day -- and the window they cover
 * ends *yesterday*, so nothing in here can change between one request and the
 * next. Refetching every fifteen minutes would spend two calls to receive the
 * same body.
 *
 * `expire` still has to exceed `revalidate`, so two hours is the tightest
 * pairing an hourly refresh allows.
 */
export async function getWakatimeYear(apiKey: string): Promise<WakatimeYear | null> {
  "use cache";
  cacheTag("wakatime");
  cacheLife({ stale: 3600, revalidate: 3600, expire: 7200 });

  return fetchWakatimeYear(apiKey);
}
