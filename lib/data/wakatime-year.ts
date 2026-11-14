import { cacheLife, cacheTag } from "next/cache";

import { buildCalendar, type CalendarMonth, type CalendarWeek } from "@/lib/utils/coding-calendar";

import {
  compactNumber,
  count,
  formatTime,
  longDateJakarta,
  share,
} from "./wakatime-format";
import { fetchJson, insightsUrl } from "./wakatime-fetch";
import { foldPrivateProjects } from "./wakatime-shapes";
import { TAGS } from "./tags";
import type { WakatimeEntry } from "./wakatime";

/**
 * A year of WakaTime, for the panel beneath the seven-day one.
 *
 * **Three calls, not nine.** WakaTime publishes an `insights/<thing>/last_year`
 * endpoint for each of languages, projects, editors, operating systems, best
 * day, daily average and weekdays -- and `insights/stats/last_year` returns all
 * of them in one body, along with the AI block, the categories, the models and
 * the holiday counts. It does not carry the per-day series, which is what the
 * heatmap is, so `insights/days/last_year` is the second call. The third,
 * `insights/languages/last_year`, is the only place a language's time is split
 * into AI Coding and the rest, and it is optional: without it the year renders
 * and only that one breakdown is missing.
 *
 * **Its own module, its own cache, its own Suspense boundary.** The seven-day
 * path already explains why its three calls share one time budget rather than
 * three; adding two more to that budget would spend the page's whole allowance
 * on a panel about last year. Fetched separately, a slow or broken year leaves
 * today's numbers alone, and vice versa.
 *
 * Deliberately left on the floor: `insights/stats` also returns `machines`, a
 * 1,397-entry `dependencies` list, and -- through the sibling heuristics
 * endpoint -- `top_files`, whose entries are absolute paths on the author's own
 * disk. None of that belongs on a public page. Nor does a model's `cost`: the
 * year's models are ranked and drawn by lines, and the cost field is never
 * read, so it cannot reach the page by accident.
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

  /*
   * No spend. The week's figure is published and the year's is not, so the
   * total is not read from the body at all.
   */
  ai_sessions: number;
  ai_prompts: string;
  ai_prompt_avg: string;
  ai_line_percent: number;
  ai_lines: string;
  human_lines: string;
  tokens: string;
  tokens_exact: string;

  /** Median prompt length, "693 chars". The average is skewed by pasted logs. */
  ai_prompt_median: string;
  /** Prompts in an average AI session, "6" -- one decimal where there is one. */
  ai_prompts_per_session: string;

  languages: WakatimeEntry[];
  /** Public projects only; every other project is summed into one "Other" row. */
  projects: WakatimeEntry[];
  systems: WakatimeEntry[];
  /** Kinds of work -- Coding, AI Coding, Writing Docs -- top three by time. */
  categories: WakatimeEntry[];
  /** Top three by time. Plain time bars: no AI split per editor. */
  editors: WakatimeEntry[];
  /**
   * Top three models by lines changed. `percent` is the model's share of every
   * AI line in the breakdown, `value` its line count. Carries no cost.
   */
  models: WakatimeEntry[];

  /**
   * False when the languages call failed or came back empty -- the year still
   * renders, and only this breakdown is missing.
   */
  has_ai_languages: boolean;
  /** Per language, how much of its coding *time* was AI Coding. See `aiLanguages`. */
  ai_languages: WakatimeAiLanguage[];

  /** The heatmap, cut into the 53 columns the grid draws. */
  weeks: CalendarWeek[];
  months: CalendarMonth[];
  /** The busiest day in the window, which is what the colour ramp is read against. */
  peak_seconds: number;
};

/**
 * One language's year, split by WakaTime category.
 *
 * **Time, not lines.** `ai_seconds` is the time WakaTime filed under its "AI
 * Coding" category while that language was open, and `manual_seconds` the rest
 * of its coding time. It says nothing about who wrote which line -- that is
 * `ai_line_percent`, a different measure -- so the panel labels it as time.
 *
 * Shaped as a `WakatimeEntry` so `Bars` can draw it: `percent` is the AI share
 * of this language's time (0-100), `time` the language's total.
 */
export type WakatimeAiLanguage = WakatimeEntry & {
  ai_seconds: number;
  manual_seconds: number;
  /** "4 days 2 hrs" -- the AI Coding share, written out. */
  ai_time: string;
  manual_time: string;
};

/** A named total. Every breakdown in the stats body has this shape. */
type NamedTotal = { name?: string; total_seconds?: number };

/** A model's year. `cost` is in the body too, and deliberately not typed here. */
type ModelLines = { name?: string; lines?: number };

type LanguageSplit = {
  name?: string;
  total_seconds?: number;
  ai_coding_seconds?: number;
  manual_coding_seconds?: number;
};

export type YearLanguages = { data?: { languages?: LanguageSplit[] } | LanguageSplit[] };

