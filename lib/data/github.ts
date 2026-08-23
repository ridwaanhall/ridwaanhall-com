import { unstable_cache } from "next/cache";

/**
 * GitHub contribution data for the dashboard.
 *
 * A port of apps/dashboard/github_api.py. The calendar is fetched through the
 * GraphQL API with the username as a *variable* rather than interpolated into
 * the query string -- the Python original made the same point in a comment, and
 * it is worth keeping: the username comes from the database.
 */

export type ContributionDay = { date: string; count: number };
export type ContributionWeek = { firstDay: string; days: ContributionDay[] };

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
    days: week.contributionDays.map((day) => ({ date: day.date, count: day.contributionCount })),
  }));

  const days = weeks.flatMap((week) => week.days);
  // The calendar arrives in date order already, but the streak walk depends on
  // it, so it is not left to chance.
  days.sort((a, b) => a.date.localeCompare(b.date));

  const total = calendar.totalContributions;
  const bestDay = days.reduce((best, day) => Math.max(best, day.count), 0);
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
  return current ? current.days.reduce((sum, day) => sum + day.count, 0) : 0;
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
    run = day.count > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  const today = new Date().toISOString().slice(0, 10);
  const elapsed = days.filter((day) => day.date <= today);

  const streak: ContributionDay[] = [];
  for (let i = elapsed.length - 1; i >= 0; i--) {
    if (elapsed[i].count === 0) break;
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
 * Cached for fifteen minutes.
 *
 * `unstable_cache` rather than `"use cache"`: this reads an external API rather
 * than the database, and its freshness is a time window rather than something a
 * content edit should invalidate.
 */
export const getGitHubStats = unstable_cache(fetchGitHubStats, ["github-contributions"], {
  revalidate: 900,
  tags: ["github"],
});
