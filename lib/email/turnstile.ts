import "server-only";

/**
 * Cloudflare Turnstile verification.
 *
 * A port of `apps/core/validators.py`. The rule that matters is the one the
 * original also followed: **verification failing for any reason is a
 * rejection**, never a pass. A network error, a timeout, a malformed response
 * — all of them return `false`, because the alternative is a spam filter that
 * opens itself whenever Cloudflare is slow.
 *
 * The site key is public and rendered into the widget; only the secret is read
 * here, and only on the server.
 */
const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TIMEOUT_MS = 10_000;

/** Whether the form should render a widget at all. */
export function turnstileEnabled(): boolean {
  return Boolean(process.env.CF_TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY);
}

export async function verifyTurnstile(token: string | null, remoteIp?: string): Promise<boolean> {
  const secret = process.env.CF_TURNSTILE_SECRET_KEY;

  // With no secret configured there is nothing to verify against, so the form
  // works in a checkout that has no Cloudflare credentials. Note this is the
  // one path that does not fail closed -- an unset secret in production means
  // no spam check at all.
  if (!secret) return true;

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
