import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { IMAGE_TYPES } from "./keys";
import {
  extensionForType,
  filenameForLink,
  isPrivateAddress,
  parseImageLink,
  sniffImageType,
} from "./link";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

/** A PNG signature followed by nothing in particular. */
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0);

describe("parseImageLink", () => {
  it("takes an ordinary https link", () => {
    const result = parseImageLink("https://example.com/logo.png");
    assert.ok(result.ok);
    assert.equal(result.url.hostname, "example.com");
  });

  it("trims what was pasted", () => {
    const result = parseImageLink("  https://example.com/a.png\n");
    assert.ok(result.ok);
    assert.equal(result.url.pathname, "/a.png");
  });

  /*
   * A `data:` URL is not a link to anywhere -- it is the bytes themselves, in a
   * text field with no size limit in front of it -- and `file:` would read the
   * disk of the server rather than anything remote.
   */
  it("refuses every scheme but http and https", () => {
    for (const link of [
      "data:image/png;base64,iVBORw0KGgo=",
      "file:///etc/passwd",
      "ftp://example.com/a.png",
      "javascript:alert(1)",
    ]) {
      assert.equal(parseImageLink(link).ok, false, link);
    }
  });

  it("refuses a link carrying credentials rather than stripping them", () => {
    const result = parseImageLink("https://user:secret@example.com/a.png");
    assert.equal(result.ok, false);
  });

  it("refuses what is not a link at all", () => {
    assert.equal(parseImageLink("").ok, false);
    assert.equal(parseImageLink("   ").ok, false);
    assert.equal(parseImageLink("example.com/a.png").ok, false);
  });

  it("says what to do rather than only that it failed", () => {
    const result = parseImageLink("example.com/a.png");
    assert.ok(!result.ok);
    assert.match(result.error, /https:\/\//);
  });
});

describe("isPrivateAddress", () => {
  it("lets a public address through", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "104.18.32.7", "2606:4700::1111"]) {
      assert.equal(isPrivateAddress(address), false, address);
    }
  });

  it("refuses every private and reserved IPv4 range", () => {
    for (const address of [
      "0.0.0.0",
      "10.0.0.1",
      "127.0.0.1",
      "100.64.0.1",
      "169.254.169.254",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "192.0.0.1",
      "192.0.2.1",
      "192.88.99.1",
      "198.18.0.1",
      "198.51.100.1",
      "203.0.113.1",
      "224.0.0.1",
      "255.255.255.255",
    ]) {
      assert.equal(isPrivateAddress(address), true, address);
    }
  });

  /* The ranges either side of a private block are public and must stay so. */
  it("does not overshoot the edges of a range", () => {
    assert.equal(isPrivateAddress("172.15.255.255"), false);
    assert.equal(isPrivateAddress("172.32.0.0"), false);
    assert.equal(isPrivateAddress("100.63.255.255"), false);
    assert.equal(isPrivateAddress("100.128.0.0"), false);
    assert.equal(isPrivateAddress("11.0.0.1"), false);
  });

  it("refuses the IPv6 ranges that mean the same thing", () => {
    for (const address of [
      "::",
      "::1",
      "fc00::1",
      "fd12:3456::1",
      "fe80::1",
      "fe80::1%eth0",
      "ff02::1",
      "2001:db8::1",
    ]) {
      assert.equal(isPrivateAddress(address), true, address);
    }
  });

  /*
   * The half of this that a v6-prefix check alone would wave through: the
   * address is a public-looking v6 one whose last four bytes are a private v4.
   */
  it("looks inside an IPv4 address wearing a v6 hat", () => {
    assert.equal(isPrivateAddress("::ffff:127.0.0.1"), true);
    assert.equal(isPrivateAddress("::ffff:169.254.169.254"), true);
    assert.equal(isPrivateAddress("64:ff9b::10.0.0.1"), true);
    assert.equal(isPrivateAddress("::ffff:8.8.8.8"), false);
  });

  /* An answer this cannot read is not one it will vouch for. */
  it("refuses anything it cannot parse", () => {
    for (const value of ["", "not-an-address", "1.2.3", "1.2.3.4.5", "999.1.1.1", "0x7f.0.0.1"]) {
      assert.equal(isPrivateAddress(value), true, value);
    }
  });
});

