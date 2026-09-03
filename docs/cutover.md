# Cutover

Switching the domain to this application, and retiring the schema the previous
build left behind.

The order matters, and the reason it matters is recoverable failure: nothing
here is irreversible until step 5, and step 5 is deliberately last.

---

## 1. Before you touch DNS

**Environment.** Every variable in `.env.example` that this site needs must be
set in the Vercel project, for the production environment. The build itself only
needs `STORAGE_POSTGRES_URL`, `STORAGE_SUPABASE_URL`, `NEXT_PUBLIC_BASE_URL` and
`AUTH_SECRET` — everything else fails quietly rather than loudly, which is
exactly why an unset one is easy to miss:

| Unset | What is broken, and how it looks |
|---|---|
| `AUTH_SECRET` | **Sign-in is dead**, and almost silently -- see below |
| `AUTH_GOOGLE_*` / `AUTH_GITHUB_*` | The sign-in button bounces straight back with `?error=Configuration` |
| `RESEND_API_KEY` | The contact form says it sent; no mail arrives |
| `DEFAULT_FROM_EMAIL` on an unverified domain | Every send 403s, naming the domain |
| `CF_TURNSTILE_SECRET_KEY` | **Spam verification passes by design.** The form works and the gate is open |
| `GITHUB_ACCESS_TOKEN` / `WAKATIME_API_KEY` | The dashboard panel is simply absent |
| `CRON_SECRET` | **Scheduled posts never appear.** Everything else works; the endpoint answers 503 and only the publish workflow's own log says so — and it needs setting as a repository secret too, matching |
| `STORAGE_SUPABASE_SERVICE_ROLE_KEY` | Admin uploads fail |

**OAuth redirect URIs.** Both providers need
`https://<your-domain>/api/auth/callback/google` and `.../github` registered.
Add them *alongside* whatever is registered now — do not replace, or sign-in
breaks on the old site the moment you save, before you have switched anything.

**`AUTH_SECRET`.** Use a fresh one for production. Sessions are thirty-day JWTs
signed with it; sharing it with any other environment means a token minted
anywhere is valid everywhere.

An unset one is the single most expensive variable on this page, because
everything else keeps working. The build succeeds. Every page renders. The
database is fine. `auth()` returns `null`, which is exactly what it returns for
a signed-out visitor anyway -- so nothing looks wrong until somebody presses
sign in and lands back on the page with `?error=Configuration` and no further
explanation. This happened. `scripts/check-auth-config.mjs` exists to make it a
five-second question:

```bash
node scripts/check-auth-config.mjs https://<your-domain>
```

It separates the three failures the error page cannot: no secret (`/api/auth/csrf`
answers 500), no client credentials (the provider list looks perfectly healthy
and the authorization URL carries no `client_id`), and a redirect URI nobody
registered -- for which it prints the exact string to paste into each console.

**Green before you start.** Everything in [Verification](#verification) below.

---

## 2. Switch the domain

Point the domain at the Vercel deployment.

---

## 3. Verify the switch itself

The pre-flight is one request. The previous build sets a `csrftoken` cookie and
serves its stylesheets from `/static/css/`; this one does neither:

```bash
curl -sS -D - -o /dev/null https://<your-domain>/ | grep -i csrftoken
curl -sS https://<your-domain>/ | grep -o '/static/css/'
```

Both must come back empty.

---

## 4. Verify the application, by hand

Automated checks cannot cover the things that depend on production
configuration. Each of these has failed for somebody at a cutover:

- **Run `node scripts/check-live-config.mjs https://<your-domain>` first.** It
  names every feature that is switched off because a variable never arrived --
  and this application degrades rather than crashes, so a hollow deployment
  returns 200 on every page and looks entirely healthy. Three were off at once
  on the first deployment of this site.
- **Then `node scripts/check-auth-config.mjs https://<your-domain>`.** It
  answers in seconds what clicking through answers in minutes, and it names the
  variable rather than leaving `?error=Configuration` to be interpreted.
- **Then sign in with Google, and sign out. Then GitHub.** The check proves the
  configuration; only a real round trip proves the consent screen, the account
  linking and the session cookie.
- **Post a guestbook message**, and check the notification email arrives. That
  is Resend, the from-domain and the recipient list in one.
- **Send the contact form.** Turnstile is in front of it, and its site key is
  `NEXT_PUBLIC_`, so a wrong one is baked into the build rather than read at
  runtime.
- **Open `/admin`, save a record with an image.** Uploads need the service-role
  key, and this is the only path that uses it.
- **Then look at the public page that record appears on.** It must show the
  change immediately. If it does not, cache invalidation is not reaching the
  tag — see `lib/data/tags.ts`, which is keyed by table name and fails silently
  when a key does not match.
- **Read the CSP reports.** The policy ships as `Content-Security-Policy-Report-Only`
  (`next.config.ts`), so a mistake logs rather than breaking the page. Once the
  reports are quiet, promoting it to `Content-Security-Policy` is renaming the
  header — and belongs in its own change.

---

## 5. Retire the old schema — done

The 42 tables the previous build left in `public` are dropped, along with their
sequences. The empty schema is kept: it is named in the default `search_path`
and Supabase's tooling assumes it exists, so this leaves the database in the
state a new project would have.

The parity check reported one gap before it ran — four posts whose view count
was one ahead in `public`, because the old build kept counting until the domain
moved. Those were carried across first, and nothing else differed.

The three files this step used are deleted, which each of them said to do.

What is worth carrying forward is why it was safe, since the same question
returns the next time a second schema appears. No foreign key crossed the two
schemas, nothing outside `public` depended on a table in it, and every extension
lives in `extensions` rather than there. The one real coupling was not an import
— those are all schema-qualified through `app-schema.ts` — but a table name
inside a raw `sql``` template, unqualified, which `search_path` resolved past
`app` into the old schema. Nothing type checks that. It was found by reading
every raw template in the runtime code, and proved by dropping the tables inside
a transaction and running the application's own queries before rolling back.

---

## Rollback

Point the domain back. That is the whole procedure, and it stays true right up
until step 5 — which is why step 5 is last and why nothing before it writes to
the old schema.

---

## Verification

Offline, and what CI runs:

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build && node scripts/check-css-sources.mjs
node scripts/check-fresh-start.mjs
npx tsx scripts/check-baseline-schema.mjs
npx tsx scripts/check-app-schema.mjs
npx tsx scripts/check-rls.mjs
```

Against a running app (`npm run dev`), or against the deployment by passing a
base URL:

```bash
node scripts/check-headers.mjs                    # or: node scripts/check-headers.mjs https://<domain>
npx tsx scripts/check-admin.mjs
npx tsx --conditions=react-server scripts/check-site-console.mjs
npx tsx --conditions=react-server scripts/check-admin-console.mjs
```

`CLAUDE.md` lists the rest.
