/**
 * The arithmetic behind the dashboard's two rhythm panels.
 *
 * Separated from the fetches for the same reason `comment-shapes.ts` and
 * `guestbook-tree.ts` are: none of it needs a network, so `npm test` can cover
 * it offline, and every one of these functions has an edge a live panel would
 * only ever show once -- a day with a single slice in it, a week whose line
 * counts are all zero, a community whose maximum dwarfs its median.
 *
 * Nothing here formats. Durations come out in seconds and shares come out as
 * numbers, because the callers already share a vocabulary for writing those
 * down in `wakatime-format.ts` and a second one would drift from it.
 */

/** A slice of `durations`. The API returns far more; these are the fields read. */
export type DurationEntry = {
  time: number;
  duration: number;
  language?: string | null;
  project?: string | null;
};

/** One drawn block on the day ribbon, as fractions of the whole day. */
export type TimelineBlock = {
  /** 0 at midnight, 1 at the following midnight. */
  start: number;
  width: number;
  language: string;
  /** The project holding most of the block's seconds. */
  project: string;
  seconds: number;
};

export type SessionSummary = {
  sessions: number;
  longest_seconds: number;
  longest_break_seconds: number;
  /** Seconds into the day, or null on a day with nothing in it. */
  first_at: number | null;
  last_at: number | null;
  active_seconds: number;
};

export type AiDay = {
  date: string;
  ai_line_changes?: number;
  human_line_changes?: number;
};

export type TrendPoint = {
  /** First and last day the point covers, `YYYY-MM-DD`. */
  start: string;
  end: string;
  ai: number;
  human: number;
  /** AI lines as a share of the point's own total, 0-100. */
  percent: number;
};

const DAY_SECONDS = 86400;

/**
 * How narrow a block may be drawn.
 *
 * A one-minute slice is 0.07% of a day, which on an 840px ribbon is half a
 * pixel -- a browser either drops it or paints it as a grey smudge, and either
 * way a real minute of work disappears. A quarter of a percent is about two
 * pixels, which is the narrowest thing that still reads as a mark.
 */
const MIN_WIDTH = 0.0025;

/** A gap this long or longer means the next slice starts a new sitting. */
const SESSION_GAP = 900;

/** Slices closer together than this are one block, whatever the API split them into. */
const MERGE_GAP = 60;

/** Four decimals is a tenth of a pixel on any ribbon anyone will draw. */
const round = (value: number) => Math.round(value * 10000) / 10000;

/** Ascending by start time, without disturbing the caller's array. */
function inOrder(entries: DurationEntry[]): DurationEntry[] {
  return [...entries].sort((a, b) => a.time - b.time);
}

/**
 * Consecutive slices of one language, as blocks positioned across the day.
 *
 * WakaTime cuts a sitting into a slice per language, and switching file three
 * times in a minute produces three slices of the same language separated by
 * nothing. Drawn literally that is a picket fence where the reader should see
 * one bar, so slices agreeing on their language and sitting less than a minute
 * apart are merged.
 *
 * `startEpoch` is the instant the local day began, which the durations response
 * states outright. Taking it from there rather than converting the timestamps
 * means the ribbon is cut on exactly the boundary the hours were recorded
 * against -- and it means no clock is read in the browser, where it could
 * disagree with the one that rendered.
 */
export function mergeDurationBlocks(entries: DurationEntry[], startEpoch: number): TimelineBlock[] {
  const blocks: TimelineBlock[] = [];

  for (const entry of inOrder(entries)) {
    const duration = Math.max(0, entry.duration ?? 0);
    const language = entry.language || "Other";
    const project = entry.project || "Unknown";
    const last = blocks[blocks.length - 1];
    const begin = entry.time - startEpoch;

    if (last && last.language === language && begin - (last.start + last.seconds) < MERGE_GAP) {
      // The merged block keeps whichever project holds most of it, because that
      // is the one a reader would call the block by.
      if (duration > last.seconds) last.project = project;
      last.seconds = Math.max(last.seconds, begin + duration - last.start);
      continue;
    }

    blocks.push({ start: begin, width: 0, language, project, seconds: duration });
  }

  return blocks.map((block) => {
    const start = Math.min(1, Math.max(0, block.start) / DAY_SECONDS);
    return {
      language: block.language,
      project: block.project,
      start: round(start),
      // Clamped to the end of the day as well as up to the floor: a sitting
      // still running at midnight is reported with a duration that runs past it.
      width: round(Math.min(1 - start, Math.max(MIN_WIDTH, block.seconds / DAY_SECONDS))),
      seconds: Math.round(block.seconds),
    };
  });
}

/**
 * Sittings, the longest of them, and the longest gap between two.
 *
 * A session is measured wall-clock -- the last slice's end minus the first
 * slice's start -- rather than by adding its slices up. The two agree while the
 * slices are contiguous, which they are within a sitting, and the wall-clock
 * figure is the one that stays honest if they ever are not.
 */
