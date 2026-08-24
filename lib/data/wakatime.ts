import { cacheLife, cacheTag } from "next/cache";

/**
 * WakaTime coding activity for the dashboard.
 *
 * Three calls -- a seven-day summary, the all-time total, and the AI heuristics
 * aggregate -- which is why the caller budgets *total* time rather than relying
 * on the per-call timeout: three 10s timeouts in sequence is 30s, past the
 * platform's function limit, and the visitor sees a gateway timeout rather than
 * the page they asked for. All three are issued together, so the budget is one
 * timeout rather than three.
 */

export type WakatimeEntry = { name: string; percent: number; time: string };

/**
 * The last seven days of AI-assisted coding.
 *
 * Tokens and prompts come from `summaries`, cost and the model split from
 * `ai/heuristics`. Two endpoints for one panel is not untidiness -- see
 * `fetchAiHeuristics` for why the daily costs cannot simply be added up.
 */
export type WakatimeAi = {
  /** "2.0B" -- input and cached input together, as WakaTime's own summary counts them. */
  tokens_in: string;
  tokens_in_exact: string;
  tokens_out: string;
  tokens_out_exact: string;
  /** Empty when the heuristics call did not answer, which hides the card rather than showing a zero. */
  cost: string;
  cost_exact: string;
  prompts: number;
  sessions: number;
  ai_lines: number;
  human_lines: number;
  ai_line_percent: number;
  /** Top three by spend. Empty for the same reason `cost` is. */
  models: WakatimeEntry[];
};

export type WakatimeStats = {
  start_date: string;
  end_date: string;
  all_time_start: string;
  all_time_coding: string;
  daily_average: string;
  this_week_coding: string;
  today_coding: string;
  today_change_percent: number;
  today_change_type: "increase" | "decrease" | "same";
  best_day_coding: string;
  best_day_date: string;
  top_3_categories: WakatimeEntry[];
  top_3_languages: WakatimeEntry[];
  ai: WakatimeAi;
};

const BASE = "https://wakatime.com/api/v1";
const TIMEZONE = "Asia/Jakarta";

/** Today in Asia/Jakarta as `YYYY-MM-DD`, which is what the API's range expects. */
function jakartaToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

