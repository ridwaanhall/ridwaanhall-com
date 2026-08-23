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

There is exactly one privilege, `is_staff`, and it is **read from the database
on every request** — never carried in the session token. A token minted while
someone was staff would otherwise keep asserting it for the thirty days until it
expired, long after the flag was cleared.

Every admin page calls `requireStaff()` as its first `await`. Route handlers and
server actions do not nest under a layout at all, so they call
`isStaffRequest()` themselves.

**A layout is not an auth gate**, and this is the mistake worth stating out
loud: React renders a layout and its children concurrently, so a layout that
returns "not permitted" instead of `{children}` changes only what is *displayed*
— the page underneath still ran, and its data still ships in the payload below
the visible HTML. `scripts/check-admin.mjs` reads whole response bodies,
payload included, and fails if row data appears in one.

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

## Known gap: HTTP security headers

**This application does not currently set any HTTP security headers.** There is
no `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`,
`X-Content-Type-Options`, `Referrer-Policy` or `Permissions-Policy` configured
in `next.config.ts`, and Vercel does not add them.

If you are deploying this, add them. A `headers()` entry in `next.config.ts` is
the place. CSP in particular needs testing against the real pages before it is
enforced — start with `Content-Security-Policy-Report-Only`.

## If you are deploying this yourself

1. **HTTPS only.** Enable HSTS once you are confident the certificate chain and
   every subdomain are ready for it; HSTS is hard to walk back.
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
npx tsx scripts/check-rls.mjs                                 # RLS on every table
npx tsx scripts/check-admin.mjs                               # the admin gate leaks nothing
npx tsx --conditions=react-server scripts/check-turnstile.mjs # the spam gate fails closed
npx tsx --conditions=react-server scripts/check-storage.mjs   # reference-counted deletes
npx tsx --conditions=react-server scripts/check-site-console.mjs
npx tsx scripts/check-db-classes.mjs
```

Thank you for helping keep this project secure.
