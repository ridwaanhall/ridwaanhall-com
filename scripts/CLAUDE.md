# The harnesses

Guidance for working in `scripts/`, and finishing any change. The root `CLAUDE.md` covers everything that applies everywhere.

## Verification

Each harness covers one mechanism, runs against the live application, and cleans
up after itself. Run the relevant ones before calling a change done; run all of
them before a release.

```bash
npm test                                               # the unit suite, offline
npm run build && node scripts/check-css-sources.mjs   # no stray utilities
node scripts/check-class-collisions.mjs                # (after a build) no public class is also a utility
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
node scripts/check-markdown.mjs                         # every page has a .md twin, no draft does
npx tsx scripts/check-public-access.mjs                # who may post, and what is_active means
npx tsx scripts/check-emails.mjs                       # all five templates
npx tsx scripts/check-db-classes.mjs                   # no classes in stored content
npx tsx --conditions=react-server scripts/check-site-console.mjs
npx tsx scripts/check-account-panel.mjs                 # sign in / sign out, both states
npx tsx --conditions=react-server scripts/check-turnstile.mjs
npx tsx --conditions=react-server scripts/check-storage.mjs
npx tsx --conditions=react-server scripts/check-admin-media.mjs   # the id/key seam
npx tsx --conditions=react-server scripts/check-image-alt.mjs      # an image says what it is
npx tsx --conditions=react-server scripts/check-admin-image-link.mjs # upload and link, one bucket
npx tsx --conditions=react-server scripts/check-image-service.mjs # the resize setting reaches the reader
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

`scripts/mint-session.mjs` and `scripts/fixture-ids.mjs` are what the
browser-driven harnesses stand on, not checks: the first issues an Auth.js
session cookie for an account id, the second resolves the staff and reader
accounts and the rows a harness drives instead of writing keys down.
`scripts/db-probe.mjs` is a connectivity and inventory check against whichever
database `.env.local` names, and `scripts/generate-blog-covers.mjs` draws every
post's cover in the site's own design -- a dry run that writes PNGs unless given
`--apply`, which uploads them and repoints the posts.

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
it twice is safe — see the credential-URL rule below for what makes that true.

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

## Other things worth knowing here

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
