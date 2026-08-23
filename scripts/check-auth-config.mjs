/**
 * Sign-in is actually configured, wherever this is pointed.
 *
 * Every other harness here checks the code. This one checks the environment the
 * code was handed, which is the half that has no compiler and no test and only
 * ever fails in production.
 *
 * It exists because sign-in broke on the live domain the moment it went up, with
 * `?error=Configuration` and nothing else to go on. The cause was one unset
 * variable -- `AUTH_SECRET` -- and it was invisible from every direction that
 * mattered: the build succeeded, the pages rendered, the database was fine, and
 * `auth()` returned `null` for a signed-out visitor exactly as it would have
 * anyway. The only symptom was a query parameter on a redirect.
 *
 * The three failures it separates, because they need different fixes and the
 * error page calls two of them the same thing:
 *
 *  1. **No secret.** `/api/auth/csrf` answers 500. Nothing can sign in, and
 *     nothing says why. This is the one that happened.
 *  2. **No client credentials.** Both endpoints answer 200 and the provider
 *     list looks perfectly healthy -- the failure waits until somebody presses
 *     the button, and then reports itself as the same `Configuration`. So this
 *     goes all the way to the provider's authorization URL and reads the
 *     `client_id` out of it.
 *  3. **A redirect URI nobody registered.** The commonest cutover failure and
 *     the only one that cannot be checked from here, because the answer lives
 *     in Google's and GitHub's consoles. What this can do is print the exact
 *     string they must contain, so it can be compared rather than remembered.
 *
 *   node scripts/check-auth-config.mjs [base]
 *
 * Read-only: it asks for a CSRF token and an authorization redirect, and
 * completes no sign-in. Nothing is written and no session is created.
 */

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

let failures = 0;
const check = (ok, label, detail = "") => {
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"}  ${label}${ok || !detail ? "" : `  ${detail}`}`);
};
const note = (text) => console.log(`  ..    ${text}`);

/** Where each provider must send the browser, and what proves it got there. */
const EXPECTED = {
  google: { host: "accounts.google.com", label: "Google" },
  github: { host: "github.com", label: "GitHub" },
};

/*
 * Auth.js issues a CSRF token as a cookie and expects it back alongside the
 * same value in the body -- the double-submit pattern. There is no cookie jar
 * in `fetch`, so the pairs are carried by hand.
 */
const jar = new Map();
const remember = (response) => {
  for (const raw of response.headers.getSetCookie?.() ?? []) {
    const [pair] = raw.split(";");
    const index = pair.indexOf("=");
    if (index > 0) jar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
  }
};
const cookies = () => [...jar].map(([name, value]) => `${name}=${value}`).join("; ");

const get = async (path) => {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: cookies() ? { cookie: cookies() } : {},
  });
  remember(response);
  return response;
};

console.log(`Sign-in configuration at ${BASE}\n`);

try {
  /* ------------------------------------------------------------- the secret */
  const csrf = await get("/api/auth/csrf");
  const csrfBody = await csrf.text();

  check(
    csrf.status === 200,
    "a CSRF token is issued, so the signing secret is set",
    csrf.status === 500
      ? "500 -- AUTH_SECRET is almost certainly unset in this environment"
      : `got ${csrf.status}`,
  );

  let csrfToken = null;
  try {
    csrfToken = JSON.parse(csrfBody).csrfToken ?? null;
  } catch {
    /* reported below */
  }
  check(Boolean(csrfToken), "and it is a token rather than an error page", csrfBody.slice(0, 90));

  /* ---------------------------------------------------------- the providers */
  const providers = await get("/api/auth/providers");
  let listed = {};
  if (providers.status === 200) {
    try {
      listed = JSON.parse(await providers.text());
    } catch {
      /* reported below */
    }
  }
  check(providers.status === 200, "the provider list is served", `got ${providers.status}`);

  for (const id of Object.keys(EXPECTED)) {
    check(id in listed, `${EXPECTED[id].label} is registered as a provider`);
  }

  /* --------------------------------------------- the authorization redirect */
  if (!csrfToken) {
    note("no CSRF token, so the authorization redirects cannot be checked");
  } else {
    for (const [id, expected] of Object.entries(EXPECTED)) {
      if (!(id in listed)) continue;

      const response = await fetch(`${BASE}/api/auth/signin/${id}`, {
        method: "POST",
        redirect: "manual",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          cookie: cookies(),
        },
        body: new URLSearchParams({ csrfToken, callbackUrl: `${BASE}/` }).toString(),
      });
      remember(response);

      const location = response.headers.get("location") ?? "";
      let url = null;
      try {
        url = new URL(location);
      } catch {
        /* reported below */
      }

      /*
       * A redirect back to the site's own error page is what a missing client
       * id looks like from out here -- the provider is listed, the button
       * works, and the browser is bounced straight back with `?error=`.
       */
      const bounced = url?.searchParams.get("error");
      check(
        url?.host === expected.host,
        `${expected.label} sends the browser to ${expected.host}`,
        bounced ? `bounced back with error=${bounced}` : location.slice(0, 100) || "no redirect",
      );
      if (url?.host !== expected.host) continue;

      const clientId = url.searchParams.get("client_id");
      check(
        Boolean(clientId),
        `${expected.label} was given a client id`,
        "the authorization URL carries none, so its credentials are unset",
      );

      /*
       * The redirect URI is built from the host that served this request, so it
       * is right by construction -- unless `AUTH_URL` overrides it with a host
       * that is not the one being used, which is its own kind of broken.
       */
      const redirectUri = url.searchParams.get("redirect_uri") ?? "";
      const expectedUri = `${BASE}/api/auth/callback/${id}`;
      check(
        redirectUri === expectedUri,
        `${expected.label} asks to come back to this site`,
        `it asks for ${redirectUri || "nothing"}, not ${expectedUri}`,
      );
      if (redirectUri) note(`register with ${expected.label}: ${redirectUri}`);
    }
  }
} catch (error) {
  failures++;
  console.log(`  FAIL  ${error.message}`);
  console.log(`\nIs ${BASE} reachable? (npm run dev, or pass a deployment URL)`);
}

console.log(
  failures === 0
    ? "\nSign-in is configured, and both providers are reachable."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
