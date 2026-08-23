import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { assetUrl, mediaUrl } from "./media";

// `tests/setup.ts` fixes these, so the expected strings below are stable.
const BASE = "https://unit-tests.supabase.co/storage/v1/object/public/media";

describe("mediaUrl", () => {
  it("builds the public URL for a bucket key", () => {
    assert.equal(mediaUrl("blog/foo.webp"), `${BASE}/blog/foo.webp`);
  });

  /*
   * Empty rather than a URL to nothing: callers render `<Image>` only when this
   * is truthy, and a half-formed URL would be a broken image instead of no
   * image.
   */
  it("returns an empty string for an absent key", () => {
    assert.equal(mediaUrl(null), "");
    assert.equal(mediaUrl(undefined), "");
    assert.equal(mediaUrl(""), "");
  });

  it("passes an already-absolute URL through, since OAuth avatars are stored whole", () => {
    const avatar = "https://lh3.googleusercontent.com/a/abc123";
    assert.equal(mediaUrl(avatar), avatar);
    assert.equal(mediaUrl("http://example.com/a.png"), "http://example.com/a.png");
  });

  /*
   * `encodeURI` would leave `;,?:@&=+$!*'()#` alone -- all legal in a storage
   * key, none of which survive a URL intact. A `#` in particular truncates the
   * path at the fragment and the image simply never loads.
   */
  it("percent-encodes the characters a URL would otherwise eat", () => {
    assert.ok(mediaUrl("blog/a b.webp").endsWith("/blog/a%20b.webp"));
    assert.ok(mediaUrl("blog/a#b.webp").endsWith("/blog/a%23b.webp"));
    assert.ok(mediaUrl("blog/a?b.webp").endsWith("/blog/a%3Fb.webp"));
    assert.ok(mediaUrl("blog/a&b.webp").endsWith("/blog/a%26b.webp"));
    assert.ok(mediaUrl("blog/a+b.webp").endsWith("/blog/a%2Bb.webp"));
  });

  it("leaves the separator alone, so the key stays a path", () => {
    assert.ok(mediaUrl("blog/nested/a.webp").endsWith("/blog/nested/a.webp"));
  });

  it("leaves the characters that are already URL-safe alone", () => {
    assert.ok(mediaUrl("blog/a-b_c.d~e.webp").endsWith("/blog/a-b_c.d~e.webp"));
  });

  it("encodes a multi-byte character as its UTF-8 bytes", () => {
    assert.ok(mediaUrl("blog/café.webp").endsWith("/blog/caf%C3%A9.webp"));
  });
});

describe("assetUrl", () => {
  it("resolves a bucket asset through the storage host", () => {
    assert.equal(
      assetUrl({ storageKey: "logo/a.webp", source: "storage" }),
      `${BASE}/logo/a.webp`,
    );
  });

  /*
   * A static asset keeps a site-relative path on purpose: it is served from the
   * same origin as whatever is asking, so it is correct in development, in the
   * admin and in production without anything having to know which it is.
   */
  it("keeps a static asset site-relative rather than pointing at a host", () => {
    assert.equal(assetUrl({ storageKey: "/static/svg/icon/go.svg", source: "static" }), "/static/svg/icon/go.svg");
  });

  it("gives a static asset a leading slash if the stored path lacks one", () => {
    assert.equal(assetUrl({ storageKey: "static/a.svg", source: "static" }), "/static/a.svg");
  });

  it("returns an empty string when there is no asset", () => {
    assert.equal(assetUrl(null), "");
    assert.equal(assetUrl(undefined), "");
    assert.equal(assetUrl({ storageKey: "", source: "storage" }), "");
  });

  it("treats an unrecognised source as a bucket key rather than failing", () => {
    assert.equal(assetUrl({ storageKey: "logo/a.webp", source: "" }), `${BASE}/logo/a.webp`);
  });
});
