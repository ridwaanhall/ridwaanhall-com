import { cacheLife, cacheTag } from "next/cache";

import type { CalendarDay, CalendarWeek } from "@/lib/utils/coding-calendar";

/**
 * GitHub contribution data for the dashboard.
 *
 * The calendar is fetched through the GraphQL API with the username as a
 * *variable*, never interpolated into the query string. The username comes from
 * the database, and a value from the database in a query string is an injection
 * waiting for the day somebody can edit it.
 */

/*
 * The same shape a year of WakaTime is cut into, because one heatmap draws
 * both. `value` is a contribution count here and a number of seconds there;
 * what the grid needs from either is a date and a magnitude.
 */
export type ContributionDay = CalendarDay;
export type ContributionWeek = CalendarWeek;

export type GitHubStats = {
  weeks: ContributionWeek[];
  months: { firstDay: string; name: string; totalWeeks: number }[];
  total_contributions: number;
  this_week: number;
  best_day: number;
  average: string;
  longest_streak: number;
  current_streak: number;
  current_streak_start: string | null;
  current_streak_end: string | null;
};

const QUERY = `
  query($username: String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          months { firstDay name totalWeeks }
          weeks {
            firstDay
            contributionDays { contributionCount date }
          }
        }
      }
    }
  }
`;

type CalendarResponse = {
  data?: {
    user?: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          months: { firstDay: string; name: string; totalWeeks: number }[];
          weeks: { firstDay: string; contributionDays: { contributionCount: number; date: string }[] }[];
        };
      };
    };
  };
};

/**
 * Fetch and process the contribution calendar.
 *
 * Returns `null` on any failure rather than throwing: the dashboard's
 * established degradation is to hide a panel, never to fail the page. That is
 * also why the caller budgets total time across both APIs -- see the note in
 * the dashboard page.
 */
async function fetchGitHubStats(username: string, token: string): Promise<GitHubStats | null> {
  if (!username || !token) return null;

  let payload: CalendarResponse;
  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.error(`GitHub API error: HTTP ${response.status}`);
      return null;
    }
    payload = (await response.json()) as CalendarResponse;
  } catch (error) {
    console.error("GitHub API error:", error);
    return null;
  }

  const calendar = payload.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) {
    console.error("GitHub activity data is missing or malformed.");
    return null;
  }

  const weeks: ContributionWeek[] = calendar.weeks.map((week) => ({
    firstDay: week.firstDay,
    days: week.contributionDays.map((day) => ({ date: day.date, value: day.contributionCount })),
  }));

  const days = weeks.flatMap((week) => week.days);
  // The calendar arrives in date order already, but the streak walk depends on
  // it, so it is not left to chance.
  days.sort((a, b) => a.date.localeCompare(b.date));

  const total = calendar.totalContributions;
  const bestDay = days.reduce((best, day) => Math.max(best, day.value), 0);
  const average = days.length > 0 ? (total / days.length).toFixed(1) : "0";

  return {
    weeks,
    months: calendar.months,
    total_contributions: total,
    this_week: thisWeekTotal(weeks),
    best_day: bestDay,
    average,
    ...streaks(days),
  };
}

/**
 * Contributions in the week containing today.
 *
 * The Python version compared `firstDay <= today <= firstDay + 7 days`, which
 * makes the window eight days long and can match two weeks; the last match won.
 * Comparing against the final week whose `firstDay` is not in the future gives
 * the same answer without the overlap.
 */
function thisWeekTotal(weeks: ContributionWeek[]): number {
  const today = new Date().toISOString().slice(0, 10);
  const current = [...weeks].reverse().find((week) => week.firstDay <= today);
  return current ? current.days.reduce((sum, day) => sum + day.value, 0) : 0;
}

/**
 * Longest and current streaks.
 *
 * The current streak walks backwards from the most recent day **that is not in
 * the future**. GitHub's calendar returns the whole of the current week,
 * including days that have not happened yet, and those carry a count of 0 --
 * so walking back from the literal last element reports a streak of 0 for
 * anyone whose week does not end today -- which is how a live streak comes to
 * read 0 on a Monday.
 */
function streaks(days: ContributionDay[]): {
  longest_streak: number;
  current_streak: number;
  current_streak_start: string | null;
  current_streak_end: string | null;
} {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    run = day.value > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  const today = new Date().toISOString().slice(0, 10);
  const elapsed = days.filter((day) => day.date <= today);

  const streak: ContributionDay[] = [];
  for (let i = elapsed.length - 1; i >= 0; i--) {
    if (elapsed[i].value === 0) break;
    streak.push(elapsed[i]);
  }

  return {
    longest_streak: longest,
    current_streak: streak.length,
    // `streak` is newest-first, so its ends are the other way round.
    current_streak_end: streak.length > 0 ? streak[0].date : null,
    current_streak_start: streak.length > 0 ? streak[streak.length - 1].date : null,
  };
}

/**
 * Cached for fifteen minutes, and stale for no more than thirty.
 *
 * Freshness here is a time window rather than something a content edit should
 * invalidate: this reads GitHub, not the database, so no admin save has any
 * bearing on it. The `github` tag exists so the window can be cut short by
 * hand, not because anything routine expires it.
 *
 * `expire` must exceed `revalidate`, so 1800 is the tightest bound a
 * fifteen-minute refresh allows -- and without it `revalidate` alone is
 * unbounded stale-while-revalidate, which on a prerendered route means the
 * build's copy can outlive its usefulness by however long nobody visits.
 * `lib/data/wakatime.ts` has the long form of that failure; this panel sits on
 * the same page and would have shown it the same way.
 *
 * Both `new Date()` reads that shape the result -- the current week and the
 * streak walk -- happen inside `fetchGitHubStats`, which is to say inside this
 * boundary. That is what Cache Components asks for: a clock read while
 * prerendering is rejected outright, and one read here is simply shared by
 * every reader until the next revalidation.
 */
export async function getGitHubStats(
  username: string,
  token: string,
): Promise<GitHubStats | null> {
  "use cache";
  cacheTag("github");
  cacheLife({ stale: 900, revalidate: 900, expire: 1800 });

  return fetchGitHubStats(username, token);
}
