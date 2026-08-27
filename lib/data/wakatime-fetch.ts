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

export async function fetchJson<T>(url: string, label: string): Promise<T | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
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
export function insightsUrl(path: string, apiKey: string): string {
  return (
    `${BASE}/users/current/insights/${path}/last_year?paywalled=true` +
    `&timezone=${encodeURIComponent(TIMEZONE)}&api_key=${encodeURIComponent(apiKey)}`
  );
}
