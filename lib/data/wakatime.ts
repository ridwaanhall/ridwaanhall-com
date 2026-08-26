import { cacheLife, cacheTag } from "next/cache";

import {
  BASE,
  TIMEZONE,
  compactNumber,
  count,
  daysAgo,
  formatTime,
  jakartaToday,
  longDateJakarta,
  share,
  usd,
} from "./wakatime-format";

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

export type WakatimeEntry = {
  name: string;
  percent: number;
  /** The row's tooltip. */
  time: string;
  /**
   * Printed at the end of the row in place of the percent -- a cost, a line
   * count. The bar still encodes `percent`, so the proportion survives even
   * where the number beside it is measured in something else.
   */
  value?: string;
};

/**
 * The last seven days of AI-assisted coding.
 *
 * Tokens and per-project lines come from `summaries`; cost, models and the two
 * review figures from `ai/heuristics`. Two endpoints for one panel is not
 * untidiness -- see `fetchAiHeuristics` for why the daily costs cannot simply
 * be added up.
 */
export type WakatimeAi = {
  /** "2.0B" -- input and cached input together, as WakaTime's own summary counts them. */
  tokens_in: string;
  tokens_in_exact: string;
  tokens_out: string;
  tokens_out_exact: string;
  ai_lines: number;
  human_lines: number;
  ai_line_percent: number;
  /** Prompts sent this week, and their average length in characters. */
  prompts: string;
  prompt_avg: string;
  /** AI lines by project, biggest first. From `summaries`, so always present. */
  projects: WakatimeEntry[];
  /*
   * Everything below comes from the heuristics call, which is allowed to fail
   * on its own. `has_heuristics` is what the panel gates on -- one flag rather
   * than four emptiness tests that could disagree.
   */
  has_heuristics: boolean;
  /** What the week cost, in full. Only shares of it were ever shown. */
  spend: string;
  sessions: number;
  review_percent: string;
  review_sessions: number;
  review_detail: string;
  follow_up_percent: string;
  follow_up_sessions: number;
  follow_up_detail: string;
  /** Top three by spend, each carrying its dollar amount as `value`. */
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
  top_3_editors: WakatimeEntry[];
  ai: WakatimeAi;
};

/** The AI fields on a day's `grand_total`. */
type AiTotals = {
  ai_input_tokens?: number;
  ai_cached_input_tokens?: number;
  ai_output_tokens?: number;
  ai_additions?: number;
  ai_deletions?: number;
  human_additions?: number;
  human_deletions?: number;
  /*
   * Prompt counters, summed across the window. These are discrete events,
   * each stamped with the moment it happened, so unlike the daily cost --
   * see `fetchAiHeuristics` -- adding seven days of them up is sound.
   */
  ai_prompt_events_total?: number;
  ai_prompt_length_sum?: number;
};

type Summary = {
  data?: {
    range?: { date?: string };
    grand_total?: { total_seconds?: number } & AiTotals;
    categories?: { name?: string; total_seconds?: number }[];
    languages?: { name?: string; total_seconds?: number }[];
    editors?: { name?: string; total_seconds?: number }[];
    /** Carries the same AI counters as `grand_total`, split by project. */
    projects?: ({ name?: string } & AiTotals)[];
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
    /** Files a human went back and read, as a share of the ones AI touched. */
    files_with_review?: number;
    files_with_review_percent?: number;
    review_events?: number;
    /** Files a human went back and *changed*, within `follow_up_window_seconds`. */
    files_with_follow_up?: number;
    /** Every edit session AI took part in -- the denominator above. */
    ai_edit_sessions?: number;
    files_with_follow_up_percent?: number;
    follow_up_events?: number;
    follow_up_lines?: number;
    follow_up_window_seconds?: number;
    ai_touched_files?: number;
  };
};

