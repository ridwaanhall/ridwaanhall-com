import { cacheLife, cacheTag } from "next/cache";

import { TAGS } from "./tags";
import { BASE, FALLBACK_TIMEZONE, isTimeZone, zoneLabel } from "./wakatime-format";
import { fetchJson } from "./wakatime-fetch";

type CurrentUser = { data?: { timezone?: unknown } };

/**
 * The timezone set on the WakaTime account, which every WakaTime panel cuts
 * its days on.
 *
 * Read from the account rather than written here, so changing the setting on
 * wakatime.com moves the dashboard with it: today's ribbon, the seven-day
 * range, the year and the labels saying which clock they are on. Every request
 * still *sends* the zone explicitly rather than leaving WakaTime to assume it,
 * so the date this site computes as "today" and the day WakaTime cuts are
 * always the same day -- the two cannot disagree for the length of a cache
 * entry.
 *
 * Falls back to `FALLBACK_TIMEZONE` when the call fails or names a zone this
 * runtime cannot format in, so a profile hiccup costs the label its accuracy
 * rather than costing the dashboard its panels.
 *
 * Fifteen minutes, like today's panels: a change of setting reaches the
 * dashboard within about the time a new heartbeat would. The panels call this
 * from inside their own cached reads, so the zone is fixed for the life of
 * each of their entries, which is what keeps a panel internally consistent.
 */
export async function getWakatimeTimezone(token: string): Promise<string> {
  "use cache";
  cacheTag(TAGS.wakatime);
  cacheLife({ stale: 900, revalidate: 900, expire: 1800 });

  if (!token) return FALLBACK_TIMEZONE;
  const user = await fetchJson<CurrentUser>(`${BASE}/users/current`, token, "current user");
  const zone = user?.data?.timezone;
  if (isTimeZone(zone)) return zone;
  if (user) console.error(`WakaTime current user: unusable timezone ${JSON.stringify(zone)}`);
  return FALLBACK_TIMEZONE;
}

/**
 * "GMT+7, Asia/Jakarta", for the dashboard's head.
 *
 * Its own cached read rather than `zoneLabel` called in the page, because the
 * label reads the clock (a zone's offset moves with daylight saving) and Cache
 * Components refuses a clock read while prerendering. Inside the cache it is
 * read once per entry instead, the same as every panel's.
 */
export async function getWakatimeZoneFact(token: string): Promise<string> {
  "use cache";
  cacheTag(TAGS.wakatime);
  cacheLife({ stale: 900, revalidate: 900, expire: 1800 });

  const zone = await getWakatimeTimezone(token);
  return `${zoneLabel(zone)}, ${zone}`;
}
