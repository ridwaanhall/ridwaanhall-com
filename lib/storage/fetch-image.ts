import "server-only";

import { lookup } from "node:dns/promises";

import {
  MAX_REMOTE_BYTES,
  extensionForType,
  filenameForLink,
  isPrivateAddress,
  parseImageLink,
  sniffImageType,
} from "@/lib/storage/link";

/**
 * Pulling an image the admin was given a link to.
 *
 * The link is a *source of bytes*, not a place the site points at. What comes
 * back is stored in the bucket under the same content-addressed key an upload
 * would get, so from the moment this returns there is no difference between an
 * image that was uploaded and one that was linked -- same `media_asset` row,
 * same reference counting, same URL, same `next/image` allow-list.
 *
 * That is the whole reason this module exists rather than a new `source` on
 * `media_asset`. Rendering a foreign host directly would need
 * `images.remotePatterns` in `next.config.ts` opened to arbitrary hostnames --
 * which makes `/_next/image` an open image proxy for anyone who finds it -- and
 * the CSP `img-src` widened to all of `https:`. It would also leave every image
 * on the site depending on somebody else's server staying up and permitting
 * hotlinks.
 *
 * Every rule this applies is in `lib/storage/link.ts`, which is pure and tested
 * offline. What is left here is sockets.
 */

/**
 * How long every link on one save may take, in total.
 *
 * The budget spans the operation rather than each call, and that distinction is
 * the one this codebase has already paid for twice -- once as a live 504 from
 * `putObject`, once as the cleanup budget. A gallery inline can carry seven
 * rows, so a per-fetch timeout bounds one fetch and says nothing at all about a
 * save. `saveRecord` opens one deadline and threads it through every field and
 * every inline row, so the eighth link fails with a sentence instead of the
 * whole save failing as a gateway error with nothing to say.
 */
export const REMOTE_FETCH_BUDGET_MS = 20_000;

/** One request. Clamped to whatever is left of the budget above. */
const REQUEST_TIMEOUT_MS = 8_000;

/**
 * Redirects are followed by hand, so each hop is checked like the first.
 *
 * `fetch` follows them transparently, which would mean vetting the address of
 * the host that was pasted and then connecting to whatever it forwarded to --
 * and a host answering `302 Location: http://169.254.169.254/` is the entire
 * trick. Three hops is enough for the CDN and shortener chains that occur in
 * practice.
 */
const MAX_REDIRECTS = 3;

export type FetchedImage = {
  bytes: Uint8Array;
  /** Named for `objectKeyFor`, with the extension the bytes earned. */
  filename: string;
  contentType: string;
};

export type FetchResult = { ok: true; image: FetchedImage } | { ok: false; error: string };

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

/**
 * Every address this hostname resolves to has to be one worth talking to.
 *
 * All of them, not the first: a name with an A record on a public address and a
 * second on `127.0.0.1` would otherwise be a coin toss, and the connection is
 * not made through the answer this inspected anyway.
 */
async function hostIsReachable(hostname: string): Promise<boolean> {
  // A URL keeps the brackets around a literal IPv6 host; neither the resolver
  // nor the range check wants them.
  const host = hostname.replace(/^\[/, "").replace(/\]$/, "");

  let addresses: { address: string }[];
  try {
    addresses = await lookup(host, { all: true, verbatim: true });
  } catch {
    // A name that does not resolve is not one to connect to, and saying so here
    // gives a better message than a socket error would.
    return false;
  }

  return addresses.length > 0 && addresses.every((entry) => !isPrivateAddress(entry.address));
}

/**
 * Read the body, giving up the moment it goes past the limit.
 *
 * Streamed rather than awaited whole. `response.arrayBuffer()` on a remote file
 * of unknown size buffers all of it before there is anything to measure, so a
 * limit applied afterwards is not a limit -- it is a report on how much memory
 * was already spent.
 */
async function readCapped(response: Response): Promise<Uint8Array | null> {
  const body = response.body;
  if (!body) return new Uint8Array();

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_REMOTE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const out = new Uint8Array(total);
  let at = 0;
  for (const chunk of chunks) {
    out.set(chunk, at);
    at += chunk.length;
  }
  return out;
}