/**
 * The seven-day AI spend, how it splits across models, and how much of what AI
 * wrote a human went back to.
 *
 * **Why this is not read from `summaries` like everything else.** Each day's
 * `grand_total` carries an `ai_model_total_cost` of its own, and adding the
 * seven of them up gives a number several percent above what WakaTime itself
 * reports for the same week -- $1,079.76 against $1,063.19 when this was
 * written, and $1,037.49 against $1,020.92 for the top model alone. The daily
 * figures are not disjoint. Only the heuristics aggregate matches the range it
 * claims to cover, so cost comes from here and tokens come from there.
 *
 * Its own function, and its own failure. Four of the panel's figures and one of
 * its two bar charts come from here, so losing it is not nothing -- but the
 * tokens, the per-project lines and both other breakdowns come from
 * `summaries`, and there is no reason for them to disappear alongside.
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
  const editorTotals = new Map<string, number>();
  const projectAiLines = new Map<string, number>();

  const ai = {
    input: 0,
    cached: 0,
    output: 0,
    aiLines: 0,
    humanLines: 0,
    prompts: 0,
    promptChars: 0,
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
    for (const editor of day.editors ?? []) {
      const name = editor.name ?? "Unknown";
      editorTotals.set(name, (editorTotals.get(name) ?? 0) + (editor.total_seconds ?? 0));
    }

    for (const project of day.projects ?? []) {
      const name = project.name ?? "Unknown";
      const lines = (project.ai_additions ?? 0) + (project.ai_deletions ?? 0);
      if (lines > 0) projectAiLines.set(name, (projectAiLines.get(name) ?? 0) + lines);
    }

    const total = day.grand_total ?? {};
    ai.input += total.ai_input_tokens ?? 0;
    ai.cached += total.ai_cached_input_tokens ?? 0;
    ai.output += total.ai_output_tokens ?? 0;
    ai.aiLines += (total.ai_additions ?? 0) + (total.ai_deletions ?? 0);
    ai.humanLines += (total.human_additions ?? 0) + (total.human_deletions ?? 0);
    ai.prompts += total.ai_prompt_events_total ?? 0;
    ai.promptChars += total.ai_prompt_length_sum ?? 0;
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
          .map((model) => {
            const percent = share(model.cost ?? 0, spend);
            return {
              name: model.name ?? "Unknown",
              percent,
              // The share moves into the tooltip because the row prints the
              // money instead. The panel's own Est. Spend card is what the
              // dollars are read against.
              time: `${percent < 1 ? percent : Math.trunc(percent)}% of estimated spend`,
              value: usd(model.cost ?? 0, 2),
            };
          })
      : [];

  const totalLines = ai.aiLines + ai.humanLines;

  /** AI lines by project, as a share of every AI line written this week. */
  const projects = [...projectAiLines.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, lines]) => ({
      name,
      percent: share(lines, ai.aiLines),
      time: `${count(lines)} of ${count(ai.aiLines)} AI lines this week`,
      value: count(lines),
    }));

  /*
   * One flag for the whole heuristics block. The four figures below arrive
   * together or not at all, and gating each on its own emptiness would let a
   * zero read as an outage -- a week with no follow-ups is a real 0%, not a
   * missing one.
   */
  const hasHeuristics = heuristics !== null;
  const reviewed = heuristics?.files_with_review ?? 0;
  const touched = heuristics?.ai_touched_files ?? 0;
  const followUpFiles = heuristics?.files_with_follow_up ?? 0;
  const followUpHours = Math.round((heuristics?.follow_up_window_seconds ?? 0) / 3600);

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
    top_3_editors: topThree(editorTotals),
    ai: {
      // Input and cached input as one number, which is how WakaTime's own
      // summary counts them -- a cached token was still an input token.
      tokens_in: compactNumber(ai.input + ai.cached),
      tokens_in_exact: `${count(ai.input)} input + ${count(ai.cached)} cached input`,
      tokens_out: compactNumber(ai.output),
      tokens_out_exact: `${count(ai.output)} output tokens`,
      ai_lines: ai.aiLines,
      human_lines: ai.humanLines,
      ai_line_percent: totalLines > 0 ? Math.round((ai.aiLines / totalLines) * 1000) / 10 : 0,
      prompts: count(ai.prompts),
      prompt_avg: ai.prompts > 0 ? count(ai.promptChars / ai.prompts) + " chars" : "0 chars",
      projects,
      has_heuristics: hasHeuristics,
      // Whole dollars: the cents on a four-figure estimate are noise, and the
      // per-model rows beneath it already carry them.
      spend: usd(spend, 0),
      sessions: heuristics?.ai_edit_sessions ?? 0,
      review_percent: `${Math.round((heuristics?.files_with_review_percent ?? 0) * 10) / 10}%`,
      review_sessions: heuristics?.review_events ?? 0,
      review_detail: `${count(reviewed)} of ${count(touched)} AI-touched files were read back, across ${count(heuristics?.review_events ?? 0)} review sessions`,
      follow_up_percent: `${Math.round((heuristics?.files_with_follow_up_percent ?? 0) * 10) / 10}%`,
      follow_up_sessions: heuristics?.follow_up_events ?? 0,
      follow_up_detail: `${count(followUpFiles)} files were edited again within ${followUpHours} hours, changing ${count(heuristics?.follow_up_lines ?? 0)} lines`,
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
