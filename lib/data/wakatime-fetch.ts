import { BASE, TIMEZONE } from "./wakatime-format";

/**
 * The two things every WakaTime call here does the same way.
 *
 * Beside `wakatime-format.ts` rather than inside it: everything in that file is
 * pure, which is what lets the unit suite import it with no network and no
 * database, and a `fetch` in there would be the one import that breaks the
 * promise the file opens with.
 *
 * Three read paths now share these -- the year, the day and the weekday
 * rhythm -- and the alternative is each keeping a copy of a timeout, a 202 and
 * an encoder, which is three places for one of them to be wrong in.
 */

/**
 * The request options every WakaTime call sends: a timeout, and the personal
 * OAuth token as a bearer header.
 *
 * A header rather than the `api_key` query parameter WakaTime also accepts,
 * because a URL ends up in access logs, fetch-cache keys and error messages and
 * a header does not. Since November 2026 an API key is refused here outright --
 * WakaTime keeps those for editor plugins -- so the token has to be an OAuth
 * one: the personal token on wakatime.com/oauth, which reads summaries, stats
 * and coding activity -- everything the dashboard asks for.
 */
export function wakatimeInit(token: string): RequestInit {
  return {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(10_000),
  };
}

export async function fetchJson<T>(url: string, token: string, label: string): Promise<T | null> {
  try {
    const response = await fetch(url, wakatimeInit(token));
    /*
     * 202 rather than 200 whenever WakaTime is still recomputing an aggregate,
     * with usable numbers in the body regardless. `ok` covers both; narrowing
     * to 200 would read a recomputation as an outage, which on the heuristics
     * endpoint is most requests.
     */
    if (!response.ok) {
      console.error(`WakaTime ${label}: HTTP ${response.status}`);
      return null;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.error(`WakaTime ${label} error:`, error);
    return null;
  }
}

/**
 * A `insights/<thing>/last_year` URL.
 *
 * `timezone` is sent explicitly rather than left to the account's own setting.
 * The two agree today, so it changes nothing visible -- but the day boundary
 * these figures are cut on is a property of the site, and leaving it to a
 * profile field means somebody editing that field silently moves what a day
 * means here.
 */
export function insightsUrl(path: string): string {
  return (
    `${BASE}/users/current/insights/${path}/last_year?paywalled=true` +
    `&timezone=${encodeURIComponent(TIMEZONE)}`
  );
}
