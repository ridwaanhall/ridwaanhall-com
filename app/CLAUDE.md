# Routes and loading states

Guidance for working in `app/`. The root `CLAUDE.md` covers everything that applies everywhere.

## `/admin/<a>/<b>` is two shapes behind one route

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

## Other things worth knowing here

- **A dynamic route under `cacheComponents` cannot set a 404 status.** The
  status is committed as soon as the route is known to be dynamic, and reading
  the session cookie is what makes it so. Assert the body, not the status. The
  same applies to a redirect: `/sign-in` bounces a signed-in reader to `/` and
  that bounce is a 200 whose body carries the navigation, so it lands *after*
  `load`. A check that reads the URL straight after `goto` sees `/sign-in`.
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
- **A `loading.tsx` skeleton must not render `<main>`.** Every site page
  renders exactly one, `PageMotion` scopes itself to it, and the harnesses count
  them. Build public skeletons from `components/foothill/skeleton.tsx`, which is
  shaped to keep that true; `components/skeleton.tsx` is the admin's.
- **The page you left is still in the document.** Under `cacheComponents`
  Next keeps recently visited routes mounted inside a hidden `<Activity>`, so
  after a navigation there are two `<main>`s, two of any id the pages share,
  and the old one is `display: none`. Count *visible* elements in a harness,
  and never `getElementById` for something a sibling page could also carry --
  `SectionIndex` picks the visible match. `#page-content` used to be keyed on
  the pathname, which threw these away; the key needed `usePathname`, which
  needs a `<Suspense>`, and the only fallback that keeps the page prerendered
  is the page itself -- so every document shipped its content twice. The
  router already remounts a page when its segment changes.
- **`usePathname` in the shell has to sit inside `<Suspense>`.** It suspends
  while prerendering a route whose params were not listed in advance -- a 404
  for an unknown slug -- and outside a boundary that is a console error on that
  route and a blocked prerender. The navbar is the shell's one reader, with
  itself-minus-the-active-link as the fallback.
