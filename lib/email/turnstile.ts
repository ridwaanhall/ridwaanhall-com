import "server-only";

import { turnstileMode } from "./turnstile-mode";

/**
 * Cloudflare Turnstile verification.
 *
 * The rule that matters: **verification failing for any reason is a
 * rejection**, never a pass. A network error, a timeout, a malformed response
 * — all of them return `false`, because the alternative is a spam filter that
 * opens itself whenever Cloudflare is slow.
 *
 * The site key is public and rendered into the widget; only the secret is read
 * here, and only on the server.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 10_000;

// Once per server instance: the refusal itself repeats on every submission, and
// a log line per spam attempt would bury the one that says what to fix.
let warnedMissingSecret = false;

/** Whether the form should render a widget at all. */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.CF_TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: string | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.CF_TURNSTILE_SECRET_KEY;

  // With no secret there is nothing to verify against. Under `next dev` that
  // passes, so a checkout without Cloudflare credentials can still send the
  // form; on any built server it refuses, because an unset secret in production
  // used to mean no spam check at all on an anonymous form that sends mail to
  // an address the sender chooses. `lib/email/turnstile-mode.ts` says why the
  // line is drawn on `NODE_ENV`.
  const mode = turnstileMode(secret, process.env.NODE_ENV);
  if (mode === "skip") return true;
  if (mode === "refuse" || !secret) {
    if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.error("CF_TURNSTILE_SECRET_KEY is not set; refusing every Turnstile-gated submission.");
    }
    return false;
  }

  if (!token) {
    console.warn("No Turnstile token provided");
    return false;
  }

  try {
    const body = new URLSearchParams({ secret, response: token });
    // Cloudflare uses this to bind the token to the client that solved it.
    if (remoteIp) body.set("remoteip", remoteIp);

    const response = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const result = (await response.json()) as { success?: boolean; "error-codes"?: string[] };
    if (result.success) return true;

    console.warn(`Turnstile verification failed: ${(result["error-codes"] ?? []).join(", ")}`);
    return false;
  } catch (error) {
    console.error("Turnstile verification request failed:", error);
    return false;
  }
}
