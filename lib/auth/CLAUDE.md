# Auth, roles and grants

Guidance for working in `lib/auth/`. The root `CLAUDE.md` covers everything that applies everywhere.

## Abuse limits

`lib/auth/throttle.ts` allows one account five guestbook messages or comments a
minute, counted from the rows themselves because a serverless function remembers
nothing between requests. A guestbook message can send three emails, so this is
the limit that matters before an account has to be switched off by hand. Redirect
targets from the browser go through `lib/utils/same-path.ts`, which also refuses
a tab or newline (a URL parser drops them, so `/<tab>/host` is `//host`).
`frame-ancestors`, `base-uri` and `object-src` are an enforced
`Content-Security-Policy`; the full policy is still report-only beside it.

## A grant per screen

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

## Three roles, and they nest

    public  ⊂  staff  ⊂  superuser

**On screen they are Public, Editor and Owner.** `ROLE_LABEL` in
`lib/auth/roles.ts` is the one place that says so, and every label, message and
email badge reads it or repeats it; the columns and identifiers (`is_staff`,
`is_superuser`, `"superuser"` in a descriptor) keep the longer names, because
renaming a column is a migration and the words in the interface are a choice.

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

## Other things worth knowing here

- **`signOut` redirects to `AUTH_URL`, not to the origin the request came in
  on.** `createActionURL` prefers that variable unconditionally, so
  `signOut({ redirectTo })` sends the browser to whatever host it names, as an
  absolute URL. Signing out of the admin looked like it did nothing for exactly
  that reason -- and no harness saw it, because a fresh Playwright context has
  no prefetched router cache and no host to disagree about. `signOutHere` calls
  `signOut({ redirect: false })`, which still writes the delete-cookies, and
  does its own relative `redirect()`. **Never hand `redirectTo` to Auth.js
  here.**
- **A session cookie outlives the schema.** Sessions are thirty-day JWTs and
  `token.sub` is the account key, so every reader signed in before the move to
  `app` presented `sub: "1"` for a month afterwards — a subject that names no
  row and is not even a well-formed key. `auth.ts`'s `session` callback refuses
  a subject that is not a uuid, which is the single place a token becomes a
  session; all six readers of `session.user.id` are downstream of it and need no
  guard of their own. `scripts/check-site-console.mjs` drives every page with
  such a token.
