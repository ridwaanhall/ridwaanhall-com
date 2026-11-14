/**
 * What every browser-driven harness needs to reach the app as somebody, in one
 * place.
 *
 * A base URL, the session cookie's name, a token salted with that name, and the
 * cookie's scope all have to agree with the address under test, and none of
 * them may be written down: Auth.js names its cookie
 * `__Secure-authjs.session-token` over https, and a cookie scoped to
 * `localhost` is never sent to a deployment, so a harness that fixes either
 * runs signed out against a real address while looking signed in. Every value
 * here is derived from the base URL, once, for every harness.
 *
 * Not a check: imported by the harnesses, and by `mint-session.mjs`.
 */

/** The app under test: argv[2] when it is an address, else the dev server, without a trailing slash. */
export function baseUrl(arg = process.argv[2]) {
  const raw = typeof arg === "string" && /^https?:\/\//.test(arg) ? arg : "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

/**
 * The cookie Auth.js reads at that address. It doubles as the salt a session
 * token is encoded with, so a mismatch is not a wrong cookie but an anonymous
 * request -- which reads as a failing gate rather than a mis-minted session.
 */
export function sessionCookieName(base) {
  return new URL(base).protocol === "https:" ? "__Secure-authjs.session-token" : "authjs.session-token";
}

/** Where a Playwright cookie for that address applies: its host, the whole path, secure over https. */
export function cookieScope(base) {
  const url = new URL(base);
  return { domain: url.hostname, path: "/", secure: url.protocol === "https:" };
}

/**
 * A session token for an account id, encoded the way Auth.js encodes one.
 * The token carries identity only: whether that account is staff is read from
 * the database on every request, so minting one for a reader gets a reader.
 */
export async function mintSession(sub, base, maxAgeSeconds = 60 * 10) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set; load .env.local before minting a session.");
  const { encode } = await import("next-auth/jwt");
  return encode({ token: { sub: String(sub) }, secret, salt: sessionCookieName(base), maxAge: maxAgeSeconds });
}

/** A ready-to-add Playwright cookie carrying a fresh session for `sub` at `base`. */
export async function sessionCookie(sub, base, maxAgeSeconds) {
  return { name: sessionCookieName(base), value: await mintSession(sub, base, maxAgeSeconds), ...cookieScope(base) };
}
