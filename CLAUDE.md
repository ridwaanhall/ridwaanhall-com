# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Stack

Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, Tailwind CSS v4, Drizzle over
`node-postgres` on Supabase, Auth.js v5. `package.json` has the rest.

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

## Commands

`package.json` has `dev`, `build`, `lint`, `test` and `test:watch`. The type check is
`npx tsc --noEmit`, and on a fresh checkout `npx next typegen` comes first (CI does the
same): some files use route-type globals, `PageProps` and `RouteContext`, which Next
generates rather than names anything imports, so `tsc` alone fails on them until a dev
server or a build has run.

`npm test` is `node --import tsx --test` over `lib/**/*.test.ts` — the built-in
runner, no test framework. It covers the pure logic and needs neither a database
nor a browser, which is what lets CI run it: `tests/setup.ts` points the database
URL at nowhere before any module loads, so a test that tried to query fails at
connect rather than reaching anything real. That failure is the signal the test
belongs in a harness instead.

Everything that *does* need the real thing is a harness under `scripts/`, each
driving the live application and cleaning up after itself — see
`scripts/CLAUDE.md`.

## Everything reads the live database

There is no local database and no fixtures. `STORAGE_POSTGRES_URL` points at the
production Supabase project in development as well, so a page rendered locally
is showing live content and a write from the admin is a live write.

That is a deliberate trade, and it is why every harness that writes snapshots
what it touched and restores it in a `finally` that then proves the restore.
Follow that pattern for anything new. Rows a harness creates carry a `zz-`
prefix so a leftover is obviously a harness's and not real content.

## Architecture

`components/foothill/` is the public site (the name says nothing) and `components/admin/` the
admin. Every public read is in `lib/data/`, behind `"use cache"` with a tag from
`lib/data/tags.ts`.

## Where the rest lives

Guidance for one area sits beside the code it governs and loads when you work there:
`drizzle/` and `lib/db/` (the schema and the connection), `lib/auth/` and `lib/admin/`
(roles, grants, the descriptors), `lib/storage/`, `lib/data/` (drafts, search),
`lib/email/`, `lib/markdown/`, `lib/cv/`, `components/foothill/` (the public site's design
rules), `components/admin/`, `app/` (routing and loading traps) and `scripts/` (the
harnesses, and which to run before calling a change done). Read the one for the area
before changing it; what follows is what applies everywhere.

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
staff would keep asserting it for a month after the flag was cleared. The same
is true of `is_superuser` and of every grant row, and it matters more with a
matrix than with one boolean: a token carrying a grant set would keep asserting
delete on every screen for a month, with nothing a superuser could do but wait.

**The gate is now two questions, and the second one is per page.** The layout
cannot know which screen a page is about, so a staff account without `view` on
a model would otherwise get a rail that omits the screen and a payload that
carries all of its rows. Every model page asks `can(actor, key, "view")`
immediately after `requireStaff()` and before `params` becomes a query.
`scripts/check-admin-access.mjs` drives a narrowed account and fails on row data
anywhere in the response.

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

**A table created by a delta arrives with RLS off.** The `DO $$` loop that
enables it lives at the end of `0000_init.sql` and runs when *that file* runs —
which is never, against a database that already exists. So the loop covers a
fresh install and covers nothing else: seven tables added by a one-off migration
were left readable straight through PostgREST by anyone holding the anon key,
while `0000_init.sql` described them correctly and every other check passed.
`check-baseline-schema.mjs` is what caught it, by comparing the live schema
against the file rather than trusting either — **any delta that creates a table
has to enable RLS itself**, and re-running the loop is the way to do it, since
enabling it twice is a no-op.

`drizzle-kit generate` does not model RLS, reads every table as "should be
disabled", and emits `DISABLE ROW LEVEL SECURITY` for all of them. It is not
used here, and **any generated SQL gets read line by line before it runs.**

### A label is editorial; only the slug is an identifier

Every lookup table here carries both, and the difference decides which one code
is allowed to match on. A label is what somebody edits on its Settings screen —
that is the entire point of the screen — so anything keyed on it breaks the
moment it is used as intended, silently and only in the rendering.

Both halves of this were live:

- `project_status.slug` is hyphenated (`development-in-progress`) and
  `lib/data/project-status.ts` keyed its labels *and* colours with underscores
  (`development_in_progress`), while the read path selects the slug. Every
  lookup missed. (The colour is keyed on `project_status.color` now, a token
  the row carries -- which is also what lets a status be created at all.) Every badge on the site rendered in the grey fallback with a
  mangled `Development-In-Progress` beside it, and the rank lookup (now the row's `position`, read as
  `status_rank`) returned "unknown" for all of them, so the first of the two sort keys in `sortProjects`
  did nothing whatsoever. It survived because the test compared the module's two
  maps against each other — a tautology, and nothing a row participates in.
