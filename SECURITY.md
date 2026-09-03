# Security Policy

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Send the details to [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com) and include
what you found, how to reproduce it, what an attacker could do with it, and any
mitigation you would suggest.

You will get an acknowledgement within 48 hours, an assessment and a timeline
after that, and progress updates while it is open. Once it is fixed you will be
credited, unless you would rather not be.

For hardening suggestions that are not live vulnerabilities, a GitHub issue
prefixed `[Security]` is fine.

## Supported versions

Dependencies are pinned in `package.json` and `package-lock.json`. Only the
current `main` is supported; fixes are not backported. Dependabot alerts are
watched and security releases are taken promptly.

## What the application actually does

### Authentication

Sign-in is Google or GitHub OAuth through Auth.js v5 — there is no password
column in the database and nothing to leak if it were read. Sessions are
thirty-day JWTs holding an account id and nothing else; no session table exists.

Accounts are never linked by email address. Signing in with GitHub using the
address an existing Google account holds is refused with `OAuthAccountNotLinked`
rather than joining the two, because an address is a claim by whichever provider
asserted it and treating two providers' claims as one identity is how account
takeover works. `allowDangerousEmailAccountLinking` is set on neither provider.

### Authorization

Three roles, and **all of them are read from the database on every request** —
never carried in the session token. A token minted while someone was staff would
otherwise keep asserting it for the thirty days until it expired, long after the
flag was cleared, and a token carrying a whole *grant set* would keep asserting
delete on every screen for just as long.

- `is_active` — may write anything at all. It gates `/admin` and, since the
  public site grew permissions of its own, every public capability too:
  commenting, the guestbook, pinning, moderating. It does **not** refuse the
  sign-in itself, which is an Auth.js callback away and deliberately not taken —
  the flag exists to stop the writing, not the reading.
- `is_staff` — may reach `/admin`. What they reach inside it comes from
  `app.admin_access`: one row per screen, with `view`, `add`, `change` and
  `delete` as four independent booleans. On the public site it is the moderator:
  delete anybody's comment, pin a guestbook message.
- `is_superuser` — answers yes to every screen and every action, is the only
  role that may edit anybody's grants, and the only one that may delete a
  guestbook message outright. `account_superuser_is_staff` refuses a superuser
  who is not staff, so the roles nest rather than overlap.

Everything else is **public**: any signed-in reader may comment and write in the
guestbook, subject to two switches on `app.public_access` (one row per account,
both defaulting to true) that exist so one person can be stopped without
deleting their account and every comment they ever wrote.

`lib/auth/permissions.ts` is the whole rule, as a pure function, tested offline.
Three parts of it fail *open* if a caller reasons about the rows itself, so
nothing does: a grant naming a screen the registry no longer has is refused
rather than honoured; the Access screen is never grantable, because granting the
ability to grant is granting everything; and a grant may not widen what a model
already refuses.

Every admin page calls `requireStaff()` as its first `await` and its screen's
`view` check as its second, before any query runs. Route handlers and server
actions do not nest under a layout at all, so they call `isStaffRequest()` and
`permits()` themselves.

**No role gets past a foreign key.** `ON DELETE RESTRICT` is a property of the
schema, not a permission this application grants, so a superuser deleting an
organization five certifications still name is refused exactly as anybody else
is. What the admin does is name the rows in the way —
`lib/admin/blockers.ts`.

**A layout is not an auth gate**, and this is the mistake worth stating out
loud: React renders a layout and its children concurrently, so a layout that
returns "not permitted" instead of `{children}` changes only what is *displayed*
— the page underneath still ran, and its data still ships in the payload below
the visible HTML. `scripts/check-admin.mjs` reads whole response bodies,
payload included, and fails if row data appears in one.

The same hazard exists one level down, and
`scripts/check-admin-access.mjs` is what holds it: the rail can hide a screen
perfectly while its route still runs the query for somebody who may not see it.
That harness creates a staff account with a narrowed grant set, reads the whole
body of a screen it was not granted, and fails on any row data in it.

### Row Level Security

Supabase serves a PostgREST API over the schemas it is configured to expose, to
anyone holding the project's anon key and independently of this application.
Every table has RLS **enabled with zero policies** — which is the intended state,
not an oversight: the role this application connects as has `rolbypassrls`, so
its own queries are unaffected, and everything else is refused by default rather
than by a rule somebody has to get right.

`scripts/check-rls.mjs` fails if any table in any schema this project owns ever
appears without it, and enumerates the schemas rather than reading a list, so a
new one is covered from the moment it exists.

### Injection

- **SQL**: every query goes through Drizzle and is parameterised. No string
  interpolation reaches the database.
- **Invalid keys**: a value from a URL or a form is checked with `isUuid()`
  before it reaches a query. Postgres raises `22P02` for a malformed uuid, which
  would turn "no such row" into a 500.
