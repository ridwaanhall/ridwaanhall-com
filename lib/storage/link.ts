/**
 * The rules a pasted image link has to satisfy, as pure functions.
 *
 * An image field takes bytes from two places now: a file the browser posts, and
 * a link the server fetches. The fetch itself is I/O and lives in
 * `lib/storage/fetch-image.ts`; everything it *decides* lives here, so
 * `npm test` can cover the whole matrix offline. That module is `server-only`
 * -- it opens sockets and reads DNS -- and a `server-only` import throws under
 * the plain node test runner, which is what would otherwise leave these rules
 * reachable only by pasting a real link at a real page.
 *
 * The same split `lib/email/guestbook-plan.ts` made, for the same reason.
 */

/**
 * The largest image a link may pull.
 *
 * Deliberately its own constant rather than `MAX_UPLOAD_BYTES`, which it equals
 * today. That one is 4MB because Vercel refuses a *request body* over 4.5MB, and
 * a body limit says nothing about what the server may fetch on its own behalf.
 * Two limits, two reasons, free to diverge -- which they cannot do if they are
 * one number.
 */
export const MAX_REMOTE_BYTES = 4 * 1024 * 1024;

export type LinkProblem = { ok: false; error: string };
export type LinkResult = { ok: true; url: URL } | LinkProblem;

/**
 * Read a pasted link, or say why it is not one this will fetch.
 *
 * `http` and `https` only. A `data:` URL is not a link to anywhere -- it is the
 * bytes themselves, in a text field with no size limit in front of it -- and
 * `file:` would read the disk of the server rather than anything remote.
 *
 * Credentials in the URL are refused rather than stripped: a link carrying them
 * was copied from somewhere it should not have been, and quietly discarding half
 * of what somebody pasted is how a password ends up in a log instead of in the
 * message that would have flagged it.
 */
export function parseImageLink(raw: string): LinkResult {
  const text = raw.trim();
  if (!text) return { ok: false, error: "Paste a link, or choose a file." };

  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { ok: false, error: "That is not a link. It has to start with https://." };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, error: "A link has to start with https:// or http://." };
  }
  if (url.username || url.password) {
    return { ok: false, error: "That link carries a username or password. Use a plain link." };
  }
  if (!url.hostname) {
    return { ok: false, error: "That link names no host." };
  }

  return { ok: true, url };
}

/* ---------------------------------------------------------------------------
   Addresses
   --------------------------------------------------------------------------- */

/** The four octets of a dotted-quad, or `null` if it is not one. */
function ipv4Bytes(value: string): number[] | null {
  const parts = value.split(".");
  if (parts.length !== 4) return null;

  const bytes: number[] = [];
  for (const part of parts) {
    // `Number` would accept "0x7f", " 12" and "1e2"; an address octet is digits.
    if (!/^\d{1,3}$/.test(part)) return null;
    const byte = Number(part);
    if (byte > 255) return null;
    bytes.push(byte);
  }
  return bytes;
}

/**
 * The sixteen bytes of an IPv6 address, with `::` expanded and a trailing
 * embedded dotted-quad (`::ffff:127.0.0.1`) taken as its own four bytes.
 */
function ipv6Bytes(value: string): number[] | null {
  let text = value.toLowerCase();
  // A zone index (`fe80::1%eth0`) names an interface, not part of the address.
  const percent = text.indexOf("%");
  if (percent !== -1) text = text.slice(0, percent);

  /*
   * A trailing dotted-quad (`::ffff:127.0.0.1`) is rewritten as the two hex
   * groups it stands for, so the rest of this parses one notation rather than
   * two. Splicing it in beats carrying it alongside: the compressed `::` has to
   * be expanded against a known total, and a quad held separately is four bytes
   * the expansion does not know about -- which put `ffff` at bytes 6 and 7
   * instead of 10 and 11, and quietly let `::ffff:127.0.0.1` through as public.
   */
  const lastColon = text.lastIndexOf(":");
  if (lastColon !== -1 && text.slice(lastColon + 1).includes(".")) {
    const embedded = ipv4Bytes(text.slice(lastColon + 1));
    if (!embedded) return null;
    const word = (high: number, low: number) =>
      ((high << 8) | low).toString(16).padStart(4, "0");
    text = `${text.slice(0, lastColon + 1)}${word(embedded[0], embedded[1])}:${word(embedded[2], embedded[3])}`;
  }

  const halves = text.split("::");
  if (halves.length > 2) return null;

  const group = (part: string): number[] | null => {
    if (part === "") return [];
    const out: number[] = [];
    for (const piece of part.split(":")) {
      if (!/^[0-9a-f]{1,4}$/.test(piece)) return null;
      const word = Number.parseInt(piece, 16);
      out.push(word >> 8, word & 0xff);
    }
    return out;
  };

  const head = group(halves[0]);
  if (!head) return null;

  // No `::` at all, so every group has to be written out.
  if (halves.length === 1) return head.length === 16 ? head : null;

  const rest = group(halves[1]);
  if (!rest) return null;

  const known = head.length + rest.length;
  if (known > 16) return null;
  return [...head, ...new Array<number>(16 - known).fill(0), ...rest];
}