export type YearStats = {
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
    ai_sessions?: number;
    ai_prompt_events_total?: number;
    ai_prompt_length_avg?: number;
    ai_prompt_length_median_per_session?: number;
    ai_prompt_events_avg_per_session?: number;
    ai_input_tokens?: number;
    ai_cached_input_tokens?: number;
    ai_output_tokens?: number;

    languages?: NamedTotal[];
    projects?: NamedTotal[];
    operating_systems?: NamedTotal[];
    categories?: NamedTotal[];
    editors?: NamedTotal[];
    ai_model_breakdown?: ModelLines[];
  };
};

export type YearDays = { data?: { days?: { date?: string; total?: number }[] } };

/**
 * Top three by time, sharing one denominator so the bars are comparable.
 *
 * A year turns up long tails -- 30 languages, 117 projects, and an "Unknown OS"
 * holding 22 seconds of it. Anything under a tenth of a percent is dropped
 * rather than shown, because that is the point where the row prints "0%" beside
 * a bar with no width, and a reader takes that for a broken row rather than a
 * small one. The rows that survive are the ones the panel can actually draw.
 *
 * The denominator is the breakdown's own total, never the year's. WakaTime's
 * `total_seconds` leaves out time it files under "Other", while the systems
 * breakdown counts all of it -- so Windows was drawn at 101% of a year it was
 * only part of. A breakdown's rows always add up to the whole they share.
 */
export function topThree(rows: NamedTotal[] | undefined): WakatimeEntry[] {
  const whole = (rows ?? []).reduce((sum, row) => sum + (row.total_seconds ?? 0), 0);
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

/**
 * The year's models, ranked and drawn by the lines each one changed.
 *
 * Lines rather than cost because the yearly spend is not published here; the
 * cost field is not even typed above, so nothing downstream can pick it up.
 * The denominator is every line in the breakdown, the rows cut from the bottom
 * included, so three bars read as shares of all AI lines rather than of each
 * other. A model with no lines is no row at all, and a tie on lines breaks on
 * the name so two equal models do not swap places between refreshes.
 */
export function modelsByLines(rows: readonly ModelLines[] | null | undefined): WakatimeEntry[] {
  const models = (rows ?? []).filter((row) => (row?.lines ?? 0) > 0);
  const whole = models.reduce((sum, row) => sum + (row.lines ?? 0), 0);
  return models
    .map((row) => ({ name: row.name ?? "Unknown", lines: row.lines ?? 0 }))
    .sort((a, b) => b.lines - a.lines || a.name.localeCompare(b.name))
    .slice(0, 3)
    .map(({ name, lines }) => {
      const percent = share(lines, whole);
      return {
        name,
        percent,
        time: `${percent < 1 ? percent : Math.trunc(percent)}% of AI lines this year`,
        value: count(lines),
      };
    });
}

/**
 * Below this much time in a year, a language is left out of the AI split.
 *
 * A language opened for four minutes, all of them with an agent running, is
 * "100% AI" -- true and meaningless, and drawn as the longest bar in the
 * panel. An hour is the least that says something about how a language is
 * actually worked in.
 */
const AI_LANGUAGE_FLOOR_SECONDS = 3600;

/**
 * Per language, the share of its coding time that was AI Coding.
 *
 * The denominator is the language's AI Coding plus its other coding time, not
 * WakaTime's `total_seconds` for it, so the two parts always make the whole the
 * bar is drawn against. The languages shown are the biggest by that whole --
 * the ones a reader would expect -- rather than the most AI-heavy, which would
 * rank a language barely over the floor above the one the year was spent in.
 * A tie on time breaks on the name.
 *
 * Accepts the body as fetched: `null` for a failed call, and either a
 * `languages` array under `data` or `data` as the array itself.
 */
export function aiLanguages(
  body: YearLanguages | null | undefined,
  limit = 5,
  floorSeconds = AI_LANGUAGE_FLOOR_SECONDS,
): WakatimeAiLanguage[] {
  const data = body?.data;
  const rows = Array.isArray(data) ? data : (data?.languages ?? []);
  return rows
    .map((row) => {
      const ai = Math.max(0, row?.ai_coding_seconds ?? 0);
      const manual = Math.max(0, row?.manual_coding_seconds ?? 0);
      return { name: row?.name ?? "Unknown", ai, manual, whole: ai + manual };
    })
    .filter((row) => row.whole > 0 && row.whole >= floorSeconds)
    .sort((a, b) => b.whole - a.whole || a.name.localeCompare(b.name))
    .slice(0, limit)
    .map(({ name, ai, manual, whole }) => ({
      name,
      percent: Math.round(share(ai, whole) * 10) / 10,
      time: formatTime(whole),
      ai_seconds: Math.round(ai),
      manual_seconds: Math.round(manual),
      ai_time: formatTime(ai),
      manual_time: formatTime(manual),
    }));
}

/**
 * Prompts in an average AI session, written down.
 *
 * WakaTime's own per-session average when it sends one, and the year's prompts
 * over its sessions when it does not -- the same quantity -- and "0" rather
 * than NaN for a year with no sessions in it.
 */
export function promptsPerSession(data: NonNullable<YearStats["data"]> | null | undefined): string {
  const stated = data?.ai_prompt_events_avg_per_session;
  const sessions = data?.ai_sessions ?? 0;
  const value =
    typeof stated === "number" && Number.isFinite(stated)
      ? stated
      : sessions > 0
        ? (data?.ai_prompt_events_total ?? 0) / sessions
        : 0;
  return (Math.round(value * 10) / 10).toLocaleString("en-US");
}

/**
 * The panel, from the three bodies as fetched.
 *
 * Pure and apart from the fetch, so the edges -- a failed call, an empty body,
 * a `data` that is an array -- are tested offline. Every project name goes
 * through the allowlist here, before the value leaves the cached function.
 */
export function shapeWakatimeYear(
  stats: YearStats | null | undefined,
  series: YearDays | null | undefined,
  languageSplit: YearLanguages | null | undefined,
): WakatimeYear | null {
  // The whole panel is about the year's totals. Without them there is nothing
  // to render around a heatmap, so this one failure takes the section with it.
  const data = stats?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;

  const days = (series?.data?.days ?? [])
    .filter((day): day is { date: string; total: number } => typeof day?.date === "string")
    .map((day) => ({ date: day.date, value: day.total ?? 0 }));

  const { weeks, months } = buildCalendar(days);

  const total = data.total_seconds ?? 0;
  const aiLines = (data.ai_additions ?? 0) + (data.ai_deletions ?? 0);
  const humanLines = (data.human_additions ?? 0) + (data.human_deletions ?? 0);
  const tokensIn = (data.ai_input_tokens ?? 0) + (data.ai_cached_input_tokens ?? 0);

  // Folded before `topThree` ranks them, so "Other" competes on its real total.
  const projects = foldPrivateProjects(
    (data.projects ?? []).map((row) => ({ name: row?.name, value: row?.total_seconds ?? 0 })),
  ).map(({ name, value }) => ({ name, total_seconds: value }));

  const splitByLanguage = aiLanguages(languageSplit);

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

    ai_sessions: data.ai_sessions ?? 0,
    ai_prompts: count(data.ai_prompt_events_total ?? 0),
    ai_prompt_avg: `${count(data.ai_prompt_length_avg ?? 0)} chars`,
    ai_line_percent: Math.round(share(aiLines, aiLines + humanLines) * 10) / 10,
    ai_lines: count(aiLines),
    human_lines: count(humanLines),
    tokens: compactNumber(tokensIn + (data.ai_output_tokens ?? 0)),
    tokens_exact: `${count(tokensIn)} in + ${count(data.ai_output_tokens ?? 0)} out`,
    ai_prompt_median: `${count(data.ai_prompt_length_median_per_session ?? 0)} chars`,
    ai_prompts_per_session: promptsPerSession(data),

    languages: topThree(data.languages),
    projects: topThree(projects),
    systems: topThree(data.operating_systems),
    categories: topThree(data.categories),
    editors: topThree(data.editors),
    models: modelsByLines(data.ai_model_breakdown),

    has_ai_languages: splitByLanguage.length > 0,
    ai_languages: splitByLanguage,

    weeks,
    months,
    peak_seconds: days.reduce((peak, day) => Math.max(peak, day.value), 0),
  };
}