function daysAgo(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** "2 hours 5 minutes", "45 minutes", "30 secs", "0 mins". */
function formatTime(seconds: number): string {
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
 * "2.0B", "3.7M", "176".
 *
 * Token counts run to ten digits, which is unreadable in a stat card and wraps
 * on a phone. The exact figure goes in the card's tooltip instead.
 */
function compactNumber(value: number): string {
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
const count = (value: number) => Math.round(value).toLocaleString("en-US");

const usd = (value: number, decimals: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

/** "August 20, 2026", in Jakarta time -- the clock the coding hours were kept on. */
function longDateJakarta(iso: string | undefined | null): string {
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

/** The AI fields on a day's `grand_total`. */
type AiTotals = {
  ai_input_tokens?: number;
  ai_cached_input_tokens?: number;
  ai_output_tokens?: number;
  ai_prompt_events_total?: number;
  ai_sessions?: number;
  ai_additions?: number;
  ai_deletions?: number;
  human_additions?: number;
  human_deletions?: number;
};

type Summary = {
  data?: {
    range?: { date?: string };
    grand_total?: { total_seconds?: number } & AiTotals;
    categories?: { name?: string; total_seconds?: number }[];
    languages?: { name?: string; total_seconds?: number }[];
  }[];
  cumulative_total?: { seconds?: number };
  daily_average?: { seconds_including_other_language?: number };
  start?: string;
  end?: string;
};

type AllTime = { data?: { text?: string; range?: { start?: string } } };

type Heuristics = {
  data?: {
    ai_model_total_cost?: number;
    ai_model_breakdown?: { name?: string; cost?: number }[];
  };
};

/**
 * The seven-day AI spend, and how it splits across models.
 *
 * **Why this is not read from `summaries` like everything else.** Each day's
 * `grand_total` carries an `ai_model_total_cost` of its own, and adding the
 * seven of them up gives a number several percent above what WakaTime itself
 * reports for the same week -- $1,079.76 against $1,063.19 when this was
 * written, and $1,037.49 against $1,020.92 for the top model alone. The daily
 * figures are not disjoint. Only the heuristics aggregate matches the range it
 * claims to cover, so cost comes from here and tokens come from there.
 *
 * Its own function, and its own failure, because a missing cost should cost the
 * panel one card rather than the whole section: the token counts come from a
 * different call and are unaffected by whatever happens here.
 *
 * The tokens are deliberately *not* taken from this response. It carries an
 * `average_ai_usage` block that looks like the right numbers and is not -- it is
 * the average across every WakaTime user, over a window of its own choosing.
 */
async function fetchAiHeuristics(
  apiKey: string,
  start: string,
  end: string,
): Promise<NonNullable<Heuristics["data"]> | null> {
  const url =
    `${BASE}/users/current/ai/heuristics?start=${start}&end=${end}` +
    `&timezone=${encodeURIComponent(TIMEZONE)}&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

    /*
     * 202, not 200, whenever WakaTime is still recomputing the aggregate --
     * which is most of the time, and the body carries usable numbers anyway.
     * `ok` covers both; narrowing this to `=== 200` would drop the spend figure
     * on almost every request and look like an outage.
     */
    if (!response.ok) {
      console.error(`WakaTime AI heuristics: HTTP ${response.status}`);
      return null;
    }
    return ((await response.json()) as Heuristics).data ?? null;
  } catch (error) {
    console.error("WakaTime AI heuristics error:", error);
    return null;
  }
}

async function fetchWakatimeStats(apiKey: string): Promise<WakatimeStats | null> {
  if (!apiKey) return null;

  const today = jakartaToday();
  const start = daysAgo(today, 6); // seven days including today

  let summary: Summary;
  let allTime: AllTime;
  let heuristics: NonNullable<Heuristics["data"]> | null;
  try {
    /*
     * `timezone` is sent explicitly rather than left to the account's own
     * setting. The two agree today, so this changes nothing visible -- but the
     * day boundary these figures are cut on is a property of the site, and
     * leaving it to a profile field means somebody editing that field silently
     * moves what "today" means here.
     */
    const [summaryResponse, allTimeResponse, heuristicsData] = await Promise.all([
      fetch(
        `${BASE}/users/current/summaries?start=${start}&end=${today}` +
          `&timezone=${encodeURIComponent(TIMEZONE)}&api_key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(10_000) },
      ),
      fetch(`${BASE}/users/current/all_time_since_today?api_key=${encodeURIComponent(apiKey)}`, {
        signal: AbortSignal.timeout(10_000),
      }),
      fetchAiHeuristics(apiKey, start, today),
    ]);

    if (!summaryResponse.ok || !allTimeResponse.ok) {
      console.error(
        `WakaTime API error: HTTP ${summaryResponse.status} / ${allTimeResponse.status}`,
      );
      return null;
    }
    summary = (await summaryResponse.json()) as Summary;
    allTime = (await allTimeResponse.json()) as AllTime;
    heuristics = heuristicsData;
  } catch (error) {
    console.error("WakaTime API error:", error);
    return null;
  }

  const daily = summary.data ?? [];
  const grandTotal = summary.cumulative_total?.seconds ?? 0;

  const categoryTotals = new Map<string, number>();
  const languageTotals = new Map<string, number>();

  const ai = {
    input: 0,
    cached: 0,
    output: 0,
    prompts: 0,
    sessions: 0,
    aiLines: 0,
    humanLines: 0,
  };

  for (const day of daily) {
    for (const category of day.categories ?? []) {
      const name = category.name ?? "Unknown";
      categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + (category.total_seconds ?? 0));
    }
    for (const language of day.languages ?? []) {
      const name = language.name ?? "Unknown";
      languageTotals.set(name, (languageTotals.get(name) ?? 0) + (language.total_seconds ?? 0));
    }

    const total = day.grand_total ?? {};
    ai.input += total.ai_input_tokens ?? 0;
    ai.cached += total.ai_cached_input_tokens ?? 0;
    ai.output += total.ai_output_tokens ?? 0;
    ai.prompts += total.ai_prompt_events_total ?? 0;
    ai.sessions += total.ai_sessions ?? 0;
    ai.aiLines += (total.ai_additions ?? 0) + (total.ai_deletions ?? 0);
    ai.humanLines += (total.human_additions ?? 0) + (total.human_deletions ?? 0);
  }

  const percentOf = (value: number) => (grandTotal > 0 ? (value / grandTotal) * 100 : 0);
  const entry = (name: string, seconds: number): WakatimeEntry => ({
    name,
    percent: Math.round(percentOf(seconds) * 100) / 100,
    time: formatTime(seconds),
  });

  /** The same shape for both breakdowns: biggest first, three of them. */
  const topThree = (totals: Map<string, number>): WakatimeEntry[] =>
    [...totals.entries()]
      .map(([name, seconds]) => entry(name, seconds))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3);

  const bestDay = daily.reduce(
    (best, day) =>
      (day.grand_total?.total_seconds ?? 0) > (best?.grand_total?.total_seconds ?? 0) ? day : best,
    daily[0],
  );
  const todaySeconds =
    daily.find((day) => day.range?.date === today)?.grand_total?.total_seconds ?? 0;
  const dailyAverage = summary.daily_average?.seconds_including_other_language ?? 0;

  let changePercent = 0;
  let changeType: WakatimeStats["today_change_type"] = "same";
  if (dailyAverage > 0) {
    const ratio = ((todaySeconds - dailyAverage) / dailyAverage) * 100;
    changePercent = Math.abs(ratio);
    changeType = ratio > 0 ? "increase" : ratio < 0 ? "decrease" : "same";
  }

  const spend = heuristics?.ai_model_total_cost ?? 0;
  const models =
    spend > 0
      ? (heuristics?.ai_model_breakdown ?? [])
          .filter((model) => (model.cost ?? 0) > 0)
          .sort((a, b) => (b.cost ?? 0) - (a.cost ?? 0))
          .slice(0, 3)
          .map((model) => ({
            name: model.name ?? "Unknown",
            percent: Math.round(((model.cost ?? 0) / spend) * 10000) / 100,
            // Read as the bar's tooltip, so it says the money rather than a time.
            time: usd(model.cost ?? 0, 2),
          }))
      : [];

  const totalLines = ai.aiLines + ai.humanLines;

  return {
    start_date: longDateJakarta(summary.start),
    end_date: longDateJakarta(summary.end),
    all_time_start: longDateJakarta(allTime.data?.range?.start),
    all_time_coding: allTime.data?.text ?? "0 mins",
    daily_average: formatTime(dailyAverage),
    this_week_coding: formatTime(grandTotal),
    today_coding: formatTime(todaySeconds),
    today_change_percent: Math.round(changePercent * 10) / 10,
    today_change_type: changeType,
    best_day_coding: formatTime(bestDay?.grand_total?.total_seconds ?? 0),
    best_day_date: longDateJakarta(
      bestDay?.range?.date ? `${bestDay.range.date}T00:00:00Z` : undefined,
    ),
    top_3_categories: topThree(categoryTotals),
    top_3_languages: topThree(languageTotals),
    ai: {
      // Input and cached input as one number, which is how WakaTime's own
      // summary counts them -- a cached token was still an input token.
      tokens_in: compactNumber(ai.input + ai.cached),
      tokens_in_exact: `${count(ai.input)} input + ${count(ai.cached)} cached input`,
      tokens_out: compactNumber(ai.output),
      tokens_out_exact: `${count(ai.output)} output tokens`,
      cost: spend > 0 ? usd(spend, 0) : "",
      cost_exact: spend > 0 ? `Calculated from recorded AI token usage (${usd(spend, 2)})` : "",
      prompts: ai.prompts,
      sessions: ai.sessions,
      ai_lines: ai.aiLines,
      human_lines: ai.humanLines,
      ai_line_percent: totalLines > 0 ? Math.round((ai.aiLines / totalLines) * 1000) / 10 : 0,
      models,
    },
  };
}