/** Is this dotted-quad one no request should ever leave the machine for? */
function isPrivateIpv4(b: number[]): boolean {
  const [a, second, third] = b;
  if (a === 0) return true; // 0.0.0.0/8, "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 100 && second >= 64 && second <= 127) return true; // carrier-grade NAT
  if (a === 169 && second === 254) return true; // link-local, and the metadata address
  if (a === 172 && second >= 16 && second <= 31) return true; // private
  if (a === 192 && second === 168) return true; // private
  if (a === 192 && second === 0 && third === 0) return true; // IETF protocol assignments
  if (a === 192 && second === 0 && third === 2) return true; // TEST-NET-1
  if (a === 192 && second === 88 && third === 99) return true; // 6to4 relay anycast
  if (a === 198 && (second === 18 || second === 19)) return true; // benchmarking
  if (a === 198 && second === 51 && third === 100) return true; // TEST-NET-2
  if (a === 203 && second === 0 && third === 113) return true; // TEST-NET-3
  if (a >= 224) return true; // multicast, reserved, and 255.255.255.255
  return false;
}

/**
 * Whether an address is one this server must not be talked into fetching.
 *
 * The address, not the hostname: a name is only a lookup away from any of these,
 * and a host resolving to `169.254.169.254` is the whole trick. The caller
 * resolves first and asks this about every answer it got back.
 *
 * Both families, and the two ways an IPv6 address can carry an IPv4 one --
 * `::ffff:10.0.0.1` (mapped) and `64:ff9b::10.0.0.1` (NAT64) -- because testing
 * only the v6 prefixes of those two would wave the embedded private address
 * straight through.
 *
 * **This narrows the hole rather than closing it.** A name is resolved here and
 * connected to a moment later, and nothing stops the answer changing in between;
 * pinning the socket to the address that was checked is the only complete fix
 * and is not something `fetch` offers. The admin behind this is staff-gated,
 * which is what makes the remaining gap a reasonable trade rather than an
 * oversight -- said plainly here so the next reader does not assume otherwise.
 */
export function isPrivateAddress(value: string): boolean {
  const v4 = ipv4Bytes(value.trim());
  if (v4) return isPrivateIpv4(v4);

  const v6 = ipv6Bytes(value.trim());
  // Something this cannot parse is not something it will vouch for.
  if (!v6) return true;

  // ::ffff:a.b.c.d -- an IPv4 address wearing a v6 hat.
  const mapped = v6.slice(0, 10).every((byte) => byte === 0) && v6[10] === 0xff && v6[11] === 0xff;
  // 64:ff9b::/96 -- NAT64, which carries the v4 address in its last four bytes.
  const nat64 =
    v6[0] === 0x00 && v6[1] === 0x64 && v6[2] === 0xff && v6[3] === 0x9b &&
    v6.slice(4, 12).every((byte) => byte === 0);
  if (mapped || nat64) return isPrivateIpv4(v6.slice(12));

  if (v6.every((byte) => byte === 0)) return true; // ::, unspecified
  if (v6.slice(0, 15).every((byte) => byte === 0) && v6[15] === 1) return true; // ::1, loopback
  if ((v6[0] & 0xfe) === 0xfc) return true; // fc00::/7, unique local
  if (v6[0] === 0xfe && (v6[1] & 0xc0) === 0x80) return true; // fe80::/10, link-local
  if (v6[0] === 0xff) return true; // ff00::/8, multicast
  if (v6[0] === 0x20 && v6[1] === 0x01 && v6[2] === 0x0d && v6[3] === 0xb8) return true; // 2001:db8::/32

  return false;
}

