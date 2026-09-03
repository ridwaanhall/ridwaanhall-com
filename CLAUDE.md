# CLAUDE.md

Guidance for Claude Code (claude.ai/code) working in this repository.

## Stack

Next.js 16 (App Router, Turbopack, `cacheComponents`), React 19, TypeScript,
Tailwind CSS v4. Data comes from Supabase Postgres through Drizzle ORM over
`node-postgres`; uploaded media lives in Supabase Storage. Auth is Auth.js v5
with Google and GitHub. Deployed to Vercel.

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

Everything reads and writes the **`app`** schema: 53 tables, uuid keys, real
foreign keys with real referential actions, row-level security on every one.

`drizzle/0000_init.sql` is the whole of it, in one file, and it runs against an
empty database. There is no ladder of migrations to replay — change that file,
apply it, and re-run the two checks below.

That file never runs against a database that already has a schema, so a change
to a live one is written a second time as a **throwaway delta** in `ALTER` form,
applied, and **deleted in the same commit** -- `drizzle/README.md` has the
sequence. Deleted because a delta that stays is a rung, and
`check-fresh-start.mjs` fails on a second baseline file for that reason; it is
what caught the first one being left behind. The applied change lives in
`0000_init.sql` and the step that got it there lives in git history. See the RLS
trap below for what a delta has to do that this file does not.

```bash
node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
node scripts/gen-app-schema.mjs                # regenerate the Drizzle mapping
npx tsx scripts/check-baseline-schema.mjs      # the file still builds this schema
npx tsx scripts/check-app-schema.mjs           # the mapping still matches it
```

`lib/db/app-schema.ts` is **generated**, never edited by hand: 53 tables of
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

`lib/admin/models/settings.ts` is the exception to "one module per area": the
**Settings** group is the vocabularies every other screen's dropdowns are drawn
from, and fourteen of them are the same four columns (`slug`, `label`,
`position`, and a count of what points at them). They come from one `vocabulary`
factory rather than fourteen transcriptions, because fourteen hand-written
copies of the same descriptor is precisely the shape that drifts. `category` and
`project-status` are written out longhand beside it, each needing something the
factory deliberately does not offer.
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

### A grant per screen