- The job-hunt card keyed its status colours on the *label* (`In Progress`).
  That worked only by coincidence, and would have gone grey on the first
  rewording; `OUTCOME` in `components/foothill/about.tsx` is keyed on the slug.

So: the label and the lifecycle order come from the row and are rendered, never
matched; the slug is the key and does not move. Where code must key on a
vocabulary, the screen makes the slug `readOnly` and says why. **A test that
compares two constants in the same module proves nothing about a column** —
assert the shape a slug has to have instead.

### An unlayered stylesheet outranks every Tailwind utility

Tailwind v4 emits its utilities into `@layer utilities`. The eleven sheets
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

The rail's permission filter is the same boundary from the other direction.
Which screens an account may open needs the session and the database, so it is
computed in `app/admin/layout.tsx` and passed **down as a prop** -- as a plain
`string[]`, because a `Set` does not survive serialisation and arrives as `{}`.
`AdminSidebar` builds the Set on its own side. Asking the question in the client
is not an option worth reaching for: `lib/auth/staff.ts` is `server-only`, so
that at least fails at the import.

**Every drawn control is an enhancement over a real one.** The server renders
the `<select>` or the `<input type="date">`; it carries the `name`, it is what
posts, and it is hidden only once the component has hydrated and can take over.
Three things depend on that: the form saves before the bundle arrives,
`check-admin.mjs` greps the *server body* for `<select name="category">`, and a
browser's own restore and autofill need a real control. `hidden` is what hides
it — a hidden form control still submits, only a `disabled` one does not.

**The image field inverts that last sentence, and it is the one place here that
does.** Its switch chooses between an upload and a link, so the input it is not
showing must *not* post — hiding alone would send a file that was chosen before
the reader changed their mind, and the save would be refused for supplying both.
So that one carries `hidden` **and** `disabled` together, applied only once
hydrated, and `check-admin-controls.mjs` asserts both attributes rather than
just the visible one.

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

### A class that is also a Tailwind utility inherits the utility

The back-to-top ring was `<svg className="ring">`, and `ring` is a Tailwind
utility that sets `box-shadow: 0 0 0 1px currentColor`. Utilities live in a
layer, so a site class beats them only on the properties it sets itself; the
ring's rule never set `box-shadow`, so the utility applied and drew a square
around the SVG's box. Nothing in the button's own styles showed it, which is
why removing its fill and border twice changed nothing. Renamed `totop-ring`.
`scripts/check-class-collisions.mjs` (offline, after a build) lists any class
used in the public site that is also an emitted utility; `fill-ink` and
`container` are the intended ones.

### `.gitignore` no longer blanket-ignores JSON

It used to, so a database dump could not be committed by accident, and the cost
was that `package.json` and `package-lock.json` sat untracked for the project's
whole life — which is how the Tailwind build drifted two minor versions without
anyone noticing. The rule is gone; dumps are named directly (`*.dump.json`,
`*.dump.sql`). Still confirm with `git status` that a new file is actually
seen.

### Other things worth knowing

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
- **A key that is not a uuid is not "no such row".** Postgres raises
  `22P02 invalid input syntax for type uuid` and the route answers 500 where the
  honest answer is not-found. Guard with `isUuid()` from `lib/utils/uuid.ts`
  before any value from a URL or a form reaches a query. This replaced
  `Number.isInteger(id) && id > 0`, which did the same job by accident.
- **A serial key carries insertion order; a uuid carries nothing.** Several read
  paths were spending that — `order by id` meaning "the sequence somebody
  entered them in", and a nullable sort column silently tie-breaking on heap
  order. Anything whose order matters now sorts on a column that says so
  (`position`, `issued`, `published_at`); `lib/admin/inlines.ts` stamps
  `position` on every child table that has one, even where no reorder control is
  offered, precisely so the tie-break exists.
- **`next dev` does not always recompile an edit to a sheet `globals.css`
  imports.** A rule appended to `styles/site.css` was missing from the served
  CSS through a restart, while every check of the source said it was there.
  Changing `app/globals.css` itself is what made Turbopack rebuild the bundle.
  When a new rule seems to do nothing, look for it in the stylesheet the
  browser actually loaded before debugging its selector.
## Verification

Run `npm test`, `npx tsc --noEmit` and `npm run lint` for any change. The rest are harnesses under
`scripts/`, each covering one mechanism against the live application; `scripts/CLAUDE.md` lists
every one, says which need `--conditions=react-server` and which need `npm run dev`, and is what to
read before choosing which to run.

## Conventions

- Commits: emoji-prefixed conventional commits, `<emoji><type>(<scope>): <Description>`
  with no space after the emoji — `✨feat(admin): …`, `🐛fix(blog): …`.
  `CONTRIBUTING.md` documents the same form and the emoji for each type.
- Branches: `feature/your-feature-name`.
- Comments explain *why*, and are worth writing when the reason is not evident
  from the code. Most of this file started as one.