/* ---------------------------------------------------------------------------
   What the bytes actually are
   --------------------------------------------------------------------------- */

/**
 * The extension each accepted content type is stored under.
 *
 * Written out rather than derived by reversing `IMAGE_TYPES`, because that map
 * is many-to-one -- `.jpg` and `.jpeg` both mean `image/jpeg` -- and a reversal
 * picks whichever happened to come last. The canonical choice belongs in the
 * open, where changing it is a decision rather than a reordering.
 */
const EXTENSIONS: Record<string, string> = {
  "image/webp": ".webp",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/avif": ".avif",
  "image/svg+xml": ".svg",
};

export function extensionForType(contentType: string): string {
  return EXTENSIONS[contentType] ?? "";
}

const ascii = (bytes: Uint8Array, start: number, end: number) =>
  String.fromCharCode(...bytes.slice(start, end));

/**
 * SVG is text, so it has no magic number -- the test is that it opens as XML or
 * as an `svg` element, once a byte-order mark and any leading whitespace,
 * declaration, doctype or comment are out of the way.
 *
 * Accepted for exactly the reason an *uploaded* SVG is: it is served from the
 * storage host rather than from the origin of this site, so a script inside one
 * runs somewhere it can reach nothing. Refusing it here while `IMAGE_TYPES`
 * accepts it would also mean the 74 skill icons could be uploaded but never
 * linked, which is the one place a link is most obviously useful.
 */
function isSvg(bytes: Uint8Array): boolean {
  let head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.slice(0, 1024))
    .replace(/^﻿/, "")
    .trimStart();

  /*
   * Everything a root element may legitimately hide behind, taken off in a loop
   * because there can be several of them in any order.
   *
   * The root element itself is then the test, and it has to be: an HTML page
   * containing an inline `<svg>` also starts with `<` and also contains the
   * string, so a looser check reads every such page as an image and stores it
   * as one.
   */
  let previous = "";
  while (head !== previous) {
    previous = head;
    head = head
      .replace(/^<\?[\s\S]*?\?>/, "")
      .replace(/^<!--[\s\S]*?-->/, "")
      .replace(/^<!DOCTYPE[^>[]*(\[[\s\S]*?\])?[^>]*>/i, "")
      .trimStart();
  }

  return /^<svg[\s/>]/i.test(head);
}

/**
 * What these bytes are, read from the bytes themselves.
 *
 * **A `Content-Type` header is a claim, not an answer.** A server is free to
 * label anything `image/png`, and that header is what decides how Supabase then
 * serves the object -- so believing it is how a page of HTML ends up stored and
 * served as an image from the storage host of this site. The header is used for
 * the wording of the error when this returns nothing, and for nothing else.
 *
 * Returns the canonical type, or `null` for bytes that are not an image kind
 * this accepts. The list is `IMAGE_TYPES` and no wider: an upload and a link
 * have to agree about what an image is, or the two doors into one bucket have
 * two different allow-lists.
 */
export function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && ascii(bytes, 1, 4) === "PNG" &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")) {
    return "image/gif";
  }
  // RIFF....WEBP -- the four bytes between the two are the chunk size.
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") {
    return "image/webp";
  }
  // An ISO base-media file: `ftyp` at offset 4, then the brand it declares.
  if (bytes.length >= 12 && ascii(bytes, 4, 8) === "ftyp") {
    const brand = ascii(bytes, 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  if (isSvg(bytes)) return "image/svg+xml";

  return null;
}

/**
 * A filename for a link, so `objectKeyFor` has a stem to name the object after.
 *
 * The last path segment, minus whatever extension it claimed, plus the one the
 * bytes earned. Both halves matter: a link like `.../photo-1682?w=800&fm=jpg`
 * has no usable extension in its path at all, and one ending `.php` would
 * otherwise name a `.php` object holding a PNG.
 *
 * `objectKeyFor` slugifies this and truncates it to fit, so it only has to be
 * reasonable rather than clean.
 */
export function filenameForLink(url: URL, extension: string): string {
  let segment = "";
  try {
    segment = decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? "");
  } catch {
    // A malformed escape in the path. The hostname below is a better name than
    // the percent-encoding, and a great deal better than throwing.
  }

  const dot = segment.lastIndexOf(".");
  const stem = (dot === -1 ? segment : segment.slice(0, dot)).trim();

  return `${stem || url.hostname || "image"}${extension}`;
}