/**
 * Cached for fifteen minutes, and stale for no more than thirty.
 *
 * `"use cache"` rather than the `unstable_cache` that was here, because
 * `unstable_cache` cannot express the second half of that sentence. It takes a
 * `revalidate` and has no `expire`, and `revalidate` on its own is unbounded
 * stale-while-revalidate: the entry keeps being served while a refresh happens
 * behind it, so the reader who triggers the refresh is never the one who sees
 * it. On a prerendered route that is worse than it sounds -- `/dashboard` came
 * out of the build with `expire: 604800`, inherited from the profile cache, so
 * the panel could hand a visitor a week-old copy of "today". The dates lagged
 * for exactly that reason.
 *
 * `cacheLife` bounds it. After thirty minutes the value is gone rather than
 * stale and the panel renders fresh. `expire` must exceed `revalidate`, so 1800
 * is the tightest pairing a fifteen-minute refresh allows.
 *
 * The clock read that picks the seven-day window stays *inside* this boundary,
 * which is what Cache Components asks for: a timestamp read while prerendering
 * is rejected outright, and one read here is simply shared by every reader
 * until the next revalidation.
 */
export async function getWakatimeStats(apiKey: string): Promise<WakatimeStats | null> {
  "use cache";
  cacheTag("wakatime");
  cacheLife({ stale: 900, revalidate: 900, expire: 1800 });

  return fetchWakatimeStats(apiKey);
}
