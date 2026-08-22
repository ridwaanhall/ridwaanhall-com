import { unstable_cache } from "next/cache";

/**
 * WakaTime coding activity for the dashboard.
 *
 * A port of apps/dashboard/wakatime_api.py. Two calls -- a seven-day summary
 * and the all-time total -- which is why the caller budgets *total* time across
 * both APIs rather than relying on the per-call timeout: three 10s timeouts in
 * sequence is 30s, past the platform's function limit, and the visitor sees a
 * gateway timeout rather than the page they asked for.
 */

export type WakatimeEntry = { name: string; percent: number; time: string };

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
  top_1_category: WakatimeEntry;
  top_2_os: WakatimeEntry[];
  top_3_languages: WakatimeEntry[];
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

/** Django's `_format_time`: "2 hours 5 minutes", "45 minutes", "30 secs", "0 mins". */
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

/** Django's `_convert_to_gmt7(...).strftime('%B %d, %Y')` -- "August 20, 2026". */
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

type Summary = {
  data?: {
    range?: { date?: string };
    grand_total?: { total_seconds?: number };
    categories?: { name?: string; total_seconds?: number }[];
    operating_systems?: { name?: string; total_seconds?: number }[];
    languages?: { name?: string; total_seconds?: number }[];
  }[];
  cumulative_total?: { seconds?: number };
  daily_average?: { seconds_including_other_language?: number };
  start?: string;
  end?: string;
};

type AllTime = { data?: { text?: string; range?: { start?: string } } };

async function fetchWakatimeStats(apiKey: string): Promise<WakatimeStats | null> {
  if (!apiKey) return null;

  const today = jakartaToday();
  const start = daysAgo(today, 6); // seven days including today

  let summary: Summary;
  let allTime: AllTime;
  try {
    const [summaryResponse, allTimeResponse] = await Promise.all([
      fetch(
        `${BASE}/users/current/summaries?start=${start}&end=${today}&api_key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(10_000) },
      ),
      fetch(`${BASE}/users/current/all_time_since_today?api_key=${encodeURIComponent(apiKey)}`, {
        signal: AbortSignal.timeout(10_000),
      }),
    ]);

    if (!summaryResponse.ok || !allTimeResponse.ok) {
      console.error(
        `WakaTime API error: HTTP ${summaryResponse.status} / ${allTimeResponse.status}`,
      );
      return null;
    }
    summary = (await summaryResponse.json()) as Summary;
    allTime = (await allTimeResponse.json()) as AllTime;
  } catch (error) {
    console.error("WakaTime API error:", error);
    return null;
  }

  const daily = summary.data ?? [];
  const grandTotal = summary.cumulative_total?.seconds ?? 0;

  let categorySeconds = 0;
  const osTotals = new Map<string, number>();
  const languageTotals = new Map<string, number>();

  for (const day of daily) {
    for (const category of day.categories ?? []) categorySeconds += category.total_seconds ?? 0;
    for (const os of day.operating_systems ?? []) {
      const name = os.name ?? "Unknown";
      osTotals.set(name, (osTotals.get(name) ?? 0) + (os.total_seconds ?? 0));
    }
    for (const language of day.languages ?? []) {
      const name = language.name ?? "Unknown";
      languageTotals.set(name, (languageTotals.get(name) ?? 0) + (language.total_seconds ?? 0));
    }
  }

  const percentOf = (value: number) => (grandTotal > 0 ? (value / grandTotal) * 100 : 0);
  const entry = (name: string, seconds: number): WakatimeEntry => ({
    name,
    percent: Math.round(percentOf(seconds) * 100) / 100,
    time: formatTime(seconds),
  });

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
    // Every category summed into one bucket, as before.
    top_1_category: entry("Coding", categorySeconds),
    top_2_os: [...osTotals.entries()]
      .map(([name, seconds]) => entry(name, seconds))
      .sort((a, b) => b.percent - a.percent),
    top_3_languages: [...languageTotals.entries()]
      .map(([name, seconds]) => entry(name, seconds))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 3),
  };
}

/** Cached for fifteen minutes, matching Django's `CACHE_TIMEOUT`. */
export const getWakatimeStats = unstable_cache(fetchWakatimeStats, ["wakatime-activity"], {
  revalidate: 900,
  tags: ["wakatime"],
});
