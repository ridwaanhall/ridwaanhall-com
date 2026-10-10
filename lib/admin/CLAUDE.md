# The admin's descriptors

Guidance for working in `lib/admin/`. The root `CLAUDE.md` covers everything that applies everywhere.

@../auth/CLAUDE.md
@../storage/CLAUDE.md

## The admin is declarative

`lib/admin/registry.ts` names every screen. `lib/admin/models/` holds one module
per area, each declaring a changelist descriptor (columns, filters, search
fields, ordering) and a form descriptor (fieldsets, field kinds, inlines).

`lib/admin/models/settings.ts` is the exception to "one module per area": the
**Settings** group is the vocabularies every other screen's dropdowns are drawn
from, and fourteen of them are the same few columns (`slug`, `label`,
`description`, `position`, and a count of what points at them). They come from
one `vocabulary` factory rather than fourteen transcriptions, because fourteen
hand-written copies of the same descriptor is precisely the shape that drifts.
`category` and `project-status` are written out longhand beside it, each needing
something the factory deliberately does not offer.

**A vocabulary says what each value means.** Twelve of them carry `description`
(every one but `tag` and `category`): one short sentence, edited on the row,
drawn under the option in every dropdown that offers it and under the control
once chosen. A project status's is shown to readers as well, as the tooltip on
its tag, the line under the Work filter and beside the status on a project's
page; an application status's, on the job hunt. Every place that offers a
vocabulary does it through `vocabularyOptions` (`lib/admin/vocab.ts`), which
states the two things a hand-written `{ table, value, label }` left out: the hint
column, and the `position` the table is read in. Without that second one
`labelledRows` sorts by label, and Availability offered "Within 1 month" before
"Within 2 weeks" while the notice periods ran "1 month, 2 months, 2 weeks, 3
months, None".
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

## Every model has full CRUD, with a few exceptions

`canCreate` and `canDelete` are `boolean | "superuser"`, and the third state is
the one to be careful with -- see the trap below.

`user`: **create refused to everybody**, because an account *is* a provider
identity and one made here is a row nobody can sign in to. **Delete is
`"superuser"`**, because the reason it used to be refused outright -- it
cascades through every comment and guestbook message that person wrote -- is a
question of consequence rather than of possibility, and refusing it to everyone
meant the only way to remove an account was SQL, with no confirmation and no
warning.

`project-status` **is created and deleted like every other vocabulary**, which
it could not be until the colour moved onto the row. The refusal was never about
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

`profile`, `hiring-profile`, `open-to-work-profile` and `site-setting`: **both
refused to everybody, superuser included**, and this is the one place that role
is not the answer. Each is one row by definition -- `/admin/<key>` *is* that
record's form, there is no list and no create route. Deleting one of the first
three takes the site down, since every page in the public layout renders the
profile block, with nothing in the admin able to recreate it; `site-setting` is
held to one row by a unique index on a constant, and a missing row only means
the defaults (`getImageSettings`), but the screen has no reason to offer a
delete either.

Everything else creates, reads, updates and deletes, subject to the grant.
`scripts/check-admin-forms.mjs` asserts both directions; "no add form" on its
own is satisfied by an admin that cannot create anything at all.

## An image describes itself, and the record is only the fallback

`media_asset.alt` was in the schema from the first migration and was the one
column in it that **nothing read and nothing wrote** -- no form offered a field,
no query selected it, and `image-field.tsx` rendered its own preview with a
hardcoded `alt=""`. Alt text came from the *record* instead: a post's title, or
`"<title> — image N of M"` for a gallery. So a post with five screenshots
described all five as that post's title, five times over.

**The description is on the asset, not on the record**, which the schema had
already decided and is the right grain: one file here is named by up to
twenty-one rows, and a photo of a person is a photo of that person wherever it
appears. Editing it anywhere changes it everywhere, deliberately.

`altFieldName` makes it a sidecar input beside `__clear` and `__link`, so an
inline row's box posts as `images:0:mediaId__alt` with nothing special-casing
it. Two things about the write are easy to get wrong and invisible when you do:

- **It has to survive a save that touches no bytes.** Editing a description
  without replacing the image is the commonest thing anybody will do here, and
  `applyImageFields` returns early for an untouched field long before it would
  reach the description -- so the alt is read at the top of the loop and
  recorded against whichever key the field ends up holding, including the
  existing one.
- **Inline rows count.** A gallery *is* inlines, so an implementation that
  handled only the record's own fields would work on the author photo and
  silently do nothing on every image the feature exists for. `saveInlines`
  returns its alts the way it returns `stale`, and `saveRecord` writes both maps
  at once.

On the way out it is `image_alts`, a **parallel array** rather than a richer
`images` map. That map is published as-is by `/api/blog` and `/api/projects`;
turning its values into objects would change that JSON for every reader to add
a field most of them do not want. An entry is `""` where nothing has been
written, which is most of them, and `Gallery`
(`components/foothill/gallery.tsx`) falls back to the built description there -- the two are asserted separately in
`scripts/check-image-alt.mjs`, because preferring the stored one and keeping the
fallback are different bugs and a check that conflates them passes while most of
the site's images say nothing.

**That harness waits for the "Saved." notice, not for `networkidle`.** The save
is a server action and the network settles while the write is still in flight,
so reading the row straight after reported an empty description and a working
pipeline as broken -- twice, and the second time after a dev-server restart that
was blamed for it.

## The matrix has to describe the role it is looking at

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

## The Access group is two screens, and only one of them is a role

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

## One screen is not a descriptor

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

## A grant is not a cascade

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

## A "Used by" column is a transcription, and transcriptions rot

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

## A correlated subquery binds to the wrong table the day the names collide

`lib/admin/sql.ts` exists because Drizzle renders a column interpolated into a
raw `sql` template with its *bare* name, not `"table"."column"` — and a
correlated subquery is precisely where that decides which table a name binds to.
An earlier raw template over `guestbook_userprofile` showed it once; it happened
again anyway, in the case below, which is the worked example in the module's
header.

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

## `canDelete: "superuser"` is a truthy string

The same shape as `readOnly: "afterCreate"`, and it fails the same way:
`model.canDelete !== false` reads the third state as *allowed* and offers a
superuser-only delete to every staff account. It type checks, lints, builds, and
is invisible until somebody deletes an account.

**Read it through `permits()` or `roleAllows()` in `lib/auth/permissions.ts`,
never as the property.** There were four call sites doing it by hand before this
existed — the two `new` routes, `changelist-screen.tsx` and `record-screen.tsx`.
`permits` also combines the flag with the grant, which is the other half nobody
should write twice.

## Other things worth knowing here

- **A changelist may pin rows, and only in its default ordering.** `pinned` on
  an `AdminListModel` leads the order clause so the certifications the about
  page is curated around are reachable without paging through a hundred and
  eleven rows. It is dropped the moment the reader sorts by anything else: a
  list that says it is ordered by Title while eight rows sit above the As reads
  as a fault, not a feature. Every other model leaves it unset and its query is
  unchanged.
