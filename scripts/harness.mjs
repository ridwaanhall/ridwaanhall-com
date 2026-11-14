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
 * The same goes for the two other things every harness used to write out for
 * itself: the line-per-check reporter, and a `pg` connection with TLS set the
 * way Supabase needs it.
 *
 * Not a check: imported by the harnesses, and by `mint-session.mjs`.
 */
import pg from "pg";

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

/**
 * One line per check, and the exit code at the end.
 *
 * `check(name, pass, detail)` prints `ok`/`FAIL`, the name, and the detail when
 * there is one -- or only when the check failed, with `{ detailOnFailure: true }`,
 * for a harness whose details are the explanation of a failure rather than a
 * reading worth seeing either way. It returns `pass` so a later step can
 * depend on it.
 * `finish(passed, hint)` prints the closing line and returns 0 or 1 for
 * `process.exit` (or `process.exitCode`, where a pool is still draining).
 * `passed` may be a function of the number of checks; `hint` follows the
 * failure count, for the harness that knows what a failure usually means.
 */
export function reporter({ detailOnFailure = false } = {}) {
  let total = 0;
  let failed = 0;
  const check = (name, pass, detail = "") => {
    total++;
    if (!pass) failed++;
    const shown = detail && !(pass && detailOnFailure);
    console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${shown ? `  ${detail}` : ""}`);
    return Boolean(pass);
  };
  const finish = (passed = (n) => `All ${n} checks passed.`, hint = "") => {
    if (failed === 0) {
      console.log(`\n${typeof passed === "function" ? passed(total) : passed}`);
      return 0;
    }
    console.log(`\n${failed} of ${total} checks FAILED.${hint ? ` ${hint}` : ""}`);
    return 1;
  };
  return { check, finish };
}

/**
 * Connection settings for the first of `names` that is set, as `lib/db/client.ts`
 * makes them: `pg` reads `sslmode=require` as `verify-full`, which Supabase's
 * certificate does not satisfy, so the parameter is stripped and TLS set in code
 * -- off only when the URL itself says `sslmode=disable`.
 */
export function connection(...names) {
  const name = names.find((candidate) => process.env[candidate]);
  if (!name) throw new Error(`${names.join(" or ")} is not set (see .env.example); load .env.local first.`);
  const url = new URL(process.env[name]);
  const ssl = url.searchParams.get("sslmode") === "disable" ? false : { rejectUnauthorized: false };
  url.searchParams.delete("sslmode");
  return { connectionString: url.toString(), ssl };
}

/** A pool through the transaction pooler, for a harness that queries rather than holding a session. */
export function pgPool(max = 2, ...names) {
  return new pg.Pool({ ...connection(...(names.length ? names : ["STORAGE_POSTGRES_URL"])), max });
}

/**
 * One direct connection, for DDL and anything that needs a session of its own
 * (a transaction spanning statements, `set local`): the transaction pooler
 * would hand each statement a different server connection.
 */
export function pgClient(...names) {
  return new pg.Client(connection(...(names.length ? names : ["STORAGE_POSTGRES_URL_NON_POOLING"])));
}