async function fetchWakatimeYear(apiKey: string): Promise<WakatimeYear | null> {
  if (!apiKey) return null;

  /*
   * All three together, so the third costs no extra wall time. `fetchJson`
   * answers a failure with `null` rather than throwing, which is what lets the
   * language split fail on its own without taking the year with it.
   */
  const [stats, series, languageSplit] = await Promise.all([
    fetchJson<YearStats>(insightsUrl("stats"), apiKey, "year stats"),
    fetchJson<YearDays>(insightsUrl("days"), apiKey, "year days"),
    fetchJson<YearLanguages>(insightsUrl("languages"), apiKey, "year languages"),
  ]);

  return shapeWakatimeYear(stats, series, languageSplit);
}

/**
 * Cached for an hour, and gone after two.
 *
 * Far longer than the seven-day panel's fifteen minutes, and deliberately: these
 * aggregates are recomputed by WakaTime on its own schedule -- the responses
 * carry a `modified_at` that moves about once a day -- and the window they cover
 * ends *yesterday*, so nothing in here can change between one request and the
 * next. Refetching every fifteen minutes would spend three calls to receive the
 * same body.
 *
 * `expire` still has to exceed `revalidate`, so two hours is the tightest
 * pairing an hourly refresh allows.
 */
export async function getWakatimeYear(apiKey: string): Promise<WakatimeYear | null> {
  "use cache";
  cacheTag(TAGS.wakatime);
  cacheLife({ stale: 3600, revalidate: 3600, expire: 7200 });

  return fetchWakatimeYear(apiKey);
}
