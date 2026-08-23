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
| `AUTH_GOOGLE_*` / `AUTH_GITHUB_*` | The sign-in button does nothing |
| `RESEND_API_KEY` | The contact form says it sent; no mail arrives |
| `DEFAULT_FROM_EMAIL` on an unverified domain | Every send 403s, naming the domain |
| `CF_TURNSTILE_SECRET_KEY` | **Spam verification passes by design.** The form works and the gate is open |
| `GITHUB_ACCESS_TOKEN` / `WAKATIME_API_KEY` | The dashboard panel is simply absent |
| `STORAGE_SUPABASE_SERVICE_ROLE_KEY` | Admin uploads fail |

**OAuth redirect URIs.** Both providers need
`https://<your-domain>/api/auth/callback/google` and `.../github` registered.
Add them *alongside* whatever is registered now — do not replace, or sign-in
breaks on the old site the moment you save, before you have switched anything.

**`AUTH_SECRET`.** Use a fresh one for production. Sessions are thirty-day JWTs
signed with it; sharing it with any other environment means a token minted
anywhere is valid everywhere.

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

- **Sign in with Google, then sign out. Then GitHub.** This is what proves the
  redirect URIs and `AUTH_SECRET`.
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

## 5. Retire the old schema

**Only once steps 3 and 4 pass.** Until this point the previous build's data is
untouched and rolling back is a DNS change; after it, it is a restore.

```bash
npx tsx scripts/check-schema-parity.mjs           # anything `app` has not got?
npx tsx scripts/catch-up-from-public.mjs          # dry run, if it reported rows
npx tsx scripts/catch-up-from-public.mjs --apply
```

Back up before dropping. Then:

```bash
node scripts/apply-migration.mjs drizzle/9999_drop_public.sql          # read it
node scripts/apply-migration.mjs drizzle/9999_drop_public.sql --apply
npx tsx scripts/check-rls.mjs
```

Afterwards, delete `drizzle/9999_drop_public.sql`,
`scripts/check-schema-parity.mjs` and `scripts/catch-up-from-public.mjs`. All
three exist only for this moment.

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
