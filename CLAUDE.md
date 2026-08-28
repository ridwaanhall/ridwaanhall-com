# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Stack

Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, TypeScript,
Tailwind CSS v4. Data comes from Supabase Postgres through Drizzle ORM over
`node-postgres`; uploaded media lives in Supabase Storage. Auth is Auth.js v5
with Google and GitHub. Deployed to Vercel, and to Cloudflare Workers
through OpenNext at `v3.ridwaanhall.com` -- see **Deployment** below.

### The Next.js docs are in `node_modules`

`node_modules/next/dist/docs/` is this exact version's documentation, shipped
inside the package. **Read the relevant page there before writing anything
framework-shaped**, rather than recalling how Next.js works —
`01-app/03-api-reference/` for file conventions, directives and config, and the
`version-16` page under `01-app/02-guides/upgrading/` for what moved.

Recall is the worse source here because 16 changed the answers, not just the
API surface: `middleware` was renamed `proxy`, the request APIs became
async-only, `cacheLife` and `cacheTag` lost their `unstable_` prefix,
`unstable_cache` was replaced by `"use cache"`, `revalidateTag` grew a required
second argument, and the error boundary's `reset` gave way to `retry`. Every
one of those is something a confident wrong answer looks exactly like a right
one.

`AGENTS.md` carries the same instruction, but `next dev` rewrites that file, so
it is not somewhere to add anything. This is.

## The schema

Everything reads and writes the **`app`** schema: 45 tables, uuid keys, real
foreign keys with real referential actions, row-level security on every one.

`drizzle/0000_init.sql` is the whole of it, in one file, and it runs against an
empty database. There is no ladder of migrations to replay — change that file,
apply it, and re-run the two checks below.

```bash
node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
node scripts/gen-app-schema.mjs                # regenerate the Drizzle mapping
npx tsx scripts/check-baseline-schema.mjs      # the file still builds this schema
npx tsx scripts/check-app-schema.mjs           # the mapping still matches it
```

`lib/db/app-schema.ts` is **generated**, never edited by hand: 45 tables of
column names is exactly the transcription that fails silently, because a
mistyped SQL name is a column the app writes to and never reads back.
`drizzle-kit pull` cannot produce it — with `schemaFilter: ["app"]` it fetches
zero tables — which is why the generator reads `information_schema` instead.

`check-baseline-schema.mjs` is the one that keeps the setup instructions honest:
it applies `0000_init.sql` into a scratch schema inside a transaction, compares
columns, keys, foreign-key actions, checks, indexes and RLS against the live
schema, and rolls back.

### One schema left to retire

There is still a `public` schema in the database, left by the site's previous
build, and it is **not** this application's — nothing in this codebase reads it.
It goes when the domain is switched over: `drizzle/9999_drop_public.sql` has the
pre-flight and the order to do it in. `scripts/check-schema-parity.mjs` and
`scripts/catch-up-from-public.mjs` exist only for that moment and are deleted
with it.

## Commands

```bash
npm install
npm run dev            # http://localhost:3000
npm run build
npm run lint           # eslint
npx tsc --noEmit       # types
```

```bash
npm test               # unit tests, offline
npm run test:watch
```

`npm test` is `node --import tsx --test` over `lib/**/*.test.ts` — the built-in
runner, no test framework. It covers the pure logic and needs neither a database
nor a browser, which is what lets CI run it: `tests/setup.ts` points the database
URL at nowhere before any module loads, so a test that tried to query fails at
connect rather than reaching anything real. That failure is the signal the test
belongs in a harness instead.

Everything that *does* need the real thing is a harness under `scripts/`, each
driving the live application and cleaning up after itself — see
**Verification** below.

## Everything reads the live database

There is no local database and no fixtures. `STORAGE_POSTGRES_URL` points at the
production Supabase project in development as well, so a page rendered locally
is showing live content and a write from the admin is a live write.

That is a deliberate trade, and it is why every harness that writes snapshots
what it touched and restores it in a `finally` that then proves the restore.
Follow that pattern for anything new. Rows a harness creates carry a `zz-`
prefix so a leftover is obviously a harness's and not real content.

## Deployment