describe("sniffImageType", () => {
  it("reads each format from its own bytes", () => {
    assert.equal(sniffImageType(PNG), "image/png");
    assert.equal(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0)), "image/jpeg");
    assert.equal(sniffImageType(text("GIF89a...")), "image/gif");
    assert.equal(sniffImageType(text("RIFF    WEBPVP8 ")), "image/webp");
    assert.equal(sniffImageType(text("    ftypavif")), "image/avif");
  });

  it("reads an SVG through its opening tag", () => {
    assert.equal(sniffImageType(text('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), "image/svg+xml");
    assert.equal(sniffImageType(text('<?xml version="1.0"?>\n<svg viewBox="0 0 1 1"/>')), "image/svg+xml");
    assert.equal(sniffImageType(text("﻿<svg />")), "image/svg+xml");
  });

  /*
   * The case the whole function exists for. A server may label anything
   * `image/png`, and that label is what Supabase then serves the object with --
   * so a page of HTML would be stored and served as an image.
   */
  it("refuses bytes that are not an image, whatever they were called", () => {
    assert.equal(sniffImageType(text("<!doctype html><html><body>hi</body></html>")), null);
    assert.equal(sniffImageType(text('{"error":"not found"}')), null);
    assert.equal(sniffImageType(text("")), null);
    assert.equal(sniffImageType(bytes(0x00, 0x01, 0x02)), null);
  });

  /* An SVG element mentioned inside a page is not an SVG file. */
  it("does not take an HTML page containing an svg tag", () => {
    assert.equal(sniffImageType(text("<!doctype html><html><svg></svg></html>")), null);
  });

  it("does not take a truncated signature", () => {
    assert.equal(sniffImageType(bytes(0x89, 0x50, 0x4e)), null);
    assert.equal(sniffImageType(text("RIFF")), null);
  });
});

describe("extensionForType", () => {
  it("gives one canonical extension per type", () => {
    assert.equal(extensionForType("image/jpeg"), ".jpg");
    assert.equal(extensionForType("image/png"), ".png");
    assert.equal(extensionForType("image/svg+xml"), ".svg");
  });

  it("gives nothing for a type this does not store", () => {
    assert.equal(extensionForType("text/html"), "");
    assert.equal(extensionForType("image/bmp"), "");
  });
});

describe("filenameForLink", () => {
  const name = (link: string, extension = ".png") =>
    filenameForLink(new URL(link), extension);

  it("names the file after the last path segment", () => {
    assert.equal(name("https://example.com/logos/acme.png"), "acme.png");
  });

  /* The extension comes from the bytes, never from what the path claimed. */
  it("replaces whatever extension the path claimed", () => {
    assert.equal(name("https://example.com/a/logo.php"), "logo.png");
    assert.equal(name("https://example.com/a/logo.jpeg", ".webp"), "logo.webp");
  });

  it("ignores the query, which is not part of the name", () => {
    assert.equal(name("https://images.example.com/photo-1682?w=800&fm=jpg"), "photo-1682.png");
  });

  it("decodes an escaped segment", () => {
    assert.equal(name("https://example.com/my%20logo.png"), "my logo.png");
  });

  it("falls back to the host when the path names nothing", () => {
    assert.equal(name("https://example.com/"), "example.com.png");
    assert.equal(name("https://example.com"), "example.com.png");
    assert.equal(name("https://example.com/.png"), "example.com.png");
  });
});

describe("the two doors agree about what an image is", () => {
  /*
   * `sniffImageType` decides what a *linked* file is. `objectKeyFor` decides
   * whether an *uploaded* one is acceptable, and it keys on the extension
   * against `IMAGE_TYPES` -- so a type this sniffer accepts whose extension
   * that map has never heard of is a link that fetches perfectly and is then
   * refused on the last step, by a message about file types that names the
   * wrong problem entirely.
   *
   * Not two constants in one module compared against each other: `IMAGE_TYPES`
   * lives in `keys.ts` and is the upload door's rule. This is the seam between
   * them, which is the only place the pair can actually drift.
   */
  const samples: Record<string, Uint8Array> = {
    png: PNG,
    jpeg: bytes(0xff, 0xd8, 0xff, 0xe0),
    gif: text("GIF89a..."),
    webp: text("RIFF    WEBPVP8 "),
    avif: text("    ftypavif"),
    svg: text("<svg />"),
  };

  for (const [name, sample] of Object.entries(samples)) {
    it(`a linked ${name} is stored under an extension the upload door accepts`, () => {
      const contentType = sniffImageType(sample);
      assert.ok(contentType, `${name} was not recognised at all`);

      const extension = extensionForType(contentType);
      assert.notEqual(extension, "", `${contentType} has no extension`);
      assert.equal(IMAGE_TYPES[extension], contentType);
    });
  }
});