/**
 * Fetch what a link points at, or say why it is not an image this will store.
 *
 * Every failure returns a sentence naming the actual problem, because this is
 * shown under the field on the form and "the upload failed" tells nobody
 * whether to fix the link, shrink the image, or paste something else entirely.
 */
export async function fetchLinkedImage(
  raw: string,
  { deadline = Date.now() + REMOTE_FETCH_BUDGET_MS }: { deadline?: number } = {},
): Promise<FetchResult> {
  const parsed = parseImageLink(raw);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  let url = parsed.url;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      return { ok: false, error: "Fetching the linked images took too long. Try one at a time." };
    }

    if (!(await hostIsReachable(url.hostname))) {
      return {
        ok: false,
        error: `${url.hostname} is not a host this can fetch from. Check the link, or upload the file instead.`,
      };
    }

    let response: Response;
    try {
      response = await fetch(url, {
        redirect: "manual",
        headers: {
          // Some hosts answer a request with no user agent with a 403, and a
          // few negotiate on Accept. Both are cheap to satisfy and awkward to
          // diagnose from a bare status code.
          Accept: "image/*,*/*;q=0.8",
          "User-Agent": "ridwaanhall.com admin image fetch",
        },
        signal: AbortSignal.timeout(Math.min(REQUEST_TIMEOUT_MS, remaining)),
      });
    } catch {
      // A timeout, a refused connection, a TLS failure. None of them are worth
      // repeating back verbatim: the reader can act on "could not reach it",
      // and cannot act on a socket error code.
      return { ok: false, error: `Could not reach ${url.hostname}. Check the link.` };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        return { ok: false, error: "That link redirects to nowhere." };
      }
      if (hop === MAX_REDIRECTS) {
        return { ok: false, error: "That link redirects too many times." };
      }

      let next: URL;
      try {
        // Relative, in the general case: `Location: /images/a.png` is legal.
        next = new URL(location, url);
      } catch {
        return { ok: false, error: "That link redirects somewhere this cannot read." };
      }
      // Through the same gate as the pasted link. A redirect to `file:///` or
      // to a URL carrying credentials is refused for the reasons it was there.
      const hopped = parseImageLink(next.toString());
      if (!hopped.ok) return { ok: false, error: hopped.error };
      url = hopped.url;
      continue;
    }

    if (!response.ok) {
      return { ok: false, error: `That link answered ${response.status}. Check that it still works.` };
    }

    return await readImage(response, url);
  }

  return { ok: false, error: "That link redirects too many times." };
}

/** What came back, checked against what it has to be to become an object. */
async function readImage(response: Response, url: URL): Promise<FetchResult> {
  const declared = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();

  /*
   * The declared length first, purely so the message can name the real size.
   * It is a hint and nothing rests on it -- a server may omit it or lie, which
   * is why `readCapped` measures the bytes regardless.
   */
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REMOTE_BYTES) {
    return {
      ok: false,
      error: `That image is ${megabytes(declaredLength)}; the limit is ${megabytes(MAX_REMOTE_BYTES)}.`,
    };
  }

  let bytes: Uint8Array | null;
  try {
    bytes = await readCapped(response);
  } catch {
    return { ok: false, error: `The download from ${url.hostname} did not finish.` };
  }

  if (bytes === null) {
    return { ok: false, error: `That image is larger than ${megabytes(MAX_REMOTE_BYTES)}.` };
  }
  if (bytes.length === 0) {
    return { ok: false, error: "That link returned an empty file." };
  }

  /*
   * The type comes from the bytes, never from the header.
   *
   * Whatever is decided here becomes the `Content-Type` Supabase serves the
   * object with, so trusting the claim would let a remote server put a page of
   * HTML into the bucket and have it served as an image from the storage host.
   * The declared type is used only to make this sentence useful.
   */
  const contentType = sniffImageType(bytes);
  if (!contentType) {
    return {
      ok: false,
      error: declared
        ? `That link is not an image this accepts -- it answered with ${declared}.`
        : "That link is not an image this accepts.",
    };
  }

  return {
    ok: true,
    image: {
      bytes,
      contentType,
      filename: filenameForLink(url, extensionForType(contentType)),
    },
  };
}