export function summariseSessions(
  entries: DurationEntry[],
  gapSeconds: number = SESSION_GAP,
): SessionSummary {
  const ordered = inOrder(entries);
  if (ordered.length === 0) {
    return {
      sessions: 0,
      longest_seconds: 0,
      longest_break_seconds: 0,
      first_at: null,
      last_at: null,
      active_seconds: 0,
    };
  }

  const first = ordered[0].time;
  let sessions = 1;
  let sessionStart = first;
  let longest = 0;
  let longestBreak = 0;
  let cursor = first + Math.max(0, ordered[0].duration ?? 0);
  let active = Math.max(0, ordered[0].duration ?? 0);

  for (const entry of ordered.slice(1)) {
    const duration = Math.max(0, entry.duration ?? 0);
    const gap = entry.time - cursor;
    if (gap >= gapSeconds) {
      longest = Math.max(longest, cursor - sessionStart);
      longestBreak = Math.max(longestBreak, gap);
      sessions += 1;
      sessionStart = entry.time;
    }
    cursor = Math.max(cursor, entry.time + duration);
    active += duration;
  }
  longest = Math.max(longest, cursor - sessionStart);

  return {
    sessions,
    longest_seconds: Math.round(longest),
    longest_break_seconds: Math.round(longestBreak),
    first_at: Math.round(first),
    last_at: Math.round(cursor),
    active_seconds: Math.round(active),
  };
}

/**
 * Seconds coded in each hour of the day.
 *
 * A slice spanning an hour boundary is split across both buckets rather than
 * filed under the hour it began in -- a four-hour sitting starting at 20:50
 * would otherwise credit the whole evening to eight o'clock, and the peak hour
 * is the one figure this exists to produce.
 */
export function hourHistogram(entries: DurationEntry[], startEpoch: number): number[] {
  const hours = Array.from({ length: 24 }, () => 0);

  for (const entry of entries) {
    let from = Math.max(0, entry.time - startEpoch);
    const to = Math.min(DAY_SECONDS, from + Math.max(0, entry.duration ?? 0));

    while (from < to) {
      const hour = Math.min(23, Math.floor(from / 3600));
      const boundary = Math.min(to, (hour + 1) * 3600);
      hours[hour] += boundary - from;
      from = boundary;
    }
  }

  return hours.map((seconds) => Math.round(seconds));
}

/**
 * A year of daily line counts as weekly points.
 *
 * **Chunked from the most recent day backwards.** A year is fifty-two weeks and
 * a day, so one end of the series is always a partial point; putting it at the
 * old end means the newest point -- the one carrying where this has got to --
 * is always a whole week.
 *
 * Each point's share is computed from the week's own totals rather than by
 * averaging seven daily percentages. A day with eight line changes and a day
 * with three thousand weigh the same in a mean of percentages, so one quiet
 * afternoon of hand-editing could swing a busy week by tens of points.
 */
export function weeklyAiTrend(days: AiDay[], perPoint = 7): TrendPoint[] {
  const ordered = [...days].sort((a, b) => a.date.localeCompare(b.date));
  const points: TrendPoint[] = [];

  for (let end = ordered.length; end > 0; end -= perPoint) {
    const chunk = ordered.slice(Math.max(0, end - perPoint), end);
    const ai = chunk.reduce((sum, day) => sum + (day.ai_line_changes ?? 0), 0);
    const human = chunk.reduce((sum, day) => sum + (day.human_line_changes ?? 0), 0);
    const total = ai + human;

    points.push({
      start: chunk[0].date,
      end: chunk[chunk.length - 1].date,
      ai,
      human,
      percent: total > 0 ? Math.round((ai / total) * 1000) / 10 : 0,
    });
  }

  return points.reverse();
}

/**
 * Where the comparison scale ends.
 *
 * Not at the community maximum. Somebody out there logs seventeen and a half
 * hours a day, and an axis reaching that far leaves every figure the panel is
 * actually about inside the first sixth of the track, indistinguishable from
 * each other and from zero. The scale ends a quarter above the largest figure
 * it draws, rounded up to a whole hour so the ticks land on readable numbers,
 * and the panel names the maximum in words instead.
 */
export function bulletAxis(values: number[]): number {
  const largest = values.reduce((peak, value) => Math.max(peak, value || 0), 0);
  return Math.max(3600, Math.ceil((largest * 1.25) / 3600) * 3600);
}

/**
 * Which colour slot each name gets, biggest first.
 *
 * Names past the end of the ramp are absent from the map rather than mapped to
 * a fallback index, so a caller reads a miss as "this one is the leftover"
 * instead of having to know which slot number means that.
 *
 * Ties break on the name so the ramp is stable between one request and the
 * next: two languages level on seconds would otherwise swap colours whenever
 * the upstream response reordered them.
 */
export function rankSlots(totals: Map<string, number>, slots: number): Map<string, number> {
  return new Map(
    [...totals.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, slots)
      .map(([name], index) => [name, index] as const),
  );
}

/** "09:14", from seconds into the day. Wraps rather than overflowing at midnight. */
export function clock(secondsIntoDay: number): string {
  const total = Math.max(0, Math.round(secondsIntoDay)) % DAY_SECONDS;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