`account` carries `is_active` (may sign in), `is_staff` (may reach the admin)
and `is_superuser` (answers yes to everything, and is the only role that may
edit anybody's grants). What a staff account reaches *inside* the admin is
`app.admin_access`: one row per **registry key** -- not per table -- with
`view`, `add`, `change` and `delete` as four independent booleans.

`lib/auth/permissions.ts` is the whole rule, pure and tested offline. **Ask it,
never the rows.** Three of its rules fail *open* when a caller reasons about
`actor.grants` itself: a grant naming a screen the registry no longer has is
refused rather than honoured, the Access screen is never grantable (granting
the ability to grant is granting everything), and a grant may not widen what a
model already refuses.

### Three roles, and they nest

    public  ⊂  staff  ⊂  superuser

There used to be four, over two tables: `is_staff` and `is_superuser` on
`account`, `is_author` and `is_co_author` on `guest_profile`. The second pair
was documented here as answering "a different question" -- the public site
rather than the admin -- and the split looked principled right up until the rows
were read. The one author *was* the one superuser and the two co-authors *were*
two of the three staff. Two names for one person, on separate tables, kept in
step by hand.

So author folded into superuser and co-author into staff, which preserved every
rule exactly because `account_superuser_is_staff` makes superuser ⊆ staff:
pinning and comment moderation became plain `is_staff`, and deleting a guestbook
message stayed superuser-only. That asymmetry is worth keeping rather than
tidying: a guestbook delete is a recursive hard delete with no tombstone, so it
is the one public act nothing can undo.

**Public is not a column.** It is what every signed-in account has, and until
`public_access` it had nothing behind it: posting a comment or a guestbook
message was gated on "is there a session" and nothing else, with no rate
limiting anywhere and no way to refuse one person short of deleting their
account -- which takes every comment they ever wrote with it.

`lib/auth/public.ts` is that rule, pure and tested offline, and it is the twin
of `permissions.ts`: one decides what a role may do inside the admin, the other
outside. **Ask for the capability, never the role.** A call site testing
`isStaff` is a second copy of a decision that has already moved once.

**`is_active` gates every public capability**, which is a fix rather than a
feature. It was documented in three places as "may sign in at all" and read in
exactly one -- `getStaffUser` -- so it meant "may reach the admin", and a
deactivated account could still comment, post and pin indefinitely. It is
deliberately *not* extended to sign-in itself: that would be an Auth.js `signIn`
callback with a different blast radius, and the switch exists to stop the
writing rather than the reading.

**A superuser is always staff**, and that is a `CHECK` constraint
(`account_superuser_is_staff`) rather than a rule in the gate. The two were
independent columns and one of the four combinations was a lockout:
`getStaffUser` refuses an account without `is_staff` before it ever looks at
the role, and `is_superuser` is only editable from inside the admin, by a
superuser -- so clearing that flag on the only superuser left raw SQL as the
way back. In the database because that is where an invariant survives every
path into the table; the two places that grant the role set both flags, the
Users form refuses the pair with a sentence rather than letting a check
violation arrive as one, and the Access screen consequently stopped hedging --
its list is `is_staff` alone and the "not staff" banner is gone with the row it
described.

**A new staff account starts on a preset, once.** `is_staff` used to *be* the
permission; it now only opens the door, so an account flagged staff with no
`admin_access` rows signs in successfully and gets a rail with no groups --
which reads as a broken deployment, not as an empty one. `lib/auth/presets.ts`
declares three shapes **per registry group rather than as lists of keys**, so a
screen added to Blog inherits what Blog gets and no list goes out of date; none
of them grants anything on Users, because that is other people's addresses and
sign-in identities. `userForm.afterSave` seeds the default the first time, and
`seedGrants` refuses an account that holds *any* grant row, so a narrowing
somebody made on purpose is never undone by a later save. The Access screen
offers the same presets as buttons that tick boxes and write nothing.

`afterSave` is handed `seedDefaultGrants` rather than importing it, for the
reason `ValidationContext.exists()` exists: `lib/admin/models/` is read by the
check harnesses and by `descriptors.test.ts`, and a descriptor that reached for
`lib/db/client.ts` would open a connection every time one of them asked a form
for its shape.

**The role is drawn from one vocabulary.** `lib/auth/roles.ts` is pure and
client-safe, and the admin topbar, the admin rail and the site's account row
all read it -- three files answering the same question is how they come to
disagree about whether the word is "Superuser", "Admin" or "Owner". The topbar
used to carry a comment explaining why there was no badge at all ("there is one
privilege, so a badge every staff account carries would mark nobody out"),
which was true while `is_staff` was the whole system and stopped being true the
day this section describes.

### Every model has full CRUD, with three exceptions

`canCreate` and `canDelete` are `boolean | "superuser"`, and the third state is
the one to be careful with -- see the trap below.

`user`: **create refused to everybody**, because an account *is* a provider
identity and one made here is a row nobody can sign in to. **Delete is
`"superuser"`**, because the reason it used to be refused outright -- it
cascades through every comment and guestbook message that person wrote -- is a
question of consequence rather than of possibility, and refusing it to everyone
meant the only way to remove an account was SQL, with no confirmation and no
warning.

`project-status`: **created and deleted like every other vocabulary**, which it
could not be until the colour moved onto the row. The refusal was never about
the lifecycle being sacred: a badge colour is a pair of Tailwind classes,
**classes are never stored in the database**, and `lib/data/project-status.ts`
therefore keyed them on the slug -- so a status created here had no colour and
rendered in the neutral fallback, which reads as a broken card.
`project_status.color` holds a **token** now (`purple`), chosen from a dropdown,
and the classes stay in that module where Tailwind can see them. A token is not
a class; it is a key, exactly like the slug. Its slug is `readOnly:
"afterCreate"` -- writable once, fixed after, because `sortProjects` and the
filters match on it.

The two sources that have to agree are the map in `lib/data/project-status.ts`
and `project_status_color_check` in the schema, and they genuinely cannot be
compared in the unit suite -- one is an object literal, the other a constraint
in Postgres. `scripts/check-db-classes.mjs` compares them against the live
database, which is the only place both are visible.

`profile`, `hiring-profile` and `open-to-work-profile`: **both refused to
everybody, superuser included**, and this is the one place that role is not the
answer. Each is one row by definition -- `/admin/<key>` *is* that record's form,
there is no list and no create route -- and every page in the public layout
renders the profile block, so deleting one takes the site down with nothing in
the admin able to recreate it.

Everything else creates, reads, updates and deletes, subject to the grant.
`scripts/check-admin-forms.mjs` asserts both directions; "no add form" on its
own is satisfied by an admin that cannot create anything at all.

### A draft is a row, and only one column decides

`blog_post.is_published` and `project.is_published` are the whole of what the
public site looks at. `getBlogs` and `getProjects` in `lib/data/content.ts` are
the only two places that ask, and everything a reader can reach resolves
through them -- the listings, the detail pages, `generateStaticParams`, the
sitemap, the JSON API and search -- so a draft is absent from all of them
without any of them knowing the column exists.

Both default to **off**, so a create through the admin is a draft. Before this
existed, every save was a publish; there was no draft state anywhere except
`legal_document.is_published`.

**`published_at` is *when*, not *whether*.** That distinction is the reason for
the column rather than a nicety: the read path had no `where` at all and merely
ordered by `published_at DESC`, so setting it forward did not hide a post -- it
sorted the unfinished draft **above everything finished** and prerendered it
into the sitemap. The one control that read like "publish later" was the one
that made the post most prominent.

**The schedule cannot be `published_at <= now()` in the read path.** That is a
cached function with a lifetime of days, so a clock comparison inside it is
evaluated once when the entry is filled and frozen with it: a post scheduled
for tomorrow would stay hidden for days after its moment. The flag moves
instead, and `app/api/cron/publish` moves it hourly, guarded by `CRON_SECRET`.

That endpoint **fails closed when the secret is unset** -- unlike
`verifyTurnstile`, which passes. The asymmetry is deliberate: an unconfigured
spam gate is a gate nobody set up, while an unauthenticated route that flips
`is_published` publishes drafts for anyone who finds the path. What it costs is
the usual quiet failure, so `CRON_SECRET` is in `docs/cutover.md`'s table and
`check-live-config.mjs` asks the endpoint for its refusal: 401 means a secret is
set, 503 means there is none.

**Only posts can be scheduled.** `project` carries the same flag but no column
saying when it should go live, and that is the honest shape -- a project goes
public when there is something to link to, which is not a date known in advance.

**`updateTag` is refused in a route handler.** It is Server Actions only; the
API reference says so outright and the error names the restriction. So the job
uses `revalidateTag(TAGS.blog, "max")`, which marks the tag stale rather than
expiring it -- the post appears on the request after the first rather than on
the first. Seconds, against a schedule measured in days. It is called **only
when a row actually moved**: marking the tag every run would discard the blog
payload hourly, which is the opposite of what `cacheLife("days")` is for.

There is **no preview of a draft yet**. Seeing one rendered means publishing it,
looking, and unpublishing -- the article page is 194 lines of inline JSX rather
than a component something else could render, and `draftMode()` is not the way
round it: reading it in `/blog/[slug]` makes that route dynamic for every
reader, not only for staff.

### The matrix has to describe the role it is looking at

The access screen draws a dash where an action cannot be granted, and there are
**two** reasons for that, which must not be conflated. `unavailable` is refused
to everybody -- a singleton has no add. `superuserOnly` is refused to *staff*:
`user.delete` is a real action a superuser really has.

Drawing both as a dash meant a superuser's own matrix showed "cannot be granted"
beside a Delete they could perform, and every ordinary box unticked above an
account that reaches everything -- because a superuser's access does not come
from those rows at all (`can()` short-circuits on the role). The one screen
whose job is to say what somebody can do said the opposite about the account
with the most power. So a superuser-only cell becomes a cell once the role is
ticked, and every cell shows granted; unticking the role reveals the stored
grants again, which is what would come back.

### The Access group is two screens, and only one of them is a role

`/admin/access` decides what a *staff* account may open in here: one row per
registry key, four booleans, and `superuserOnly` because granting the ability to
grant is granting everything.

`/admin/public-access` decides whether an account may still post *out there*:
two switches, one row per account, and it lists **every** account rather than
the staff ones, because what it governs is what everybody has. It is
deliberately **not** `superuserOnly` — moderating readers is a staff job, so it
is granted through the ordinary matrix, and only the `moderator` preset reaches
it. It is also an ordinary descriptor rather than a matrix: two switches on one
row is exactly what the generic changelist and form already draw.

Neither creates nor deletes its rows. A `public_access` row is written by a
sign-in, and deleting one silently restores full access — both columns default
to true — which is a permission change wearing the clothes of a tidy-up.

### One screen is not a descriptor

`/admin/access` is the exception to "add a screen by adding a descriptor", and
it is declared rather than accidental: `custom: true` on its registry entry says
a route file renders it, and `superuserOnly: true` keeps it out of the rail, the
index and the matrix for everybody else. Its rows are *registry entries* and its
cells are four booleans on a join row, which no form descriptor can describe.

It still has a list descriptor, so the changelist half is the ordinary generic
-- search, sort, filters and paging come free and the screen looks like every
other list here because it is one. `descriptors.test.ts` and `check-admin.mjs`
between them stop `custom` becoming a way to forget a descriptor: a custom entry
must have its route files, in an `(index)` group, and must not also declare a
form.

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

### A running `next dev` holds the old schema mapping

`node scripts/gen-app-schema.mjs` rewrites `lib/db/app-schema.ts`, and a dev
server that was already running does **not** reliably pick up a *new column* on
an existing table. `projectStatus.color` was `undefined` inside that process
while being perfectly present in a fresh one, so the query built a select over
an undefined column and Drizzle threw

    TypeError: Cannot read properties of undefined (reading 'replace')

from a stack made entirely of React streaming frames, naming nothing in this
repository. Every offline check passed, the same query run under `npx tsx`
returned the right rows, and only one screen was affected -- which reads
exactly like a bug in that screen's descriptor, and is where an hour goes.

**Restart `next dev` after regenerating the mapping.** And when one screen
errors while its query works in isolation, suspect the server's module graph
before the descriptor.

### A grant is not a cascade

A superuser answers yes to every question *this application* asks. A foreign key
is not one of them. `ON DELETE RESTRICT` on an organization five certifications
still name refuses a superuser exactly as it refuses anybody, and no role, flag
or grant changes that — the referring rows have to go or be repointed first.

What the admin does instead is say which ones. `lib/admin/blockers.ts` reads
`pg_constraint` for the foreign keys that would refuse, counts the rows behind
each, and turns the failure into "1 experience and 1 application still refer to
this record". Read from the catalogue rather than from a list on the descriptor,
because a transcription of the schema is a thing that goes quietly out of date:
add a foreign key and the message would drop back to saying nothing. It is
fail-soft — anything that goes wrong falls back to the old sentence, since the
caller is already handling one failure and a second thrown from there would turn
a refused delete into a 500.

### A "Used by" column is a transcription, and transcriptions rot

`organization` counted four of its five referring tables. The fifth,
`application.organization_id`, was added long after the descriptor was written,
so an organization named by three job applications rendered as `unused` while
`lib/admin/blockers.ts` -- which reads `pg_constraint` rather than a list --
refused the delete and named them. Two answers to one question, and the wrong
one was the one on screen before anybody pressed anything. Skills had no such
column at all, which is the worse case rather than the milder one: both foreign
keys into `skill` are `ON DELETE CASCADE`, so nothing refuses the delete and
the skill simply stops appearing in every project that listed it.

`scripts/check-admin-usage.mjs` asks the catalogue what actually points at each
lookup table and fails on anything a screen does not declare. **Its query is
`blockers.ts`'s without the `confdeltype in ('r','a')` filter**, and that
difference is the whole point: that filter is right for "what would refuse this
delete" and wrong for "what uses this record". Every foreign key into
`location` is `SET NULL` and both into `skill` are `CASCADE`, so keeping it
would report those two screens as having nothing to count -- a check that
passes while saying nothing.

The cell keeps its breakdown and sorts on the total (`usageTotal` in
`lib/admin/usage.ts`), which removes the compromise `settings.ts` already named:
a "Used by" composed in TypeScript offers a number the database cannot order by.

### A correlated subquery binds to the wrong table the day the names collide

`lib/admin/sql.ts` exists because Drizzle renders a column interpolated into a
raw `sql` template with its *bare* name, not `"table"."column"` — and a
correlated subquery is precisely where that decides which table a name binds to.
Its header tells that story about `guestbook_userprofile`. It happened again
anyway.

The access list counts the screens an account may open, which is `count(*)` over
`admin_access` **with a condition on the inner table** — something `countWhere`
could not express, so the one place that needed it wrote the subquery out by
hand. `${account.id}` came out as `"id"`, `admin_access` has an `id` of its own,
and the correlation compared two unrelated keys. Every staff account's Screens
column read **0** while the database held thirty-four grants for each of them,
and the header sorted by the same constant.

`countWhereAnd` is the missing helper. **Never hand-write one of these**, and
note what made this survive: the number is *derived*, so no stored row is wrong,
every other check passes, and the admin looks like it is working. The harness had
no assertion on the column at all — and when one was written, its first draft
computed the reference with its own correlated subquery and reproduced the bug,
agreeing with the screen and proving nothing. **Check a derived value against
something that derives it differently**, or against flat rows counted in
JavaScript.

### `canDelete: "superuser"` is a truthy string

The same shape as `readOnly: "afterCreate"`, and it fails the same way:
`model.canDelete !== false` reads the third state as *allowed* and offers a
superuser-only delete to every staff account. It type checks, lints, builds, and
is invisible until somebody deletes an account.

**Read it through `permits()` or `roleAllows()` in `lib/auth/permissions.ts`,
never as the property.** There were four call sites doing it by hand before this
existed — the two `new` routes, `changelist-screen.tsx` and `record-screen.tsx`.
`permits` also combines the flag with the grant, which is the other half nobody
should write twice.

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
  mangled `Development-In-Progress` beside it, and `projectStatusRank` returned
  "unknown" for all of them, so the first of the two sort keys in `sortProjects`
  did nothing whatsoever. It survived because the test compared the module's two
  maps against each other — a tautology, and nothing a row participates in.
- `application-card.tsx` keyed its status colours on the *label* (`In Progress`).
  That worked only by coincidence, and would have gone grey on the first
  rewording.

So: the label and the lifecycle order come from the row and are rendered, never
matched; the slug is the key and does not move. Where code must key on a
vocabulary, the screen makes the slug `readOnly` and says why. **A test that
compares two constants in the same module proves nothing about a column** —
assert the shape a slug has to have instead.

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

### `/admin/<a>/<b>` is two shapes behind one route

The second segment carries a record id for an ordinary model and a tab key for
a section, and the file-system router cannot tell those apart -- both are
`/admin/[model]/[sub]`, and both segments are strings on either side of the
boundary. A URL assembled by hand therefore type checks, builds, lints, and
only fails once a browser actually requests it and lands on "No such screen."
`adminPath` is the only place an admin URL is built, and `resolveAdminRoute`
the only place one is read back into a record or a tab; every route under
`[model]/[sub]` asks it rather than parsing the segments itself.

Worth naming the concrete consequence that already bit during this work: the
post-create redirect in `lib/actions/admin.ts` kept building a flat URL after
sections shipped, so Save on a settings form saved the row correctly and then
landed on "No such screen" — a working save that reads as a failed one, and
nothing short of clicking Save on that particular screen would have shown it.

The skeleton beside `[model]/[sub]/(index)` stands in front of both shapes and
cannot tell them apart either, because `loading.tsx` receives no params. It
draws the commoner shape — a record form — and that shape is up for longer
than a params await accounts for: the page's first await is the staff gate,
not `params`, and the gate still blocks on a round trip to Supabase even
though it shares its query with the layout's own check rather than issuing a
second one. Only once the gate has answered does the tab branch open a
fallback of its own, for the list beneath its header and strip; the record
branch has nothing to show first and renders straight into the one already on
screen. This is the same trade `components/admin/changelist-skeleton.tsx`
already documents for singletons.

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
- **An image field takes bytes from two places, and only one of them is a
  file.** Beside the upload there is a box for a link, and the link is a
  *source* of bytes rather than a place the site points at: `saveRecord` fetches
  it, `lib/storage/link.ts` decides whether what came back is acceptable, and
  the bytes are then stored under the same content-addressed key an upload gets.
  So a linked image and an uploaded one are the same thing by the time anything
  renders either — one `media_asset` row with `source: "storage"`, one entry in
  the reference count, one URL.
  **That is the whole reason the URL is not stored.** Rendering a foreign host
  would need `images.remotePatterns` in `next.config.ts` opened to arbitrary
  hostnames, which makes `/_next/image` an open image proxy for anyone who finds
  it, and the CSP's `img-src` widened to all of `https:` — and every image on
  the site would then depend on somebody else's server staying up and permitting
  hotlinks.
  Three things the fetch must keep doing, none of them visible to `tsc`:
  the hostname is **resolved and checked against the private ranges**, on every
  redirect hop, because a link is otherwise a way to make this server issue
  requests inside its own network; the body is **capped while it streams**,
  since a limit applied to a finished response is a report on memory already
  spent; and the type is **read from the bytes, never from `Content-Type`**,
  because that header is what Supabase then serves the object with, so
  believing it stores a page of HTML and serves it as an image.
  The rules are pure and tested offline in `lib/storage/link.test.ts` and
  `lib/admin/image-source.test.ts`; `scripts/check-admin-image-link.mjs` drives
  the rest against the live bucket.
- **A certificate's identity is its credential URL, not its title.** The 104
  certifications imported from a saved LinkedIn page were deduplicated against
  what was already stored, and four of them were there already *under different
  titles* — one stored in English and listed in Indonesian
  ("Machine Learning Terapan" against "Applied Machine Learning"), another
  simply reworded between the two. Matching on title would have inserted all
  four a second time; their `dicoding.com/certificates/…` and
  `linkedin.com/learning/certificates/…` links match to the character. Compare
  the *link*, normalised — LinkedIn appends `?trk=share_certificate` to some
  copies of the same URL and not to others, and a trailing slash comes and goes.
  Two things about that page are worth knowing before parsing another one. It
  names every issuer of a LinkedIn Learning course "LinkedIn", which is a
  different organization here from `LinkedIn Learning`, so one alias is declared
  in `scripts/import-certifications.mjs` rather than guessed at by fuzzy
  matching — a rule that decides two names are "similar enough" eventually
  merges two organizations that are not, and `ON DELETE RESTRICT` then refuses
  to let it be undone. And **the same course appears once per accrediting body**
  — "Administrative Human Resources" is listed three times, from SHRM, HRCI and
  LinkedIn Learning — so the same title on the same date is not a duplicate
  unless the issuer matches too.
- **A changelist may pin rows, and only in its default ordering.** `pinned` on
  an `AdminListModel` leads the order clause so the certifications the about
  page is curated around are reachable without paging through a hundred and
  eleven rows. It is dropped the moment the reader sorts by anything else: a
  list that says it is ordered by Title while eight rows sit above the As reads
  as a fault, not a feature. Every other model leaves it unset and its query is
  unchanged.
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
- **Guestbook mail routes on roles, not on addresses.** `is_superuser` and
  `is_staff` decide who is emailed —
  `lib/email/guestbook-plan.ts` is the whole rule as a pure function, with the
  matrix under test offline. The version before it asked whether the poster's
  address appeared in `CONTACT_EMAIL_RECIPIENT`, which is the owner's *inbox*
  and has no reason to match the address they sign in with, so the exclusion
  never fired. The two roles are not interchangeable: a superuser's own post
  notifies nobody, a staff member's still notifies the owner — and because
  superuser implies staff, the rule that suppresses the receipt covers both
  without naming both.
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
node scripts/check-drafts.mjs                           # a draft stays a draft
npx tsx scripts/check-public-access.mjs                # who may post, and what is_active means
npx tsx scripts/check-emails.mjs                       # all five templates
npx tsx scripts/check-db-classes.mjs                   # no classes in stored content
npx tsx --conditions=react-server scripts/check-site-console.mjs
npx tsx scripts/check-account-panel.mjs                 # sign in / sign out, both states
npx tsx --conditions=react-server scripts/check-turnstile.mjs
npx tsx --conditions=react-server scripts/check-storage.mjs
npx tsx --conditions=react-server scripts/check-admin-media.mjs   # the id/key seam
npx tsx --conditions=react-server scripts/check-admin-image-link.mjs # upload and link, one bucket
npx tsx scripts/check-admin-usage.mjs                   # every FK into a lookup table is counted
npx tsx scripts/check-admin.mjs
npx tsx --conditions=react-server scripts/check-admin-access.mjs   # roles, grants, and no leaked rows
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

`scripts/audit-storage.mjs` is not a check either, and it is the one that looks
at the bucket rather than at the rows. Everything else here reasons outwards
from the database -- `check-storage.mjs` proves `FILE_COLUMNS` is complete,
`check-admin-forms.mjs` and `check-admin-image-link.mjs` prove that replacing or
removing an image deletes the object it replaced -- so an object that leaked
before those existed is invisible to all of them. It reports and exits 0: what
it finds is a judgement call, and deleting a file because a script cannot find a
row for it is precisely the mistake reference counting exists to prevent.

`scripts/export-certifications.mjs` and `scripts/import-certifications.mjs` are
not checks either, and they are the pair to reach for before and after any bulk
edit of the certifications. The first writes every row to
`certifications.dump.json` — named so the `*.dump.json` rule in `.gitignore`
covers it, because a dump that can be committed eventually is. The second reads
a saved LinkedIn "Licenses & certifications" page, matches each issuer to an
organization, creates the ones that are missing with a name and a slug and
nothing else, and inserts what is not already stored. It is a dry run unless
given `--apply`, and that dry run is the review: it prints every row it would
write, so the output is read before the second run rather than after it. Running
it twice is safe — see the credential-URL rule above for what makes that true.

`scripts/seed-admin-access.mjs` is not a check. It is the other half of the
migration that added `account.is_superuser` and `app.admin_access`: that made
the column and the table, and this fills them -- the first superuser, and full grants for every account
that was already staff, so the day per-screen permissions shipped was invisible
to the people already using the admin. It is a dry run unless given `--apply`,
and safe to re-run: the grants go in with `on conflict do nothing`, so a second
run adds rows for screens added since and never undoes a narrowing somebody
made on purpose. Run it under `npx tsx`, not `node` -- it imports
`lib/auth/permissions.ts`, which resolves the `@/` alias.

`--preset=<editor|moderator|viewer>` narrows what it writes to one of the
shapes in `lib/auth/presets.ts` -- the same three the Access screen offers, so a
terminal and a browser cannot end up with two ideas of what a role is. Without
the flag it still writes all four booleans on every screen, which is the
behaviour the migration depended on and has to stay.

**Run it after adding a screen.** A registry entry with no grant rows behind it
is a screen every staff account is silently locked out of, and nothing else
reports that: the rail simply does not draw it, which is indistinguishable from
working correctly.

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
