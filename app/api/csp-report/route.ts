import type { NextRequest } from "next/server";

/**
 * Where the content security policy's violation reports land.
 *
 * The policy has been `Content-Security-Policy-Report-Only` since it was
 * written, and the comment above it in `next.config.ts` says the way to decide
 * whether it is right is to watch what it reports on real traffic. Nothing was
 * watching: there was no `report-to` and no `report-uri`, so the policy blocked
 * nothing and reported nowhere, and the condition it set for promoting itself
 * could never be met.
 *
 * Two shapes arrive here, because two generations of the feature are in the
 * field. The Reporting API posts `application/reports+json` -- an array of
 * envelopes, each with a `body` -- and the deprecated `report-uri` posts
 * `application/csp-report`, one object under a `csp-report` key. Safari still
 * only speaks the second, so both directives are set and both are parsed.
 *
 * Unauthenticated, and it has to be: the browser sends these with no
 * credentials and no CORS preflight the site controls. That makes it a hole
 * anyone can post to, so it does the least it can -- reads a bounded body,
 * writes one line per report, and answers 204. It touches no database.
 */

/** Big enough for a real report, small enough that a flood costs nothing. */
const MAX_BYTES = 64 * 1024;

type Report = Record<string, unknown>;

export async function POST(request: NextRequest) {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) return new Response(null, { status: 413 });

  let payload: unknown;
  try {
    const text = await request.text();
    // A `content-length` can be absent or wrong; this is the limit that holds.
    if (text.length > MAX_BYTES) return new Response(null, { status: 413 });
    payload = JSON.parse(text);
  } catch {
    // A malformed report is not worth a 400 nobody will read. Drop it.
    return new Response(null, { status: 204 });
  }

  for (const report of normalise(payload)) {
    /*
     * One line, and deliberately only these fields. A report also carries the
     * full URL of the page and the source line that tripped it, which on this
     * site can hold a slug somebody was reading -- that is a visitor's browsing
     * in the log drain, in exchange for nothing a policy decision needs.
     */
    console.warn(
      "[csp] %s blocked %s (%s)",
      report["effective-directive"] ?? report.effectiveDirective ?? "unknown-directive",
      report["blocked-uri"] ?? report.blockedURL ?? "unknown",
      report.disposition ?? "report",
    );
  }

  return new Response(null, { status: 204 });
}

/** The two wire formats, flattened to the reports themselves. */
function normalise(payload: unknown): Report[] {
  if (Array.isArray(payload)) {
    // Reporting API: [{ type, url, body }, ...]. Other report types share this
    // endpoint only if something asks them to; filter to ours.
    return payload
      .filter((entry): entry is { type?: string; body?: Report } => typeof entry === "object" && entry !== null)
      .filter((entry) => entry.type === undefined || entry.type === "csp-violation")
      .map((entry) => entry.body ?? {});
  }
  if (typeof payload === "object" && payload !== null && "csp-report" in payload) {
    const legacy = (payload as { "csp-report"?: Report })["csp-report"];
    return legacy ? [legacy] : [];
  }
  return [];
}
