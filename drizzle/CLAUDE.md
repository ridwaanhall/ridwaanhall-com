# The schema

Guidance for working in `drizzle/` and everything that changes the database's shape. The root `CLAUDE.md` covers everything that applies everywhere.

## The schema

Everything reads and writes the **`app`** schema: 56 tables, uuid keys, real
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
`0000_init.sql` and the step that got it there lives in git history. See the Row
Level Security trap in the root `CLAUDE.md` for what a delta has to do that this
file does not.

```bash
node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
node scripts/gen-app-schema.mjs                # regenerate the Drizzle mapping
npx tsx scripts/check-baseline-schema.mjs      # the file still builds this schema
npx tsx scripts/check-app-schema.mjs           # the mapping still matches it
```

`lib/db/app-schema.ts` is **generated**, never edited by hand: 56 tables of
column names is exactly the transcription that fails silently, because a
mistyped SQL name is a column the app writes to and never reads back.
`drizzle-kit pull` cannot produce it — with `schemaFilter: ["app"]` it fetches
zero tables — which is why the generator reads `information_schema` instead.

`check-baseline-schema.mjs` is the one that keeps the setup instructions honest:
it applies `0000_init.sql` into a scratch schema inside a transaction, compares
columns, keys, foreign-key actions, checks, indexes and RLS against the live
schema, and rolls back.

## The database holds one schema, and it is `app`

There was a second one. `public` held the 42 tables the site's previous build
left behind, and it stayed while the domain still served that build. It is gone:
the tables and their sequences are dropped, the empty schema is kept because it
is named in the default `search_path` and Supabase's tooling assumes it exists.

The file that dropped it and the two scripts that guarded the moment
(`check-schema-parity.mjs`, `catch-up-from-public.mjs`) are deleted, which is
what their own headers asked for.

**What made it safe is worth keeping.** Nothing in `app` referred to `public` --
no foreign key crossed the two, no view or trigger outside it depended on a
table in it, and every extension lives in `extensions` rather than there. The
one real coupling was a raw `for update` in `togglePin` naming an *unqualified*
table that resolved past `app` into the old schema; it was found and replaced
with an advisory lock first. That is the shape to look for if a third schema
ever appears: not the imports, which are all schema-qualified through
`app-schema.ts`, but a table name inside a `sql``` template, which nothing type
checks and `search_path` will happily resolve somewhere unintended.

## A running `next dev` holds the old schema mapping

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

## A cascade declared in application code is not a cascade

`app` declares its referential actions in SQL: 31 `CASCADE` where a child has no
meaning without its parent, 30 `SET NULL` where it does, 9 `RESTRICT` where the
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

## Other things worth knowing here

- **A migration file must not carry its own `begin`/`commit`.**
  `scripts/apply-migration.mjs` wraps the whole file in one transaction and
  rolls it back unless `--apply` is passed; a `commit` inside ends that
  transaction from the inside, so the dry run commits and still reports "nothing
  changed". A migration here did exactly this once, and its dry run committed.
  The script now refuses such a file — but a PL/pgSQL `DO $$ … BEGIN … END $$`
  block is a *block*, not a transaction, so dollar-quoted bodies are blanked
  before that check runs. Scanning the raw text refuses every migration that
  enables RLS in a loop, which is to say the schema itself.