Two targets, from the same tree. Vercel is unchanged and remains the primary:
`vercel.json` still pins `sin1` and nothing about that build has moved.
`v3.ridwaanhall.com` is the same application on **Cloudflare Workers**, built by
[OpenNext](https://opennext.js.org/cloudflare) -- `wrangler.jsonc` declares the
bindings, `open-next.config.ts` chooses the cache implementations, and each
choice is written up beside itself in those two files rather than repeated here.

```bash
npm run cf-build      # next build, then bundle the Worker into .open-next/
npm run cf-preview    # the same, run locally on workerd
npm run cf-deploy     # the same, then populate the caches and upload
npm run cf-typegen    # regenerate cloudflare-env.d.ts after editing wrangler.jsonc
```

Deploys are driven by **Workers Builds** on a push, so the routine path is a
push and the `cf-deploy` script is the escape hatch. What each target needs from
the environment differs, and `.env.example` is where that split is written down.

### The database is reachable from a Worker only through Hyperdrive

Not a preference, a constraint. A Worker validates TLS against the public CA
bundle and offers no way to opt out, and Supabase's pooler presents exactly the
certificate that already fails `verify-full` from Node -- the one
`lib/db/client.ts` strips `sslmode` for. So a socket opened from the isolate
straight to Supabase never finishes its handshake, whatever driver holds it.
Hyperdrive terminates that leg on Cloudflare's network and hands the isolate a
loopback connection.

Three consequences worth knowing before touching `lib/db/client.ts`:

- **The pool is built on first query, not at import.** A Worker's bindings do
  not exist until a request does, and `getCloudflareContext` is async, so there
  is no synchronous way to read `HYPERDRIVE` at module scope. The exported
  `pool` is a `Proxy`, and it proxies a real `Pool` rather than a plain object
  because Drizzle decides whether to pin a connection for a transaction by
  testing `client instanceof Pool` *and* the prototype's constructor name. A
  bare target fails both, `db.transaction()` silently spreads its statements
  across pooled connections, and nothing in `tsc`, `eslint` or the build says a
  word.
- **The Hyperdrive config points at Supabase's session pooler (5432), not the
  transaction one (6543).** Hyperdrive is itself a transaction-mode pooler;
  stacking two costs a connection per connection and breaks prepared statements.
- **Its query cache is off.** Hyperdrive caches reads for 60s by default, and
  this app already has a cache with an invalidation story. A second one
  underneath `updateTag` means an admin edit revalidates the tag, the page
  re-renders, and the query still answers with the row from before.

`STORAGE_POSTGRES_URL` stays unset on the Worker for the same reason: it names a
route that cannot work from there, and leaving it absent is what keeps that
unambiguous. The build is the exception -- it prerenders the whole site from
Node, where there is no binding, so the build environment does need it.

### Workers Paid is not optional here

Two of the Free plan's limits are below what this application needs, and both
are hard failures rather than slow ones:

- **Worker size.** The bundle is ~3.9MB gzipped against a 3MB ceiling on Free
  (10MB on Paid). The upload is rejected outright. Measure before assuming
  anything changed it:
  `OPEN_NEXT_DEPLOY=true npx wrangler deploy --dry-run --outdir <tmp>`.
- **CPU time.** 10ms on Free. Server-rendering a React tree does not fit in it.

### `next build` is not a Windows build here

`npm run cf-build` fails on Windows without Developer Mode, at
`EPERM: operation not permitted, symlink`: Next leaves six directory symlinks
under `.next` (`pg` and `postcss`), and the adapter recreates them with
`fs.symlinkSync` and no type argument, which on Windows means a "dir" symlink
and needs a privilege an ordinary shell does not have. Enabling Developer Mode
clears it -- but OpenNext also warns in the same run that Windows is not a
supported build host and that failures may surface at runtime instead. Workers
Builds runs on Linux, which is the real answer; keep local `cf-build` for
inspecting a bundle, not for producing the one that ships.

### `next/image` is Cloudflare Images

The built-in optimizer is a native `sharp` binary and does not run on workerd.
The `IMAGES` binding in `wrangler.jsonc` puts Cloudflare Images behind the same
`/_next/image` endpoint, so `remotePatterns`, `deviceSizes` and `imageSizes` in
`next.config.ts` keep meaning what they say and no markup changes. It is billed
per transformation beyond the free monthly allowance, which is the reason to
keep that ladder trimmed rather than let it grow back.

### `proxy.ts` is Node middleware, and the adapter says so

Next 16 runs Proxy on the Node runtime and refuses a `runtime` export outright,
so there is no edge variant to switch to. Every `cf-build` therefore prints
`Node.js middleware support is experimental in cloudflare`. It is expected, not
a regression. The whole of `proxy.ts` is one static header on five path
prefixes, so if that warning ever becomes a real problem the work is to move it
into the `headers()` block in `next.config.ts` and delete the file.

## Architecture

- `app/` — routes. `app/(site)/` is the public site, `app/admin/` the admin,
  `app/api/` the handful of JSON endpoints.
- `lib/data/` — read paths for the public site, each behind `"use cache"` with a
  `cacheTag` from `lib/data/tags.ts`.
- `lib/actions/` — server actions: contact, comments, guestbook, admin.
- `lib/admin/` — the admin's descriptors. A model's changelist and form are
  data; the components that render them are generic.
- `lib/db/` — `app-schema.ts` is the live mapping, generated by introspection
  from `app`; `client.ts` is the pool. `drizzle/` holds the schema.
- `components/` — `site/` for the public pages, `admin/` for the admin,
  `layout/` and `providers/` shared.

### The admin is declarative

`lib/admin/registry.ts` names every screen. `lib/admin/models/` holds one module
per area, each declaring a changelist descriptor (columns, filters, search
fields, ordering) and a form descriptor (fieldsets, field kinds, inlines).
`components/admin/changelist.tsx` and `record-form.tsx` render any of them.
**Add a screen by adding a descriptor, not by writing a page.**
`scripts/check-admin.mjs` fails if the registry and the descriptors disagree —
an entry without a form descriptor is a screen that cannot be opened.

The chrome around them is `components/admin/admin-shell.tsx`: a client wrapper
holding one piece of state — whether the rail is collapsed — with the topbar and
the page passed through as `ReactNode`, so both stay server components. The rail
groups the registry into an accordion that opens **one group at a time**, and
collapses to a strip of icons whose entries arrive in a flyout beside them. Two
things about it are easy to undo by accident: the open group is adjusted *during
render* from the pathname rather than in an effect — an effect paints the group
shut for a frame on every navigation into a new area — and a collapsed panel
carries `inert`, because a `0fr` grid row is invisible and still focusable.
`scripts/check-admin-nav.mjs` holds both, and the cookie round trip with them.

### Every model has full CRUD, except one

`user` is the single exception, and it is written up at the descriptor: an
account **is** a provider identity, so one made here is a row nobody can sign in
to, and deleting one cascades through every comment and guestbook message that
person wrote. `profile`, `hiring-profile` and `open-to-work-profile` are
one-row by definition — `/admin/<key>` *is* that record's form, there is no
list and no create route — which is a different thing from being refused.
Everything else creates, reads, updates and deletes.
`scripts/check-admin-forms.mjs` asserts both directions; "no add form" on its
own is satisfied by an admin that cannot create anything at all.

Three of those models are *about* somebody — a guestbook message, a comment, a
reader's profile all name an account in a `NOT NULL` column with no default. So
a field can be `readOnly: "afterCreate"`: writable while the record is being
made, fixed from then on, because reassigning one moves what a person said onto
somebody else's name. **Read it through `formFieldsFor(model, id)`, never as
`field.readOnly` directly** — `"afterCreate"` is a truthy string, so a raw test
reads it as *always* read-only and silently drops the field from the insert,
which surfaces as a not-null violation on the one save it was added to make
work.

`comment.target_id` is the only polymorphic column here: it points at a blog
post or a project depending on `target_kind`, so no foreign key can cover it and
nothing in the database would object to a pair naming neither. A `reference`
field may therefore name several sources, each with a `groupLabel`, and the
descriptor checks the pair with `validate`. That check needs a row counted,
which is why `ValidationContext` carries `exists()` rather than the descriptor
importing the database — `lib/admin/models/` is imported by the check harnesses,
and a descriptor that opened a connection would do so every time one of them
read a form's shape.

## Traps

These are the things that have actually gone wrong here. Most are invisible to
`tsc`, `eslint` and the build.

### A layout is not an auth gate

Returning a "not permitted" screen instead of `{children}` does not stop the
page underneath running — React renders a layout and its children concurrently,
so the layout only decides what is *displayed*. The admin's first version
answered a non-staff request with 72KB in which the visible HTML said "Not
permitted" while the Flight payload below it carried every blog post, its slug
and its edit URL. Every admin page calls `requireStaff()` as its first `await`;
route handlers and server actions, which do not nest under a layout at all, call
`isStaffRequest()`. `scripts/check-admin.mjs` reads whole response bodies,
payload included, and fails if row data appears in one.

`is_staff` is read from the database on every request and never carried in the
session token. Sessions are thirty-day JWTs; a token minted while someone was
staff would keep asserting it for a month after the flag was cleared.

### A cascade declared in application code is not a cascade

`app` declares its referential actions in SQL: 29 `CASCADE` where a child has no
meaning without its parent, 21 `SET NULL` where it does, 7 `RESTRICT` where the
reference is somebody else's (an organization an experience still names). None
are deferrable, so a violation is raised by the statement that caused it rather
than at commit.

That distinction is the trap. A schema whose cascades live in the application
rather than on the constraint leaves every foreign key `NO ACTION`, and a delete
then depends on the application having remembered to clear the children. Worse,
`DEFERRABLE INITIALLY DEFERRED` hides it: the check happens at commit, so a
transaction that rolls back never reaches it — which is exactly what a harness
cleaning up after itself does. `scripts/apply-migration.mjs` issues
`set constraints all immediate` before its rollback for that reason, and
`scripts/check-baseline-schema.mjs` does the same.

`lib/actions/admin.ts` still clears children itself, and that is deliberate: it
is what turns a `RESTRICT` violation into a message on the screen instead of an
integrity error to translate after the fact. `scripts/check-admin-inlines.mjs`
proves both halves in a rolled-back transaction.

### Row Level Security must stay on

Supabase serves a PostgREST API over the schemas it is configured to expose, to
anyone holding the project's anon key and independently of this application.
Without RLS, `account` and `account_identity` are readable straight through it.

Every table has RLS enabled with **zero policies**, which is the intended state
rather than an oversight: the application's role has `rolbypassrls`, so its own
queries are unaffected, and everything else is refused by default rather than by
a rule somebody has to get right. Whether a schema is exposed through PostgREST
is a project setting somebody can change in a dashboard; RLS is what makes that
change survivable rather than catastrophic.

`scripts/check-rls.mjs` enumerates the schemas this project owns rather than
naming them, so a new one is covered from the moment it exists.

`drizzle-kit generate` does not model RLS, reads every table as "should be
disabled", and emits `DISABLE ROW LEVEL SECURITY` for all of them. It is not
used here, and **any generated SQL gets read line by line before it runs.**

### The admin draws its own form controls, and the CSS is class-scoped

A `<select>`'s closed box was always themeable; the list that drops out of it
never was, and neither was a checkbox's tick, a number field's spinners, or the
calendar behind `<input type="date">`. Those are operating-system chrome.
`color-scheme` renders them in *a* dark, but it is the browser's, not this
site's.

So `styles/admin-controls.css` draws them, and `components/admin/controls/`
replaces the two that need a panel. **Every selector in that stylesheet is
anchored to a class** — `.admin-check`, `.admin-select`, `.admin-popover` —
because the file is imported from `app/globals.css` and is therefore global: a
rule written as `input[type="checkbox"] { … }` restyles the contact form, the
comment box and the guestbook composer, silently. The two admin sheets beside
it already work that way. `scripts/check-admin-controls.mjs` parses the
selectors and fails on a bare element name.

### An unlayered stylesheet outranks every Tailwind utility

Tailwind v4 emits its utilities into `@layer utilities`. The fifteen sheets
under `styles/` are imported from `app/globals.css` **outside every layer**, and
unlayered rules beat layered ones outright -- specificity is never consulted, so
this is not something a longer selector or an `!important` in the markup can
argue with. A plain class in one of those files therefore wins against any
utility touching the same property, at any breakpoint.

It also means **their import order is the only thing deciding conflicts between
them**, which is what made splitting `globals.css` safe: `theme-light.css`,
`theme-motion.css`, `components.css` and `animations.css` were carved out of it
exhaustively and imported in the sequence their contents held, so the compiled
stylesheet came back byte-identical. A partial extraction would not have that
property -- CSS requires `@import` to precede all other rules, so anything left
behind lands *after* the extracted sheets rather than interleaved where it sat.
Add new rules at the end of the list, and prove any reordering with a build
diff rather than by eye.

That is fine until the two want the same property. Both halves of the admin
rail hit it in one afternoon:

- `.admin-rail-shift` declares `transition`, which is a *shorthand*, so it
  replaced the `transition-transform` the drawer relied on and the drawer began
  snapping open instead of sliding. The fix is to name every property the
  element needs in the one place that wins -- `transform` is in that list for a
  rail that never transforms on desktop.
- `.admin-accordion` declares `display: grid` for the 0fr/1fr collapse, which
  beat the `lg:hidden` meant to take the panel out of the collapsed rail. The
  open group's entries stayed on screen, clipped to a 4.5rem strip, reading as
  a stray sliver of indigo rather than as a panel that failed to close.

So: **if a class in `styles/` sets a property, no utility may set that property
on the same element.** Express the variation in the same file, anchored to a
data attribute (`.admin-accordion[data-mini="true"]`) and wrapped in whatever
media query it needs. `tsc`, `eslint` and the build all see two perfectly valid
declarations.

### A constant exported from a `"use client"` module is not that constant

Next replaces a client module with a set of client *references* when a server
component imports it. Import a string from one and the server gets a reference
object, not the string. `app/admin/layout.tsx` read the rail's cookie by a name
imported from `admin-shell.tsx`, found nothing, and rendered the wide rail for
everybody -- while the cookie was being written and sent perfectly correctly.

Nothing errors and nothing is logged: the export is typed `string` on both sides
of the boundary, so `tsc` and the build are satisfied, and the symptom is a
preference that silently never applies -- indistinguishable from a cookie that
failed to save. Shared constants go in a plain module both sides import;
`lib/admin/rail.ts` is the one this cost.

**Every drawn control is an enhancement over a real one.** The server renders
the `<select>` or the `<input type="date">`; it carries the `name`, it is what
posts, and it is hidden only once the component has hydrated and can take over.
Three things depend on that: the form saves before the bundle arrives,
`check-admin.mjs` greps the *server body* for `<select name="category">`, and a
browser's own restore and autofill need a real control. `hidden` is what hides
it — a hidden form control still submits, only a `disabled` one does not.

Two smaller things that cost an afternoon each:

- **Attribute order is part of the contract.** React emits attributes in the
  order they are written, and `check-admin.mjs` greps for the literal
  `<select name="category"`. An `id` written before `name` turns that check red
  and is invisible to `tsc`, to `eslint` and to a browser.
- **"Works without JavaScript" means *before hydration*, not with scripting
  off.** React streams a Suspense boundary's content into a `display: none`
  container and reveals it with a small inline script, so a browser with
  scripting disabled does not get an unhydrated admin form — it gets an
  invisible one, on every route that streams. The honest test, and the one
  `check-admin-controls.mjs` runs, is scripting **on** with
  `**/_next/static/chunks/**` blocked.

### Tailwind scans prose, and prose names classes

Tailwind v4 walks every non-gitignored file and treats any word that parses as a
class name as one in use. A design note, a README, or a code comment that merely
*names* a utility is enough to emit it. The site uses no cast-depth utilities at
all; promoting the app from `web/` to the repo root brought the markdown back
inside the scan and the very first build re-emitted every one of them. Worse,
the check written to assert their absence named one in order to look for it, and
so kept it alive on its own.

`app/globals.css` carries the `@source not` lines. `scripts/check-css-sources.mjs`
proves they still work. If you write a comment about a utility, describe it
rather than spelling it out.

The other half of this was **content that named classes**. Post bodies were
JSONB blocks with a hand-typed `class` key — invisible to any scan, so 29
utilities had to be listed in `@source inline(...)` and re-extracted from live
data after every edit. Those columns are gone and the list with them; what keeps
it gone is `lib/utils/sanitize.ts`, which allows `class` on one element and only
matching `language-*`. **Never store CSS classes in the database.**
`scripts/check-db-classes.mjs` is the guard.

### `.gitignore` no longer blanket-ignores JSON

It used to, so a database dump could not be committed by accident, and the cost
was that `package.json` and `package-lock.json` sat untracked for the project's
whole life — which is how the Tailwind build drifted two minor versions without
anyone noticing. The rule is gone; dumps are named directly (`*.dump.json`,
`*.dump.sql`). Still confirm with `git status` that a new file is actually
seen.

### Other things worth knowing

- **`node-postgres`, never `postgres.js`.** postgres.js pipelines concurrent
  queries onto one socket, which stalls permanently under Supabase's
  transaction-mode pooler — and not at a clean threshold. See the measurements
  in `lib/db/client.ts`.
- **TLS is configured in code, not in the connection URL.** `pg` reads
  `sslmode=require` as `verify-full`, which Supabase's pooler certificate does
  not satisfy.
- **A dynamic route under `cacheComponents` cannot set a 404 status.** The
  status is committed as soon as the route is known to be dynamic, and reading
  the session cookie is what makes it so. Assert the body, not the status. The
  same applies to a redirect: `/sign-in` bounces a signed-in reader to `/` and
  that bounce is a 200 whose body carries the navigation, so it lands *after*
  `load`. A check that reads the URL straight after `goto` sees `/sign-in`.
- **`signOut` redirects to `AUTH_URL`, not to the origin the request came in
  on.** `createActionURL` prefers that variable unconditionally, so
  `signOut({ redirectTo })` sends the browser to whatever host it names, as an
  absolute URL. Signing out of the admin looked like it did nothing for exactly
  that reason -- and no harness saw it, because a fresh Playwright context has
  no prefetched router cache and no host to disagree about. `signOutHere` calls
  `signOut({ redirect: false })`, which still writes the delete-cookies, and
  does its own relative `redirect()`. **Never hand `redirectTo` to Auth.js
  here.**
- **Form submission normalises line breaks to CRLF in every field value**, not
  only in a `<textarea>`. Anything carrying real newlines needs normalising on
  arrival.
- **Nothing holding a Drizzle column may cross to a client component.** A column
  references its table, which references every column back; serialising one is
  an infinite walk that React reports as a stack overflow naming nothing.
- **A module with no `"use client"` is still client code if a client module
  imports it**, and `process.env` in it is `undefined` for anything without a
  `NEXT_PUBLIC_` prefix. `components/admin/field.tsx` built image URLs from
  `STORAGE_SUPABASE_URL` that way: absolute on the server, hostless in the
  browser. React reports the pair as a hydration mismatch and then leaves the
  attribute alone, so the preview looked correct until the next client render
  replaced it with a broken URL — and pressing Save is one. Resolve URLs on the
  server and pass them down. `scripts/check-admin-console.mjs` catches it.
- **Uploaded files are named after their contents**, and are reference-counted
  on delete. One author photo is named by twenty-one rows; deleting because one
  row stopped naming it would break the others. The key lives on `media_asset`
  and everything else points at it with a foreign key, so the count is over
  those six columns — `lib/storage/cleanup.ts` lists them and
  `scripts/check-storage.mjs` proves the list against the catalogue.
- **A form works in storage keys; the schema works in asset ids.** A column like
  `project_image.media_id` names a `media_asset` row, because one file is named
  by many records and repeating the string in each is what reference counting
  exists to avoid. `lib/admin/media.ts` is the one place that converts, and
  **nothing in the type system says a caller went through it** — both sides are
  `string`, so handing a uuid to something expecting a key type checks, builds,
  lints and renders. It renders wrongly: the admin asked the bucket for
  `.../media/<uuid>` and Supabase answered `NoSuchKey`, so every blog and project
  gallery previewed broken. Only the record's own fields were converted; its
  inline rows were not, in all four directions — the preview, the staleness
  comparison, the cleanup list, and the write, where a key going into a uuid
  column raises `22P02`. **Cross that seam through `lib/admin/media.ts`, never by
  passing the column value along.**
- **A storage key does not say where the file is served from.**
  `media_asset.source` does: `storage` is an object in the bucket, `static` is a
  path under `public/`. `assetUrl` is the single thing that knows which, and
  `mediaUrl` alone sends a static key to the bucket, which is how all 78 icon
  previews once became `NoSuchKey`.
  Every asset is `storage` today — the 74 skill icons were the last `static`
  ones and `scripts/migrate-icons-to-storage.mjs` moved them — but the column
  still permits either, and the branch is what keeps the next `static` asset
  from repeating that bug. **Never assume the source; read it.**
  `scripts/check-admin-media.mjs` proves both halves: every image a form renders
  is a key, and every URL it builds resolves.
  The icons stay in `public/static/svg/icon/` as the source to re-seed from.
  That matters because `skill.iconId` is one of the columns
  `lib/storage/cleanup.ts` counts references over: unlinking the last skill that
  names an icon now deletes the object and its row for good, where before the
  delete aimed at a path that had never been in the bucket.
- **An email's dark mode is an overlay, and an inline style outranks a class.**
  `lib/email/layout.ts` writes the light palette inline on every element and
  repaints it from one `<style>` block under `prefers-color-scheme: dark`. Every
  override needs `!important` or the whole dark theme is dead markup, and the
  block must stay **colour only**: a client that strips it — Gmail clipping a
  long message, Outlook, a text-only proxy — has to still receive a complete
  light email, so anything structural in there is what that reader loses.
  `scripts/check-emails.mjs` asserts both directions, and separately that the
  reply notification renders **no address at all**: its `Reply-To` is the owner
  precisely so two visitors never learn each other's addresses.
- **Guestbook mail routes on roles, not on addresses.** `is_author` and
  `is_co_author` from `guest_profile` decide who is emailed —
  `lib/email/guestbook-plan.ts` is the whole rule as a pure function, with the
  matrix under test offline. The version before it asked whether the poster's
  address appeared in `CONTACT_EMAIL_RECIPIENT`, which is the owner's *inbox*
  and has no reason to match the address they sign in with, so the exclusion
  never fired. The two roles are not interchangeable: an author's own post
  notifies nobody, a co-author's still notifies the owner.
- **A key that is not a uuid is not "no such row".** Postgres raises
  `22P02 invalid input syntax for type uuid` and the route answers 500 where the
  honest answer is not-found. Guard with `isUuid()` from `lib/utils/uuid.ts`
  before any value from a URL or a form reaches a query. This replaced
  `Number.isInteger(id) && id > 0`, which did the same job by accident.
- **A session cookie outlives the schema.** Sessions are thirty-day JWTs and
  `token.sub` is the account key, so every reader signed in before the move to
  `app` presented `sub: "1"` for a month afterwards — a subject that names no
  row and is not even a well-formed key. `auth.ts`'s `session` callback refuses
  a subject that is not a uuid, which is the single place a token becomes a
  session; all six readers of `session.user.id` are downstream of it and need no
  guard of their own. `scripts/check-site-console.mjs` drives every page with
  such a token.
- **A serial key carries insertion order; a uuid carries nothing.** Several read
  paths were spending that — `order by id` meaning "the sequence somebody
  entered them in", and a nullable sort column silently tie-breaking on heap
  order. Anything whose order matters now sorts on a column that says so
  (`position`, `issued`, `published_at`); `lib/admin/inlines.ts` stamps
  `position` on every child table that has one, even where no reorder control is
  offered, precisely so the tie-break exists.
- **A change to an interface is not finished until its skeleton matches.**
  Every screen here has a stand-in -- a route's `loading.tsx`, or the
  `<Suspense>` fallback around a streaming panel -- and each is a hand-built
  copy of a shape that lives somewhere else. Nothing recomputes them: move a
  control, change a height, add a row, and the skeleton keeps promising the old
  layout until somebody edits it, so the page settles by jumping. **Adjust the
  skeleton in the same change as the interface**, then run
  `scripts/check-skeleton-shape.mjs`, which measures each one against the page
  it stands in for. A new route needs its own file: without one there is no
  skeleton at that level at all, and the previous page stays up until the
  payload lands.
  Note the harness cannot observe every skeleton (`/contact`, `/guestbook` and
  `/sign-in` arrive with their pages however hard it holds the navigation), so
  those are reported as notes and their shape is on you to keep honest.
- **A `loading.tsx` beside nested routes is those routes' skeleton too.** Next
  stores a segment's loading module on that segment and applies it to the
  segment's *child slots* -- `layout-router.js` calls it `parentLoadingData` --
  so it is the fallback for everything the layout beside it renders, not for its
  own `page.tsx` alone. And it wins: on a client navigation the target's own
  `loading.tsx` is still inside the payload being waited for, so the nearest
  already-known boundary is the parent's. The wrong skeleton therefore appears
  on exactly the slow navigations a skeleton exists for, and is invisible on the
  fast ones. Five files here did this -- `app/(site)/`, `blog/`, `projects/` and
  both admin levels -- so a click on Dashboard drew the home page's hero, card
  rail and skills marquee, and every admin screen opened as the admin index.
  **An index page and its skeleton go in a route group of their own**
  (`(home)`, `(index)`): the URL is unchanged, but a group is a router segment,
  so the skeleton moves below the slot its siblings arrive in and the parent
  slot is left with no loading data at all. A navigation still in flight then
  keeps the previous page up -- which is what the progress bar reports --
  instead of flashing somebody else's furniture.
  `scripts/check-skeleton-scope.mjs` is the guard, and it is offline.
- **A `loading.tsx` skeleton must not render `<main>`.** `#page-content` is
  keyed on the pathname, so its entrance animation plays once per navigation —
  on whichever of the skeleton and the real page renders first. Where a skeleton
  got there first, the real page would otherwise appear with no transition at
  all, at the end of a 700ms entrance. `globals.css` hangs a short fade on
  `#page-content main` instead, which works only because every site page renders
  exactly one `<main>` and a skeleton renders a `<div>`. Build them from
  `components/skeleton.tsx`, which is shaped to keep that true.
- **A migration file must not carry its own `begin`/`commit`.**
  `scripts/apply-migration.mjs` wraps the whole file in one transaction and
  rolls it back unless `--apply` is passed; a `commit` inside ends that
  transaction from the inside, so the dry run commits and still reports "nothing
  changed". A migration here did exactly this once, and its dry run committed.
  The script now refuses such a file — but a PL/pgSQL `DO $$ … BEGIN … END $$`
  block is a *block*, not a transaction, so dollar-quoted bodies are blanked
  before that check runs. Scanning the raw text refuses every migration that
  enables RLS in a loop, which is to say the schema itself.
- **No shadows, and light mode is a palette remap.** The site is written
  entirely in dark-mode Tailwind classes with no `dark:` variants; light mode
  redefines the palette variables under `html[data-theme="light"]`. Stay inside
  the existing colour vocabulary or light mode breaks silently.
- **A label activates its control from anywhere inside its box, and a grid item
  is stretched to its cell.** The admin's field rows put the label in one column
  and the control in the next, so every label's box was as wide as the column
  and as tall as whatever stood beside it, with the word itself in a corner.
  Beside "Photo" that was 102x138 around 39x18 of text: 95% of a cell that
  looked like margin, wired to a file input, so clicking the blank space opened
  the operating system's file picker. Beside a rich-text field it was 230x1257.
  The checkbox labels had the same shape sideways — "Featured" ran 477px around
  83px of word, and a click well clear of it flipped a published flag. The fix
  is `w-fit`/`justify-self-start` and `self-start` on the label, which changes
  nothing visible: a label has no background, so only its hit area moves.
  `scripts/check-admin-labels.mjs` measures every label on every form screen
  against its own content, and clicks beside one for real. It measures sideways
  overhang only on labels that fit on one line — wrapped text ends its last line
  short and no CSS width means "the longest line", so that tail is not a fault.

## Verification

Each harness covers one mechanism, runs against the live application, and cleans
up after itself. Run the relevant ones before calling a change done; run all of
them before a release.

```bash
npm test                                               # the unit suite, offline
npm run build && node scripts/check-css-sources.mjs   # no stray utilities
node scripts/check-headers.mjs                         # every security header, every origin
node scripts/check-auth-config.mjs                     # sign-in is configured, wherever it points
node scripts/check-live-config.mjs https://<domain>    # what a deployment is silently doing without
node scripts/check-fresh-start.mjs                     # nothing explains itself by the old stack
npx tsx scripts/check-baseline-schema.mjs              # 0000_init.sql builds exactly `app`
npx tsx scripts/check-app-schema.mjs                   # the generated mapping matches `app`
node scripts/gen-app-schema.mjs                        # regenerate it after any DDL
npx tsx scripts/check-rls.mjs                          # RLS on every table
node scripts/check-breakpoints.mjs                     # one visible theme toggle
node scripts/check-notifications.mjs                   # toasts outside the transform
node scripts/check-ui-state.mjs                        # palette + Turnstile theme
node scripts/check-skeleton-scope.mjs                  # one skeleton, one page
npx tsx --conditions=react-server scripts/check-page-loading.mjs   # bar + skeletons
npx tsx --conditions=react-server scripts/check-skeleton-shape.mjs # each skeleton vs its page
npx tsx scripts/check-auth-adapter.mjs                 # Auth.js vs the live schema
npx tsx scripts/check-comments.mjs                     # comment rules, rolled back
npx tsx scripts/check-emails.mjs                       # all five templates
npx tsx scripts/check-db-classes.mjs                   # no classes in stored content
npx tsx --conditions=react-server scripts/check-site-console.mjs
npx tsx scripts/check-account-panel.mjs                 # sign in / sign out, both states
npx tsx --conditions=react-server scripts/check-turnstile.mjs
npx tsx --conditions=react-server scripts/check-storage.mjs
npx tsx --conditions=react-server scripts/check-admin-media.mjs   # the id/key seam
npx tsx scripts/check-admin.mjs
npx tsx scripts/check-admin-nav.mjs                     # one group open, and a rail that remembers
npx tsx --conditions=react-server scripts/check-admin-console.mjs
npx tsx --conditions=react-server scripts/check-admin-forms.mjs
npx tsx --conditions=react-server scripts/check-admin-json.mjs
npx tsx --conditions=react-server scripts/check-admin-inlines.mjs
npx tsx --conditions=react-server scripts/check-admin-richtext.mjs
npx tsx --conditions=react-server scripts/check-admin-labels.mjs
npx tsx --conditions=react-server scripts/check-admin-controls.mjs
```

A harness that imports a `server-only` module needs `--conditions=react-server`.
The browser-driven ones need `npm run dev` running.

`scripts/check-schema-parity.mjs` and `scripts/catch-up-from-public.mjs` are not
part of this list. They exist for the one-off retirement of the `public` schema
and are deleted with it — see `drizzle/9999_drop_public.sql`.

`scripts/migrate-icons-to-storage.mjs` is not a check either. It uploads the
skill icons from `public/static/svg/icon/` and repoints their rows, and it is
kept rather than deleted because it is idempotent — the key is a digest of the
file's contents, so re-running rewrites identical bytes and skips rows already
moved. That makes it the way to restore an icon somebody unlinked. It is a dry
run unless given `--apply`.

## Conventions

- Commits: emoji-prefixed conventional commits, `<emoji><type>(<scope>): <Description>`
  with no space after the emoji — `✨feat(admin): …`, `🐛fix(blog): …`.
  `CONTRIBUTING.md` documents the plain form; the emoji prefix is the real
  convention.
- Branches: `feature/your-feature-name`.
- Comments explain *why*, and are worth writing when the reason is not evident
  from the code. Most of this file started as one.
