import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { DEFAULT_IMAGE_SETTINGS, nearestNextQuality, parseImageSettings, wsrvUrl } from "./image-service";

describe("parseImageSettings", () => {
  it("reads a stored row", () => {
    assert.deepEqual(parseImageSettings({ imageService: "wsrv", imageQuality: 70 }), { service: "wsrv", quality: 70 });
  });

  it("falls back to what the site did before, for a missing row or a value it does not know", () => {
    assert.deepEqual(parseImageSettings(null), DEFAULT_IMAGE_SETTINGS);
    assert.equal(parseImageSettings({ imageService: "cloudinary", imageQuality: 80 }).service, "next");
  });

  it("refuses a quality outside the range the column allows", () => {
    assert.equal(parseImageSettings({ imageService: "next", imageQuality: 5 }).quality, 80);
    assert.equal(parseImageSettings({ imageService: "next", imageQuality: 101 }).quality, 80);
    assert.equal(parseImageSettings({ imageService: "next", imageQuality: Number.NaN }).quality, 80);
  });
});

describe("nearestNextQuality", () => {
  it("snaps to a quality the optimizer will serve", () => {
    assert.equal(nearestNextQuality(80), 80);
    assert.equal(nearestNextQuality(78), 80);
    assert.equal(nearestNextQuality(40), 50);
    assert.equal(nearestNextQuality(97), 100);
  });
});

describe("wsrvUrl", () => {
  it("encodes the source as a parameter and asks for WebP without enlargement", () => {
    const url = new URL(wsrvUrl("https://x.supabase.co/storage/v1/object/public/media/a b.png?v=1", 640, 80)!);
    assert.equal(url.origin, "https://wsrv.nl");
    assert.equal(url.searchParams.get("url"), "https://x.supabase.co/storage/v1/object/public/media/a b.png?v=1");
    assert.equal(url.searchParams.get("w"), "640");
    assert.equal(url.searchParams.get("q"), "80");
    assert.equal(url.searchParams.get("output"), "webp");
    assert.equal(url.searchParams.get("we"), "1");
  });

  it("has nothing to fetch for a path on this site or a data URI", () => {
    assert.equal(wsrvUrl("/static/svg/icon/x.svg", 96, 80), null);
    assert.equal(wsrvUrl("data:image/png;base64,AAAA", 96, 80), null);
  });
});
