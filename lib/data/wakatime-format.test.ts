import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  compactNumber,
  count,
  daysAgo,
  formatTime,
  longDateJakarta,
  share,
  usd,
} from "./wakatime-format";

describe("formatTime", () => {
  it("writes hours and minutes the way the cards read them", () => {
    assert.equal(formatTime(7384), "2 hours 3 minutes");
    assert.equal(formatTime(3600), "1 hour");
    assert.equal(formatTime(2700), "45 minutes");
    assert.equal(formatTime(60), "1 minute");
  });

  it("drops to seconds only below a minute, so a card is never blank", () => {
    assert.equal(formatTime(30), "30 secs");
    assert.equal(formatTime(0), "0 mins");
  });

  /*
   * A day WakaTime has not finished computing arrives as `undefined`, and the
   * caller's `?? 0` is not the only guard: a negative would otherwise render as
   * "-1 hours".
   */
  it("refuses a value that is not a duration", () => {
    assert.equal(formatTime(-5), "0 mins");
    assert.equal(formatTime(Number.NaN), "0 mins");
    assert.equal(formatTime(Number.POSITIVE_INFINITY), "0 mins");
  });
});

describe("compactNumber", () => {
  it("keeps a ten-digit token count inside a stat card", () => {
    assert.equal(compactNumber(3_400_055_385), "3.4B");
    assert.equal(compactNumber(8_046_890), "8.0M");
    assert.equal(compactNumber(2_265), "2.3K");
    assert.equal(compactNumber(176), "176");
  });

  it("answers zero rather than a suffix on nothing", () => {
    assert.equal(compactNumber(0), "0");
    assert.equal(compactNumber(-1), "0");
    assert.equal(compactNumber(Number.NaN), "0");
  });
});

/*
 * The reason these two pin `en-US`: this project's own machine runs `id-ID`,
 * which groups thousands with dots. 504,351,312 rendered as 504.351.312 reads
 * as a decimal to everybody else.
 */
describe("count and usd", () => {
  it("groups thousands with commas whatever the server's locale is", () => {
    assert.equal(count(504_351_312), "504,351,312");
    assert.equal(count(0), "0");
  });

  it("writes money to a fixed number of places", () => {
    assert.equal(usd(3446.470131, 2), "$3,446.47");
    assert.equal(usd(0.475054, 2), "$0.48");
    assert.equal(usd(1254.9, 0), "$1,255");
  });
});

describe("share", () => {
  it("gives a percentage to two decimals", () => {
    assert.equal(share(1, 4), 25);
    assert.equal(share(1, 3), 33.33);
  });

  /* A week with no AI lines is a real zero, not a NaN on the page. */
  it("answers zero on an empty whole rather than dividing by it", () => {
    assert.equal(share(0, 0), 0);
    assert.equal(share(5, 0), 0);
  });
});

describe("longDateJakarta", () => {
  it("writes the date the coding hours were kept on", () => {
    assert.equal(longDateJakarta("2026-08-20T00:00:00Z"), "August 20, 2026");
  });

  /*
   * The reason the zone matters: 17:30Z is already the next day in Jakarta, and
   * these are the boundaries WakaTime itself cuts its days on.
   */
  it("rolls to the next day past 17:00 UTC, as Jakarta does", () => {
    assert.equal(longDateJakarta("2026-08-20T16:59:59Z"), "August 20, 2026");
    assert.equal(longDateJakarta("2026-08-20T17:00:00Z"), "August 21, 2026");
  });

  it("says N/A rather than 'Invalid Date' when the API omits one", () => {
    assert.equal(longDateJakarta(undefined), "N/A");
    assert.equal(longDateJakarta(null), "N/A");
    assert.equal(longDateJakarta("not a date"), "N/A");
  });
});

describe("daysAgo", () => {
  it("walks back the seven-day window", () => {
    assert.equal(daysAgo("2026-08-26", 6), "2026-08-20");
  });

  it("crosses a month and a year boundary", () => {
    assert.equal(daysAgo("2026-03-02", 3), "2026-02-27");
    assert.equal(daysAgo("2026-01-02", 6), "2025-12-27");
  });
});
