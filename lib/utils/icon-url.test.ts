import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { localIconUrl } from "./icon-url";

describe("localIconUrl", () => {
  /*
   * Stored icon URLs are absolute. Left alone, development fetches all 78 from
   * the production site -- slow, offline-hostile, and quietly dependent on it
   * being up.
   */
  it("serves a stored absolute icon from this origin", () => {
    assert.equal(
      localIconUrl("https://ridwaanhall.com/static/svg/icon/python.svg"),
      "/static/svg/icon/python.svg",
    );
  });

  it("rewrites the www and http forms too", () => {
    assert.equal(localIconUrl("https://www.ridwaanhall.com/static/a.svg"), "/static/a.svg");
    assert.equal(localIconUrl("http://ridwaanhall.com/static/a.svg"), "/static/a.svg");
  });

  it("leaves an icon that genuinely lives elsewhere alone", () => {
    const external = "https://cdn.example.com/static/a.svg";
    assert.equal(localIconUrl(external), external);
  });

  it("rewrites only the static prefix, not the whole domain", () => {
    const other = "https://ridwaanhall.com/media/a.svg";
    assert.equal(localIconUrl(other), other);
  });

  it("leaves an already-relative URL untouched", () => {
    assert.equal(localIconUrl("/static/svg/icon/go.svg"), "/static/svg/icon/go.svg");
  });
});