- **HTML**: stored rich text is rendered through `dangerouslySetInnerHTML`, so
  it passes `lib/utils/sanitize.ts` first — a strict allow-list of tags and
  attributes, `http`/`https`/`mailto` links only, and exactly one permitted
  class pattern (`language-*` on `<code>`). Anything outside it is dropped.
  Everything else React escapes by default.
- **GraphQL**: the GitHub API is called with parameterised queries, never
  interpolated ones.

### Cross-site request forgery

Mutations are Next.js Server Actions, which are POST-only to an unguessable
generated endpoint and verify the request `Origin` against the `Host` before the
action body runs. There is no CSRF token to manage, and no state-changing GET.

### Spam and abuse

The contact form is behind Cloudflare Turnstile, and it **fails closed** — a
missing, empty or forged token is rejected. `scripts/check-turnstile.mjs`
proves that against the real Cloudflare endpoint. Guestbook messages are length
limited and posted only by signed-in accounts.

### Secrets

Every credential is an environment variable and none is committed. The Supabase
service-role key is read only in server modules and never crosses to the client;
only `NEXT_PUBLIC_`-prefixed values are exposed to the browser, which is also
why `components/admin/field.tsx` resolves image URLs on the server and passes
them down rather than building them from `process.env` in shared code.

### Uploads

Uploaded files are named after their contents, so the same bytes uploaded twice
are one object. Deletion is reference-counted across every column that can name
a file — one photo can easily be named by twenty rows, and deleting it because
one of them stopped pointing at it would break the other nineteen.
`scripts/check-storage.mjs` proves the column list against the live catalogue.

## HTTP security headers

`next.config.ts` sets seven, on every path: `Strict-Transport-Security`
(two years, `includeSubDomains`, `preload`), `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`,
`Permissions-Policy` denying every powerful feature, and a content security
policy. `scripts/check-headers.mjs` asserts all of them against a running app.

Each origin in the policy is one the application actually loads from, and
nothing else: the Turnstile widget and its frame, the Supabase host that serves
uploaded media, and the three avatar hosts the guestbook and comments render
from. The one exception is `static.cloudflareinsights.com`, which is listed
because Cloudflare injects that script at its proxy whether or not the app asks
for it. Widening a CSP is free and silent, so keep it to what breaks without it.

### Known gap: the policy is report-only

The header is `Content-Security-Policy-Report-Only`, so **nothing is blocked**.
That is the state to fix rather than the state to keep, and promoting it is
renaming the header — plus adding back `upgrade-insecure-requests`, which a
browser ignores in report-only mode and complains about on every page load.

Two things are worth knowing before you promote it:

- `'unsafe-inline'` on `script-src` is deliberate and not removable here. The
  theme is applied by a blocking pre-paint script, and the JSON-LD blocks are
  inline scripts that CSP governs like any other. A nonce cannot be threaded
  through a tree prerendered under `cacheComponents`, where the HTML exists
  before any request does.
- The rest of the policy still carries its weight without that — `default-src`,
  `object-src 'none'`, `frame-ancestors 'none'`, `form-action` and a
  `connect-src` that names two origins are what stop an injected script
  loading or sending anything.

## If you are deploying this yourself

1. **HTTPS only, and HSTS is already on.** The header ships with a two-year
   `max-age`, `includeSubDomains` and `preload`. A browser that has seen it
   refuses plain HTTP for the whole window whatever the site later says, so be
   sure every subdomain is served over TLS *before* your first deploy, not
   after.
2. **Your own credentials.** Generate a fresh `AUTH_SECRET`, use your own OAuth
   applications, and register the redirect URIs for your domain. Never reuse
   the values from a fork.
3. **Your own database.** There is no local database in development — the
   connection string points at the real project in both, so a write from
   `/admin` on `localhost` is a live write. Point it at your own Supabase
   project before you touch anything.
4. **Keep RLS on.** Run `npx tsx scripts/check-rls.mjs` after any schema change.
   Review generated SQL line by line: tools that do not model RLS emit
   `DISABLE ROW LEVEL SECURITY`, and running that unedited opens the schema to
   anyone with the anon key.
5. **Restrict the service-role key.** It bypasses RLS by design. It belongs in
   server environment variables and nowhere else.
6. **Rate limiting.** Not implemented. Vercel's firewall or a Cloudflare rule in
   front of `/api/` and the server actions is the straightforward option if you
   expect abuse.

## Verification

The `scripts/check-*.mjs` harnesses each drive the real application against the
real database and clean up after themselves. The ones that carry a security
claim:

```bash
node scripts/check-headers.mjs                                # every header, every origin
npx tsx scripts/check-rls.mjs                                 # RLS on every table
npx tsx scripts/check-admin.mjs                               # the admin gate leaks nothing
npx tsx --conditions=react-server scripts/check-turnstile.mjs # the spam gate fails closed
npx tsx --conditions=react-server scripts/check-storage.mjs   # reference-counted deletes
npx tsx --conditions=react-server scripts/check-site-console.mjs
npx tsx scripts/check-db-classes.mjs
```

Thank you for helping keep this project secure.
