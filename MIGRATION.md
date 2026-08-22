# Django → Next.js migration checklist

Working list for the port. Tracked in the repo so it survives between sessions.
Tick items as they land; strike an item out with a reason when it turns out not
to be needed rather than deleting it, so the decision stays visible.

Verification harnesses (run all three before calling a phase done):

```bash
node scripts/compare-with-django.mjs   # data layer vs Django, field by field
node scripts/compare-meta.mjs          # <head> vs the live site, page by page
node scripts/check-breakpoints.mjs     # one visible theme toggle at every width
node scripts/check-notifications.mjs   # toast stack outside the transformed column
node scripts/check-ui-state.mjs        # palette highlight rules, Turnstile theme binding
npx tsx scripts/check-auth-adapter.mjs # Auth.js adapter vs the live schema, rolled back
node scripts/compare-guestbook.mjs     # thread shape and captions vs the live site
npx tsx scripts/check-comments.mjs     # comment rules vs the live schema, rolled back
npx tsx scripts/check-emails.mjs       # all five email pairs render, escape, and fill
npx tsx --conditions=react-server scripts/check-turnstile.mjs   # spam gate fails closed
npx tsx scripts/check-admin.mjs [base]  # the admin gate leaks nothing; the changelist works
npx tsx scripts/check-rls.mjs           # RLS on every public table, and the app not locked out
npx tsx --conditions=react-server scripts/check-admin-forms.mjs [base]  # the change form, driven live
npx tsx --conditions=react-server scripts/check-storage.mjs  # uploads, deletes, reference counting
npx tsx --conditions=react-server scripts/check-admin-json.mjs  # jsonb fidelity, GET-then-POST-unchanged
npx tsx --conditions=react-server scripts/check-admin-inlines.mjs  # child rows, ordering, cascading deletes
npx tsx --conditions=react-server scripts/check-admin-richtext.mjs  # the editor, the sanitiser, the round trip
node scripts/compare-jsonld.mjs        # structured data vs the live site
node scripts/compare-prose.mjs [slug] [width]   # rich-text typography vs live
MSYS_NO_PATHCONV=1 node scripts/compare-layout.mjs [path]   # rendered geometry vs live
```

`compare-layout.mjs` takes an optional path and a `WIDTH` env var. On Git Bash,
`MSYS_NO_PATHCONV=1` is required or a leading-slash argument is rewritten into a
Windows path before node sees it.

`compare-with-django.mjs` needs a fresh dump first:
`cd .. && DEBUG=False uv run python web/scripts/django_dump.py`

**If `compare-layout.mjs /dashboard/` reports a missing WakaTime panel, clear
`.next/dev/cache` before believing it.** `getWakatimeStats` is an
`unstable_cache` with `revalidate: 900`, so a *failed* fetch caches its `null`
for fifteen minutes and the panel renders as nothing -- with no error logged on
any request after the first, and the page returning in 200ms. This is easy to
trigger by accident: the first request after `rm -rf .next` competes with a cold
Turbopack compile, and the client's 10s `AbortSignal.timeout` fires even though
both WakaTime endpoints answer in ~1.5s on their own. The harness then shows five
diffs (both `h2`s and a 494px `main`) that have nothing to do with the change
under test. `rm -rf .next/cache` is *not* enough -- dev writes to `.next/dev/cache`.

---

## Phase 1 — foundation, data, public pages

### Foundation
- [x] Branch, scaffold, `cacheComponents`, pinned turbopack root
- [x] `.gitignore` traps (`*.json`, unanchored `lib/`) fixed
- [x] Drizzle schema introspected from live Supabase
- [x] DB client (pgbouncer constraints, pool sizing)
- [x] Theme CSS + bundled stylesheets + fonts + DB class safelist
- [x] Root layout, next-themes, theme-color sync

### Data layer + API
- [x] `lib/data/about.ts` — profile, experience, education, certifications, skills, awards, applications
- [x] `lib/data/content.ts` — blog + projects, image compat fields, sorting, search, pagination
- [x] `lib/data/openhire.ts`, `lib/data/legal.ts`
- [x] Route handlers for all of the above
- [x] Verified byte-identical to Django (15/15)

### Layout shell
- [x] Desktop rail, mobile navbar, mobile drawer (drag/backdrop/Escape)
- [x] Nav links, status badges, footer, profile avatar
- [x] Theme toggle with the three-path switch
- [x] ⌘K search palette
- [x] CV redirect routes (`/cv`, `/cv-latest`, `/cv-copy`)

### SEO
- [x] `lib/seo/config.ts`, `data.ts`, `metadata.ts`
- [x] `generateMetadata` on every route; verified against live (11/11)
- [x] JSON-LD schema generator; verified against live (11/11 pages)
- [x] `app/sitemap.ts` + the three named sitemap documents
- [x] `app/robots.ts`
- [x] `app/manifest.ts`
- [x] `proxy.ts` — `X-Robots-Tag: noindex` (Middleware is called Proxy in Next 16)
- [ ] **Re-add `/guestbook/` to the sitemap** once the page is real (phase 2) — it is
      deliberately omitted now rather than advertising a stub

### Pages
- [x] `not-found.tsx` + `error.tsx` (from `templates/error.html`)
- [x] Home — intro, latest blogs, skills marquee, sponsor
      (layout verified against live at 375 / 768 / 1440)
- [ ] Home — the `social.html` section is **not** included on the homepage in Django
      either; it belongs to the contact page. Confirm when contact is built.
- [x] About — intro, tabs (experience / education / awards / certifications / applications),
      CV download, sponsor (layout verified against live at 375 / 768 / 1280)
- [x] ~~work-together section~~ — `about/sections/work_together.html` exists but is
      referenced by no template. Dead in Django; not ported.
- [x] Projects list — cards, search, pagination (layout verified against live)
- [x] Project detail — gallery, tech stack, features, external links, timestamps, rich-text description
- [x] Blog list — featured slider, cards, search, pagination (layout verified against live)
- [x] Blog detail — rich-text body, gallery, share row, author/date, tags
      (typography verified against live across 7 posts at 375 / 768 / 1280)
- [x] OpenHire — 19 templates, gated on `is_open_to_work || is_hiring`, both now
      enabled in production. Verified against live at 375 / 768 / 1280: identical
      geometry, and identical rendered text on **both** tabs with every position
      expanded (`scripts/compare-openhire.mjs` — the hiring tab is hidden on load, so
      `compare-layout.mjs` never measures it).
      Sixteen section templates collapsed into four shared shapes
      (`components/site/openhire-cards.tsx`): a bordered card with an indigo icon,
      a label/value row, a pill tag and a bulleted line. The fifth near-copy of the
      Show/Hide disclosure (`togglePositionDetails`) became `PositionCard`.
      One deliberate change: the "Apply for …" mailto now percent-encodes its
      `subject`, which Django emitted raw.
- [x] Legal / privacy / terms — sections with one level of nesting (layout verified against live)
- [x] Dashboard — GitHub contributions heatmap + WakaTime stats.
      Grid verified cell-for-cell against live: 371 cells, identical level
      distribution and month labels; every stat matches.
- [x] Contact — social links and form shell (layout verified against live at 375 / 768 / 1280,
      allowing for the Turnstile widget the port does not render yet)
- [ ] Contact — **wire up submission**: POST endpoint, Turnstile widget + server-side
      verify, and the two emails. Phase 2. The form currently reports that it is not
      connected rather than silently doing nothing.

### Client behaviour to port

All of it is verified against live by `scripts/compare-interactions.mjs` (the
three document-wide behaviours, which have no markup of their own and so are
invisible to every layout and text comparison) and `scripts/compare-gallery.mjs`.

- [x] Image lightbox (`imageLightbox.js`, 425 lines + its CSS) — and with it the
      two image sliders it depended on. `blogImageSlider.js` and
      `projectImageSlider.js` were 120 near-identical lines each; they are one
      `MediaGallery` variant now, with the transform track, prev/next, dots,
      filename-follows-slide and auto-advance the port had dropped for a
      scroll-snap row. Verified with `scripts/compare-gallery.mjs` at 375 and
      1280 on a 7-image project, a 1-image project and a 2-image post: frame
      box, filename, track transform, every button's classes and box, and the
      whole lightbox (open, advance, Escape, body scroll lock, body-level
      mount).
- [x] Sliders — the blog and project galleries **and** the blog listing's
      featured slider are transform tracks with arrows, dot indicators and an
      auto-advance, as they were. All three were converted to scroll-snap rows
      early in the port on the reasoning that native scrolling keeps swipe and
      momentum for free; that trade is right for the homepage's Latest Blogs
      row, which has no slide indices and no pagination, and wrong for these,
      which have both. The dots are how a reader knows there is more than one
      slide at all.
- [x] Back-to-top — **removed entirely**, by request. It was on about, legal and
      openhire (matching which Django templates rendered `#scrollToTopBtn`); the
      floating cluster is gone with it. The detail pages' floating "Back to
      blog"/"Back to projects" buttons were never ported and remain unported —
      both pages carry an inline back link instead.
- [x] Tooltips (`tooltip.js`) — one mounted component, delegated from `document`,
      so markup that appears later (gallery controls, lightbox buttons, a panel
      that was hidden) is covered with no observer and no re-scan. Verified on a
      real emulated touch device: the chip shows on tap, carries the trigger's
      own `title` text, and times itself out — which is the entire reason the
      module exists, since a native `title` renders on hover only.
- [x] Click spark (`clickSpark.js`, canvas, `mousedown` not `pointerdown`) — the
      canvas is appended to `document.body`, not rendered in place: it is
      `position: fixed`, and `#page-content` carries a transform, which would
      become its containing block and confine the sparks to the content column.
- [x] GitHub contributions heatmap — markup rather than 295 lines of DOM building
- [x] Tab switching (`switchTab.js`) and the four career toggles (`toggleCareer.js`
      carried `toggleResponsibilities`, `toggleAchievements`, `toggleAchievementsCerts`
      and `toggleJourney` — one `<Disclosure>` replaces all four, and every
      instance now says "Show more" / "Show less" rather than three different
      phrasings for one gesture).
      Button and panel are **separate elements** sharing state through context.
      They have to be: in every card the button sits in a header row, usually
      the right-hand cell of a `justify-between` flex, while the panel belongs
      below the row that follows it, full width. Rendering them together made
      the panel a flex item of that header, so expanding a role squeezed its
      responsibilities into the narrow right-hand column and shoved the title
      sideways.
- [x] Expand/collapse animation — `grid-template-rows: 0fr → 1fr` rather than
      the original's measured `max-height`. Same 300ms reveal with no
      `scrollHeight` probe, no second timeout to restore `hidden`, and no upper
      bound to overshoot when the content is shorter than the guess.
      Verified against live: the experience, education, certification and
      application cards are byte-for-byte the same height **both** collapsed and
      expanded (132→297, 132→243, 157→388, 181→383), and all four animate.
- [x] Back-to-top / floating actions (`backScroll.js`) — on about, legal and
      openhire, matching which templates rendered `#scrollToTopBtn`
- [x] Copy-to-clipboard (in the blog share row)
- [x] Count-up (`countUp.js`) — matches the original's integer formatting
- [x] Search palette open/close transition — the original's `modalDialog.js`
      swapped `backdrop-blur-none`→`backdrop-blur-md` and the panel's
      `scale-95 opacity-0`→`scale-100 opacity-100` a tick after revealing the
      root, and reversed it before hiding. The port had the transition classes
      on the markup but nothing ever changed them, so the palette appeared and
      vanished instantly. Traced against live: the two opacity curves now sit on
      top of each other in both directions.
- [x] `searchEnable.js` — the state is known while rendering now, so there is
      nothing to correct after the fact. The original assigned `button.className`
      wholesale on DOMContentLoaded, which threw away the `search-submit-btn`
      class the server had rendered and left the button briefly wearing an
      uncoloured `border` (Tailwind v4 defaults `border-color` to
      `currentColor`) until the script ran.

---

## Phase 2 — interactive features
- [x] Auth.js v5 adapter over `auth_user` / `socialaccount_socialaccount` /
      `guestbook_userprofile` — `lib/auth/adapter.ts`, no new tables. Verified by
      `scripts/check-auth-adapter.mjs`, which runs all 23 checks against the live
      schema inside a transaction it rolls back (row counts re-asserted after).
      Sessions are JWTs: `django_session` holds a Django-serialised, Django-signed
      blob Auth.js can neither read nor write, and a third session table for a
      stack being retired buys nothing. **The token carries identity only** —
      `is_author` / `is_co_author` are read from the database at the point of use
      (`lib/auth/profile.ts`), because a 30-day token must not be the authority on
      who may delete other people's messages.
      Verified end to end apart from the provider round trip itself, which needs
      the account owner's own credentials: both authorize handoffs are correct
      (Google `openid profile email` + `access_type=online`, GitHub `user:email`,
      matching `SOCIALACCOUNT_PROVIDERS`), and a locally minted token round-trips
      through `/api/auth/session` as `user.id = "1"`.
- [x] **OAuth redirect URIs for the new callback path** —
      `http://localhost:3000/api/auth/callback/{google,github}` are registered
      alongside the allauth ones, so both stacks work at once. The path changed
      with the framework: allauth used
      `/guestbook/accounts/<provider>/login/callback/`, Auth.js uses
      `/api/auth/callback/<provider>`, and the old registration did not cover it
      — Google answered `Error 400: redirect_uri_mismatch` until the new URI was
      added. Re-tested after: Google reaches its consent screen carrying the new
      `redirect_uri`, GitHub reaches its login page.
- [ ] **Add the production redirect URIs before cutover.** Only the localhost
      ones exist for the new path. Google needs
      `https://ridwaanhall.com/api/auth/callback/google` adding to its list;
      GitHub needs `https://ridwaanhall.com/api/auth/callback/github`. Missing
      these fails at the provider, which looks nothing like an app bug.
- [x] Guestbook — threaded tree (3 levels), pin, delete branch, `show_reply_to`.
      Verified against live by `scripts/compare-guestbook.mjs`, which walks both
      rendered threads and compares every message's id, depth, parent, pinned
      state, caption and body: **50 messages, 29 roots, max depth 2, 1 caption,
      identical on both sides**. That is the check worth having — `tree.py` and
      `lib/data/guestbook-tree.ts` are two implementations of one algorithm, and
      a unit test would only prove the port agrees with itself.
      Signed-in UI verified with a locally minted session (author account): all
      three per-message controls render, the unpin control appears on the pinned
      card, depths 0–2 only, and the "Signed in as" line masks the address
      exactly as `mask_email` does (`ri************v@gmail.com`).
      Write path exercised end to end against the live guestbook, with the
      account owner's go-ahead: post (50→51, "Message posted.", threaded at the
      foot of the panel with the Author badge), pin ("Pinned Messages (2/3)",
      badge on the message and a card in the section), unpin (back to 1/3, badge
      gone), then delete through the shared confirm dialog — which opened with
      the right wording, quoted the message and focused Cancel. Database
      afterwards: 50 rows, max id 63, 1 pinned, identical to the baseline, and
      `compare-guestbook.mjs` still matches live.
- [x] Comments — generic relation, single-level flattening, soft delete. On both
      detail pages, behind a `<Suspense>` boundary.
      The table is empty on live, so there is no rendered thread to compare
      against; `scripts/check-comments.mjs` drives the rules against the live
      schema instead, inside a transaction it rolls back (0 → 0 rows after).
      All 22 pass, covering the four that are security properties rather than
      cosmetics: a reply-to-a-reply flattens onto the root; a `reply_to` naming
      a comment on *another* post does not resolve; deleting is soft, so a
      removed parent keeps its place, blanks its body, stops being counted and
      stops being deletable; and the permission matrix (own / author / signed
      out / someone else's).
      Geometry verified against live on both detail pages: the section measures
      **349px on both sides**, prompt 164, empty message 68.
      Django's `next` + `url_has_allowed_host_and_scheme` are gone with the
      redirect — the action revalidates a path it already knows, so there is no
      redirect sink. The same validation moved to `lib/actions/auth.ts`, which
      does still hand a browser-supplied path to `signIn`/`signOut`.
      One deliberate change: a commenter's display name is now the provider
      profile, the same name the guestbook shows. Django read
      `get_full_name|default:username` here and the provider profile there, so
      one person could appear under two names; unifying costs nothing with the
      table empty.
- [x] Comments — exercised against live and cleaned up. Posted a root comment
      and a reply on a real post, then soft-deleted the root through the shared
      confirm dialog: the tombstone replaced the body, **the reply survived**,
      and the heading dropped from 2 to 1. Row state confirmed directly
      (`is_deleted = true`, the reply still pointing at it, both scoped to
      `content_type_id = 21`, `object_id = 20`), then both rows hard-`DELETE`d
      so no tombstone lingers -- table back to 0 and the post reads "No comments
      yet".
      One thing the UI cannot do, by design: a reply carries no Reply button, so
      a reply-to-a-reply is unreachable except by a crafted request. That is
      what the flattening rule defends against and
      `scripts/check-comments.mjs` covers it.
- [x] Contact form — zod + Turnstile + Resend. The two emails go out and **only
      the owner notification decides the outcome**, as `send_contact_email` did:
      a form that reports failure because the courtesy auto-reply bounced has
      thrown away the message it existed to deliver.
      `scripts/check-turnstile.mjs` asserts it fails closed against Cloudflare's
      real API — a missing, empty and forged token are all rejected. That is the
      failure that matters, because a verifier returning `true` on an error path
      looks identical to a working one until the inbox fills.
      ~~react-hook-form~~ — three uncontrolled fields with `required` and
      `type="email"` need no form library; the browser's own validation covers
      them and works before hydration.
      The `/contact/` entry in `compare-layout.mjs`'s `EXPECTED` is **gone**, as
      its own note said it should be once the widget landed: both sides now
      measure a 72px widget inside a 752px `main`, delta 0.
- [x] Email templates (5 pairs) — `lib/email/templates.ts`, copied **verbatim**
      rather than re-authored with react-email. They are 62KB of hand-tuned,
      table-based markup that renders correctly across mail clients; transcribing
      that into JSX would risk a divergence that only shows up in someone's
      inbox. `scripts/inline-email-templates.mjs` regenerates them while the
      Django tree exists.
      **Verified byte-identical**: both renderers were driven with the same
      hostile inputs (a name carrying `<script>`, a multi-line message with
      `<img onerror>`) and all ten bodies came out `cmp`-identical.
      `lib/email/render.ts` closes the gotcha CLAUDE.md records: Django filled
      `{{ key }}` with `str.replace` and left an unmatched token *in the sent
      email*, with "no automated test covers these". Rendering now throws
      instead, and `scripts/check-emails.mjs` is that test — 27 checks over
      placeholders, escaping, the unescaped URL and the empty-name fallbacks.
- [x] Guestbook — email notifications on a new message. All three of the
      receiver's dispatch rules: notify the owner unless the sender is the owner,
      confirm to the sender, and tell whoever was replied to unless that is the
      same person. Fired through `after()` so three SMTP round trips do not keep
      the poster waiting, and it can no more fail the post than the original's
      bare `except` could.
- [x] Blog view counter — verified live: one page load took the post from 80 to
      81, with no Strict Mode double-count.
      It moved to the browser out of necessity and the meaning changed with it.
      Django incremented in the detail view, but this page is prerendered from
      `generateStaticParams`, so counting there would record one view per deploy.
      A beacon counts readers whose browser ran the page, excluding the
      prerender, crawlers and prefetches — and makes the count best-effort, which
      is the right trade for a number that must never delay the article.
- [x] Toast stack (sonner) + confirm dialog — both mounted in `app/layout.tsx`, as
      siblings of `{children}` and therefore outside `#page-content`. Verified at
      runtime by `scripts/check-notifications.mjs`, which also proves its own
      predicate discriminates (moving the region inside flips the assertion).
      `components/site/toast.tsx` is the only definition of a toast's markup, as
      `_toast.html` was; sonner supplies only the machinery `notify.js`
      hand-rolled — timers, the hover hold, stacking, enter/exit — and none of
      the appearance (`toastOptions.unstyled`). Geometry matches the original:
      384px (`sm:w-96`) from `sm` up, `calc(100% - 32px)` below it, 16px inset,
      8px gaps, four visible, `z-[60]` over the dialog's `z-50`. Measured in
      light mode at 9.1 / 8.8 / 7.95 : 1.
      The confirm dialog is a promise — `await confirm({...})` — rather than the
      two `data-confirm-*` modes; see the departures table.
      `lib/utils/use-modal.ts` now carries the mount/reveal timing, the scroll
      lock and Escape, shared with the search palette the way `modalDialog.js`
      was.

---

## Rich text (replaces the stored content blocks)

The blog body and project descriptions were authored as JSONB blocks carrying
hand-typed Tailwind classes. They are HTML now, styled by `styles/prose.css`.

- [x] `scripts/blocks-to-html.mjs` — conversion, dry-run by default. Removed
      once the columns it read were dropped; `git show` is the way back to it
- [x] `blog_blogpost.content_html`, `projects_project.description_html`
      (additive at first, so Django's admin kept working and the conversion
      stayed reversible; `content`/`description` dropped in `drizzle/0003`)
- [x] `styles/prose.css` — every value measured from the live rendering
- [x] `components/site/rich-text.tsx` + `lib/utils/sanitize.ts`
- [x] **Tiptap editor in the admin** — `components/admin/rich-text-editor.tsx`.
      Configured *down* to the sanitiser's vocabulary rather than up from the
      default: headings start at 2 because `h1` belongs to the page, and the
      extensions are the ones the stored content uses. Image is deliberately
      left out — across all 84 rows of stored HTML there is not one `<img>`,
      `<sub>`, `<sup>` or `<mark>`, and an image in the body would need its own
      upload flow inside the editor rather than the gallery inline beside it.
- [x] **`about_profile.stories_html`** — `drizzle/0004`, the same move for the
      last piece of prose still edited as a list. `stories` was a JSONB array of
      paragraph strings behind a textarea-per-paragraph widget with arrow
      buttons; it is the Tiptap editor now, like a blog body. Additive, so
      `stories` stays and Django keeps rendering from it. The reader sees no
      difference: `.prose-stories` in `styles/prose.css` keeps the block on the
      page's own 16px/24px rather than the article scale `.prose-content` sets,
      and `compare-layout.mjs` matches the live site at 375, 768 and 1280
- [x] Drop `content` and `description`, and the `@source inline(...)` entries
      for classes that only existed in blocks — `drizzle/0003`. All 29 listed
      classes turned out to come from those two columns alone: the JSONB that
      remains (legal sections, profile stories) carries no `class` key at all,
      and across 20 posts and 64 projects the converted HTML carries exactly one
      class, `language-python`. `scripts/check-db-classes.mjs` replaces
      `db-classes.mjs` and keeps it that way, proving the sanitiser strips a
      utility rather than trusting its allow-list by reading it

## Phase 3 — admin
- [x] Shell, auth gate on `is_staff` — `app/admin/`, `lib/auth/staff.ts`,
      `components/admin/`. The 18 screens are declared up front in
      `lib/admin/registry.ts`, grouped by Django app; the unbuilt ones render
      dimmed rather than as links to a 404, so the sidebar shows how much is
      left. `scripts/check-admin.mjs` covers the gate and the changelist.
- [x] The generic changelist — `lib/admin/list.ts` + `components/admin/changelist.tsx`.
      One descriptor per model carries `list_display` / `list_filter` /
      `search_fields` / `ordering`; a new screen is a descriptor and nothing else.
- [x] **All 15 changelists**, one module per Django app under `lib/admin/models/`,
      mirroring `apps/<app>/admin.py` one to one. The three singletons
      (`Profile`, `HiringProfile`, `OpenToWorkProfile`) have no list by
      definition and arrive with the forms.
- [x] The generic change form — `lib/admin/form.ts`, `lib/actions/admin.ts`,
      `components/admin/record-form.tsx`. Fields are declared per model and
      **only declared fields are written**: the save path walks the descriptor
      rather than the submitted `FormData`, so a hand-crafted POST carrying
      `is_superuser` reaches no column. Create, edit, delete, per-field
      validation, unique clashes on the field, and `updateTag` invalidation.
- [x] **Forms for all thirteen models with a changelist and no inline**:
      Experience, Education, Certification, Award, Skill, Application,
      Organization, Legal document, Legal section, Message, User profile,
      Comment, User. `canCreate` / `canDelete` are set per model with the reason
      at the descriptor — an account is made by a sign-in, a message by a reader,
      a profile row by a signal.
- [x] Image upload to Supabase Storage + reference-counted cleanup —
      `lib/storage/objects.ts`, `keys.ts`, `cleanup.ts`, and the `image` field
      kind. Ported with the 25s total upload budget, retry only on 408/429/5xx,
      and "missing is success" on delete.
- [x] **The JSON editors that still have something to edit**: `string-list` and
      `key-value`. Not five — see below.
- [x] Users screen (`is_staff` / `is_active`; the author flags live on User
      profiles, since they are a different table and one field with two homes is
      how the two drift)
- [x] **Inlines** — `lib/admin/inlines.ts` + `components/admin/inline-editor.tsx`.
      Rows are matched by primary key, never by position; position carries the
      order, and only for an inline that declares a column to put it in.
- [x] **The three singletons** — Profile, Hiring profile, Open to work profile.
      `/admin/<key>` is the record's form, which is where Django's
      `SingletonModelAdmin` redirected the changelist to anyway.
- [x] **Blog post and Project forms**, with the rich-text editor, their image
      inlines and the project's tech-stack many-to-many. **Phase 3 is done:**
      all 18 screens exist and all 18 are editable.

### Decisions taken while building it

- **Server-rendered, not TanStack Table.** The plan named it, and it earns its
  weight for *client-side* table state. Sorting, filtering, searching and paging
  are all answered in SQL here — several of these tables outgrow a page (101
  skills, 64 projects, 62 applications) and a list that silently sorts only the
  rows it already has is worse than one that does not sort at all. Expressing it
  all in the URL instead means the back button works, a filtered list can be
  bookmarked, and no table state has to be shipped and kept in step. No
  dependency was added.
- **Readable query parameters** (`?q=`, `?page=`, `?sort=`, `?dir=`) rather than
  Django's positional `?o=1.-2` and `?is_featured__exact=1`. Nothing links to the
  old URLs — the admin is gated and `noindex` — so there was no scheme to keep.
- **One flat URL segment**, `/admin/blog-post`, not `/admin/blog/blogpost`. Every
  model name is unique across the eight apps, so the app segment said nothing.
- **Foreign keys display through a scalar subquery, not a join.** Django needed
  `list_select_related` to avoid a query per row; a correlated subquery is
  likewise one query and keeps a single table in `FROM`, so filtering, ordering,
  counting and paging compose with no join plumbing duplicated between the row
  query and the count query. They are built by `lib/admin/sql.ts` and **must
  not** be hand-written as `sql` templates — see the trap below.
- **A foreign-key filter lists only the values present**, which is
  `RelatedOnlyFieldListFilter` rather than Django's default. The comments filter
  offered all thirty-odd `django_content_type` rows when comments only ever
  attach to two.
- **A few default orderings were changed, each for a stated reason** (all noted
  at the descriptor): projects and skills open on the name rather than the id,
  since 64 and 101 rows are past the point of scrolling for one; comments open
  newest-first rather than in `created_at` thread order, because a changelist is
  not a thread. Where a model's `ordering` names a column `list_display` did not
  include (`Education.id`, `LegalDocument.sort_order`), that column was added —
  otherwise the list is unsortable by the very thing it is sorted by.
- **The editor uses the site's own `.prose-content`**, not a separate editor
  theme. What is typed looks like what the page renders, and it costs no CSS
  since the stylesheet is already in the bundle. `styles/admin-editor.css` adds
  only the editing chrome Tiptap does not ship.
- **A many-to-many is deleted and re-inserted, not diffed.** The join table
  carries nothing but two keys, so a row has no identity worth preserving and no
  order to keep — which is exactly the difference between `Project.tech_stack`
  and `Profile.skills_highlight`, whose sequence became the JSON-LD `knowsAbout`
  array and therefore needed a through model.
- **Reordering is up/down buttons, not drag.** Order is real in several places
  and has to be editable, but buttons work with a keyboard, a screen reader and
  a thumb without the announcement and focus-management work a drag surface
  needs to be usable by all three. The plan named dnd-kit; no dependency was
  added.
- **An inline row's position in the list is its order.** Every field name derives
  from the array index, so moving a row renumbers its inputs and the server
  writes the new index into the order column. There is no separate order input
  that could disagree with what is on screen — the failure Django's formset
  `ORDER` field is prone to when a row is inserted between two others. An inline
  with no order column (the application journey, ordered by timestamp) offers no
  reorder buttons rather than ones that do nothing.
- **Three of the "five JSON editors" were already dead.** `GroupedKeyValueField`
  and `CopyrightCreditsField` served `core.PrivacyPolicy`, deleted in migration
  `0003_delete_privacypolicy`, and had zero uses left in the Django tree;
  `ContentBlockField` edits `BlogPost.content`, which this port replaces with
  `content_html` and a rich-text editor. Only `string-list` and `key-value` were
  ported. `ChoiceListField` is real but its only users are the two openhire
  singletons, so it arrives with them rather than sitting unused and untested.
- **A `reference` field is a plain select, not an autocomplete.** Django used
  `autocomplete_fields` for the organisation picker; nineteen rows do not need a
  search endpoint. The moment that list outgrows a screenful is the moment to
  build one.
- **Legal sections offer every section as a parent**, where Django's inline
  filtered to top-level sections of the same document. The inline knew which
  document was open; this screen edits a section on its own and the document is
  an unsubmitted field on the same form, so there is nothing to filter against.
  Nesting stays one level by convention, and the one case that cannot work — a
  section nested under itself — is refused in `validate`.
- **An uploaded file is named after its contents**, not after the name it
  arrived with: `logo/acme-corp-a1b2c3d4.webp`, where the suffix is a digest of
  the bytes. Django kept the name deterministic and documented the consequence —
  re-uploading over an existing key is an in-place replace, and Supabase's read
  path is CDN-fronted, so the old bytes could be served for a while afterwards.
  Content addressing removes that case instead of documenting it: same bytes,
  same key, so a stale copy is byte-identical; different bytes, different key,
  and a freshly-created key is immediately consistent. It also makes an upload
  idempotent, which matters for the retry loop.
- **Uploads are capped at 4MB**, because Vercel caps a serverless request body
  at 4.5MB. `serverActions.bodySizeLimit` is set to match, so the refusal is a
  sentence this app writes rather than a gateway error it cannot explain.
- **The extension decides the stored `Content-Type`, from an allowlist.** It is
  what Supabase serves the object with, so accepting the browser's claim
  unchecked would let an upload be served as `text/html` from the storage host.
  SVG is on the list because 78 skill icons in the database are SVGs.
- **Editing is refused where the record is not the admin's to make.** A
  guestbook message is written by a reader, an account by a sign-in, a
  `UserProfile` by a `post_save` signal — so none of them offers an add form,
  and `saveRecord` refuses the same case again on the server. Deleting an
  account is refused outright: it would cascade through their messages and
  comments, and there is no re-registration flow to undo it, since the account
  *is* the provider identity.
- **You cannot lock yourself out of the admin.** `staffGate` needs
  `is_active AND is_staff`, both read fresh per request, and every account is
  OAuth with no password to sign back in with — so clearing either on your own
  account is unrecoverable. Django's `UserAdmin` allowed exactly that.
- **Pinning is not offered as a checkbox**, though `is_pinned` is a boolean
  column. `pinMessage` caps the pinned set under a deterministic row lock and
  stamps `pinned_at`, which is what the pinned cards are ordered by; a generic
  form setting the flag alone would skip the cap and break the ordering. The
  field is read-only in the admin and points at the guestbook.
- **`auth_user` has no Django counterpart to port.** Django inherited
  `django.contrib.auth`'s `UserAdmin`, so the users screen is built to what the
  accounts are for here: who reaches the admin, and who is credited on the
  guestbook. No password management — every account is OAuth and
  `auth_user.password` holds an unusable hash — and no groups or permission
  matrix, since there are zero `auth_group` rows and every staff account is a
  superuser.

---

## Still in development

Nothing here is deployed. The site runs against the **live Supabase database**
-- the same rows ridwaanhall.com serves -- but the Next.js app itself only runs
locally, and production stays on Django until every phase below is finished and
checked. Anything marked "before cutover" is deliberately deferred until then,
not forgotten:

- ~~verifying a sending domain in Resend~~ — **done.** `updates.ridwaanhall.com`
  is verified and `DEFAULT_FROM_EMAIL` is `notify@updates.ridwaanhall.com`. All
  five templates were sent through it and delivered. Before that, Resend rejected
  the unverified `rone.dev` with a 403 and the sandbox sender would only deliver
  to the account's own address; Django never hit either, because it sent over
  Gmail SMTP where the from-address needs no third-party verification.
- ~~the production OAuth redirect URIs~~ — **done.** Both providers carry
  `https://ridwaanhall.com/api/auth/callback/{google,github}` alongside the
  localhost ones. The old allauth URLs are still registered and can be removed
  once nothing links to them.
- ~~re-applying RLS as a SQL migration~~ — **done**, `drizzle/0002`
- ~~swapping `vercel.json` and CI to Node~~ — **done**
- dropping `content`/`description` and `core_contentversion` — written as
  `drizzle/0003` and the application no longer names any of them, but **the SQL
  has not been run**. See the note under Phase 4

---

## Phase 4 — cutover
- [x] Promote `web/` to repo root, delete the Django tree
- [x] Replace `vercel.json`, swap CI to Node (`.github/workflows/ci.yml`)
- [x] backup Django project to the new branch with name django — `django`
      branch, cut at the end of phase 3 with the whole tree intact
- [x] **RLS as a SQL migration** — `drizzle/0002_enable_row_level_security.sql`,
      plus `scripts/check-rls.mjs`. The migration runs once where Django's
      `post_migrate` receiver ran after every schema change, so the check is what
      closes the gap: it fails if any public table ever appears without RLS.
      Verified that the app's role (`postgres`) has `rolbypassrls`, so enabling
      it costs the application nothing, and that the check catches a table with
      RLS switched off
- [x] Drop `core_contentversion`, `blog_blogpost.content` and
      `projects_project.description` — `drizzle/0003_drop_django_leftovers.sql`.
      **Keep `django_content_type`**: three live foreign keys point at it,
      `comments_comment.content_type_id` among them.

      **The SQL runs after the Next.js deploy, not before.** This is the one
      ordering constraint in the whole cutover, and it is easy to miss because
      every other step is safe in either order. Production still serves Django
      from `main` against this same database, and Django reads all three:
      `apps/core/cache.py` reads `core_contentversion` on every cache-key
      computation, and `BlogPost.content` / `Project.description` are ordinary
      model fields its ORM names in every select. Running the migration while
      Django is live takes the site down with a `column does not exist` on
      essentially every page.

      Verified before writing it: `core_contentversion` holds four rows and no
      foreign key touches it, and every one of the 20 posts and 64 projects has
      non-empty `content_html` / `description_html`, so nothing loses a body.
      The snapshot taken first is `pre-drop-blocks.dump.json` — ignored by git
      because it is content, and the only remaining way back to the
      pre-conversion rendering, so keep it somewhere that outlives the working
      copy
- [x] Rewrite `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`
- [x] Env vars: the Django-only keys moved to `old.txt` (gitignored, real
      credentials), so `.env` and `.env.local` now hold only what the running
      app reads

---

## Deliberate deviations from Django

Each is recorded at its call site and in the comparison scripts.

| What | Why |
|---|---|
| Journey steps tie-break on `id` | Django's order was arbitrary Postgres heap order, unstable across a VACUUM |
| `/terms/` as the document URL | Django's `get_absolute_url` disagreed with Django's own sitemap; the sitemap is what is indexed |
| `keywords` selection | Django sliced an unordered set, so it changed between server restarts |
| Canonical no longer echoes the request | A paginated listing declared *itself* canonical, which is what the tag exists to prevent |
| `article:published_time` in ISO 8601 | Django emitted a human-readable date, unparseable by every consumer |
| No 500ms delay before navigation | It masked a full page load; client-side routing has none to mask |
| `is_active` out of the cached payload | Clock-derived, so it blocked prerendering — for a field no template renders |
| List endpoints return card-sized rows | A card reads 6–7 fields; shipping whole records cost ~10× the bytes |
| Cross-tab theme sync has no crossfade | next-themes' storage listener writes the attribute with no hook to intercept |
| Sitemap `lastmod` from real rows | Django's source directory was deleted in the ORM migration, so every page reported 2024-01-01 |
| Sitemap paginates at 10, not 6 | Django advertised `/blog/?page=3` and 4 more project pages that do not exist |
| `wordCount` counted from the body | Django read a key the blog dict never had, so it always emitted 0 |
| Marquee rows shuffled from fixed seeds | `Math.random()` in a prerendered tree is rejected, and a visitor sees one arrangement per load either way |
| Content blocks → rich-text HTML | Requested. Removes hand-typed classes from the content entirely |
| Uniform list indent, heading weight, paragraph spacing | The stored variants were inconsistent hand-typing, and several never resolved at all |
| Blog/project links are indigo | Stored link colours were green in one post and unresolved (invisible) in another |
| **No trailing slash**: `/about/` → `/about` | Requested. Reverses the port's original choice of keeping Django's `APPEND_SLASH` shape. Costs one 308 per indexed URL, once; every canonical, sitemap entry and JSON-LD `@id` emits the slash-free form directly, so nothing in our own markup points at a redirect. Taken while nothing is deployed. `compare-layout`, `compare-meta` and `compare-jsonld` all normalise the slash away rather than flagging every page forever |
| **Emails follow the site's light theme** | Requested. The five Django templates were dark (`#09090b`/`#18181b`/`#6366f1`) and hand-maintained separately. They are one shell now (`lib/email/layout.ts`) in the light palette taken from `input.css` -- white canvas, `#f7f7f7` card, `#f0f0f1` inset, `#4f39f6` accent -- so a change to the header, card or footer happens once and no two can drift |

## Inherited bugs fixed in passing

- `DEFAULT_IMAGE` pointed at `/staticfiles/img/…`, which 404s (`STATIC_URL` is `static/`)
- `article:published_time` was not a parseable date
- `keywords` was non-deterministic across restarts
- `is_active` was dead code constraining the cache design
- Sitemap `lastmod` was frozen at the 2024-01-01 fallback for every page but the dashboard
- Sitemap advertised 7 paginated URLs that do not exist, each serving duplicate content
- `wordCount` in BlogPosting JSON-LD was always 0
- **`pl-5` was never generated**, so 7 of 19 lists rendered at `padding-left: 0`
  with their bullets outside the text column
- `lg:text-2xl`, `md:mt-5` and `text-medium` on every h2 never resolved either
  (`text-medium` is not a Tailwind class; `font-medium` is)
- `text-blue-600` never resolved, so one post's links were the same colour as
  body text
- **The project gallery's filename never followed the slide.**
  `projectImageSlider.js` looks for `.current-filename` inside
  `.project-slider-container`, but the header holding it is a *sibling* of that
  element inside `.gallery-frame`, so the lookup returns null and the update is
  skipped. `blogImageSlider.js` walks up to `.blog-image-gallery` first and gets
  it right, which is why only the project gallery is affected.
- **The about intro overflowed the viewport horizontally on every phone.** See
  the wrapping note above — the row was `flex` with no `flex-wrap`, so three
  status badges beside a heading simply ran off the page.
- **The search palette never marked the page you were on.** Django gave that
  row `bg-zinc-800`, a permanently rotated icon and an "You are here" caption
  in place of its section chip, and dropped its `data-url` so a click did
  nothing. All of it was missing. Restored, and verified from ten pages --
  including the two that match nested paths, where `/blog/<slug>/` marks Blog
  exactly as the sidebar does. The one difference is the cursor: the original
  left `cursor-pointer` on a row that leads nowhere, and the port uses
  `cursor-default`, matching the sidebar's own current item.
- **The application cards' fact badges lost their icons in the port.** Five
  glyphs — employment type, location type, location, salary, applied via — were
  dropped when the badges were rebuilt from a colour table. Restored from the
  original markup rather than retyped, so the two solid-fill paths with their
  own viewBoxes (`0 0 950 950`, `0 0 32 32`) are byte-identical.
- **The lightbox always opened on the first image**, whichever slide you were
  looking at. `getCurrentSlideIndex` parses the track's inline transform with
  `/translateX\((-?\d+(?:\.\d+)?)%\)/` — in a regex literal `\(` is an escaped
  backslash followed by the start of a group, so the pattern hunts for a literal
  backslash after `translateX` and can never match. Every call fell through to
  `return 0`.

## Deliberate departures from the live site (requested)

- **The comment form and its sign-in prompt have no card around them.** The
  contact page's form sits directly on the page; these drew a bordered, filled
  panel inside the comment section's own rule, with the reply chip and the
  textarea each drawing another inside that. The field and the button are the
  contact form's now, and the button keeps the row and the right-hand position
  it had. Posting uses the guestbook's send glyph, so the two places where a
  reader writes something look the same.
- **The guestbook panel has no outer border and no header bar.** The bar read
  "Guestbook Messages" directly beneath a heading that said "Guestbook", with
  the count as a filled badge inside it. The count is a caption under the page's
  own description now, and the border is gone -- it was a box drawn around what
  is already the whole page.

- **The position card is the site's disclosure now**, not its own. It was the
  last of four near-copies of the control: local `useState`, a panel hidden with
  `hidden`, no transition, and the only one still saying "Show Details" / "Hide
  Details". It also loses its border -- these sit inside a `SectionCard` that
  already draws one, so each posting was a box inside a box -- and its facts use
  the shared meta row, so a job's location looks like an application's.
- **`components/site/meta-row.tsx`** is where that row lives, with the five fact
  glyphs. Three cards use it and it belonged to none of them.

- **Education cards are built on the application card's anatomy**, with the
  logo kept: the institution named first and the degree in italics beside it,
  the dates as a chip at the right of that row, and the place sharing the line
  below with "Show more". It led with the degree before, which was a third
  reading order for what is the same kind of card as the two tabs either side
  of it. Awards and certifications still use the older shape.
- **The error page is built out of the site's own parts.** It was its own
  visual world -- a red-to-pink gradient behind the status code, a pulsing ring
  around a warning triangle, `font-bold` and `font-semibold` in a site that uses
  neither. It reads as a page of this site now: the heading and description any
  other page has, the home hero's `action-btn` pair, the sidebar footer's
  bulleted link row, and the status code as a quiet chip rather than the loudest
  thing on screen. It still renders outside the site shell and still touches no
  data, which matters because the failure this app has is a database it cannot
  reach.

- **The tab underline is one bar that slides.** Each tab used to own a 2px
  bottom border that switched colour, so the mark vanished here and reappeared
  there. It is now a single absolutely-positioned bar measured against the
  active button, and it follows the strip onto its second row when the row
  wraps. Shared by the about page and OpenHire.
- **The GitHub contribution grid fades in**, each of its 371 cells on its own
  delay. The delay is computed from the cell's position rather than drawn at
  random, because the grid renders on the server first and a random number
  would hydrate as a mismatch on every one of them.
- **A card's border no longer brightens on hover.** It sits at what used to be
  the hover value all the time. A page of cards made every pointer movement
  flicker an outline somewhere, and the resting edge was too faint to read the
  card's shape when the pointer was elsewhere; hover is left to controls.
- **One meta row for the whole about page.** Experience, education and the
  application cards each had their own type size, gaps and icon size for the
  same "when, what kind, where" line. `MetaRow` / `MetaItem` in
  `components/site/about-cards.tsx` is the one shape, and the application card
  -- where it came from -- imports it.
- **The dashboard's section headings match the contact page's**: a 24px stroke
  glyph at `mr-3` and `text-xl font-medium`, rather than a larger bare heading
  in a different size from every other section heading on the site.
- **OpenHire's requirement cards run full width** instead of three columns from
  `md` up, which gave a bulleted list a third of the measure and set it to a
  different rhythm from the sections above and below it. Its Curriculum Vitae
  block is the about page's banner now, not a second CV layout with one format
  fewer.
- **The desktop rail scrolls.** It is pinned to the window's full height, and
  on a short one the profile block, the search box and eight nav items did not
  fit -- Guestbook and Contact were cut off with nothing to say they were
  there. Everything above `SidebarFooter` scrolls; the footer stays put, so the
  scroll appears exactly when the nav would otherwise run into it.
- **An application's outcome carries its colour in text and border only.** A
  filled chip in a card that is otherwise all outline read as a button, and
  pulled harder than the company name above it.

- **Colour is spent only where it carries information.** An application's
  outcome and a project's lifecycle keep it, in one shared treatment; everything
  that was decorated rather than distinguished gives it up. The three
  availability flags are zinc with no fill and no pulsing dot, and take their
  colour on hover; an application's work type, location, salary and referrer are
  plain text with their icons instead of five differently-hued pills; the date on
  an education, award or certification card is a neutral caption rather than an
  indigo gradient; and the "Current" marker on a role reads like the "Show more"
  pill beside it. The compiled stylesheet is 7.8KB smaller for it.
- **The three availability flags have one vocabulary**, exported from
  `components/layout/status-badges.tsx`. They render on four screens and each had
  said something different: the hero "Under the Weather", the drawer "Unwell",
  the rail "Open to Work" and the about intro "Currently Open to Work". The
  intro no longer says "Currently"; the short forms survive below `sm`, where
  spelling one out beside the heading is what used to scroll a 375px page
  sideways.
- **Page headings are one colour.** Twelve of them split their title across two
  -- "Dash*board*", "About *Me*", "Hi, I'm *Ridwan*" -- which made an accent of
  the half that carried no more meaning than the other. The legal pages still
  store the split as `title_lead` / `title_accent`; the component renders them as
  one string and the columns are untouched.
- **The guestbook's reply, pin and delete controls are always on screen.** They
  faded in on hovering a message, so the only way to find out a message could be
  replied to was to put a pointer on it -- and on a touch screen there is no
  hover, so the first tap revealed the control the second one used.

- **The guestbook opens at the newest message.** `buildThread` sorts ascending,
  so the panel reads oldest first and the newest message is the last row in a
  50-message window inside a 55vh box -- which meant it opened several screens
  above the conversation. It now starts scrolled to the bottom, before paint,
  and follows the thread down when a message is added. Django's page had the
  same fault and nobody asked for it.
- **The sidebar carries an Admin link for staff**, beside Privacy and Terms.
  Django rendered one from `{% if user.is_staff %}`; the port dropped it because
  the public site is prerendered and the flag is a per-request database read.
  It is back as the one streamed hole in the chrome -- see
  `components/layout/admin-link.tsx`.
- **The profile's stories are edited as rich text**, not as ten textareas with
  arrow buttons beside them. Asked for, and the same editor the blog body and
  project descriptions use. The rendered page is unchanged.
- **The admin's change form uses the whole page.** It was one 768px column,
  which on a 1440px screen left a third of the window empty and put Save four
  thousand pixels below the title on a blog post. A form with a rich-text field
  now puts the body in a wide column and the fieldsets after it in a narrower
  one that stays put; a form without one flows its fieldsets two-up; and the
  Save/Delete bar is sticky. The shape is derived from the descriptor, so no
  model declares it.

- **Every disclosure says "Show more" / "Show less".** Django used three
  phrasings for one gesture — "Show More", "Show Achievements", "View
  Application Journey" — and one wording was asked for. The button is otherwise
  identical, so it measures 1–4px narrower where the label is shorter.
- **Hovering a featured post's title softens the photo behind it** (`blur-sm`
  plus a small `scale-105`, the same pairing the project card uses so a blur
  does not thin the frame's outer pixels into a seam). The live site has no
  such affordance.
- **No back-to-top button anywhere.** Django rendered one on about, legal,
  openhire and both detail pages.
- **The about intro's status badges wrap on narrow screens.** With all three
  flags set they do not fit beside the heading below about 1000px, and the
  original let them shrink rather than wrap: at 768 that pushes the document to
  924px wide — 156px past the viewport — with each pill 74px tall because its
  own label has wrapped inside it; at 375 the third badge starts past the right
  edge entirely. Wrapping the row removes the horizontal scroll. It used to cost
  one badge's height, making `/about/` 38px taller at 375 and 768; the smaller
  badges below pull the other way, so the combined delta is now +16 / -12 / +6 at
  375 / 768 / 1280 -- one `compare-layout.mjs` entry per width, since it is no
  longer constant, and no longer zero above ~1000px.
- **Every "Show more" is a `rounded-full` pill.** Django rounded the same
  control three different ways: a pill on experience and applications,
  `rounded-lg` on education and certifications.
- **The search palette marks nothing until you ask it to, and typing marks the
  first match.** Opening used to highlight the first navigable row, which put
  the hover wash on Home before the pointer had gone near it -- or on Dashboard
  when you were already on Home, since the current page is skipped. Either way
  it read as the palette selecting a row by itself. Typing is different and
  keeps its highlight: with a query, the top row is a search result rather than
  a phantom cursor, and it is what makes Ctrl+K, type, Enter reach a page.
  Django required an arrow key before Enter did anything, which is the part
  that was deliberately fixed. The highlight still skips the "You are here" row
  for the same reason Enter does.
- **Turnstile follows the site's theme, not the operating system.** Django
  rendered `<div class="cf-turnstile" data-sitekey="…">` and let the script
  choose, which resolves to Turnstile's `auto` -- and `auto` reads
  `prefers-color-scheme`, the one signal this site never consults, so a reader
  who switched the site to light while their OS was dark got a dark box in a
  white form. `components/site/turnstile-widget.tsx` passes the resolved theme
  explicitly. It has to render explicitly rather than by the script's own scan,
  because that scan runs once on load and because a widget reads its theme only
  at creation -- so following the toggle means tearing the old widget down and
  building a new one. `scripts/check-ui-state.mjs` asserts exactly that, and
  that only one widget survives: leaking a second would submit two tokens and
  fail verification.
- **Leaving the palette's list clears the highlight outright.** Hovering a row
  moves the keyboard highlight -- which Django's palette never did -- and
  nothing used to move it back, so a hovered row wore two marks (the row's
  `hover:bg-zinc-800` and the `li`'s `.highlighted` wash) and taking the pointer
  off dropped only the first. The wash that outlived it read as a stuck hover.
  This first returned the highlight to index 0 instead, on the reasoning that it
  is the state the palette opens in and keeps Enter pointing somewhere. In use
  that is worse and was rejected: moving the mouse away makes the mark *jump to
  Home*, which looks like the palette choosing a row by itself. Nothing marked
  is the honest answer -- the pointer is not on anything.
  The highlight on *open* is untouched, so Ctrl+K, type, Enter still works for
  anyone who never reaches for the mouse, and typing resets it to 0; only a
  deliberate hover-then-leave clears it. From cleared, Down goes to the first
  row and Up to the last, both handled explicitly because `-1 - 1 + n` would
  otherwise land on the second-to-last.
  **`index >= 0` on the class is load-bearing**: the inert "You are here" row is
  not in `navigable` and falls back to -1, the same value the cleared state
  uses, so without it clearing the highlight lit up the one row that leads
  nowhere.
- **The about intro's status badges are the mobile drawer's size, and one word
  on a phone.** `px-2 py-0.5 text-xs` with a 1.5-unit dot rather than `px-3
  py-1.5 text-sm` with a 2-unit one, so the same three flags are not drawn at
  two different scales in two places; and below `sm` they read Open / Hiring /
  Unwell instead of spelling out "Under the Weather" on a 375px screen. A pill is
  a flat 22px at every width as a result, against live's 74 / 74 / 34 -- which is
  the whole of `/about/`'s remaining geometry difference, recorded per width in
  `compare-layout.mjs`. Measured in light mode at 6.92 / 8.34 / 6.85 : 1, so the
  smaller type stays past AA.
- **"View Credential" is a `rounded-full` pill.** It was `rounded-lg` while the
  "Show more" button beside it in the same flex row was already a pill, on both
  the award and certification cards. Same reasoning as the "Show more" entry
  above -- Django rounded one control three ways.
- **The certifications banner is the CV banner.** Both tabs open with the same
  object -- icon, title, subtitle, action, footnote -- but the LinkedIn one was
  written separately and had drifted: a `bg-zinc-800/30` fill nothing else on the
  page has, `text-blue-200`/`text-blue-300/80` instead of the zinc scale, an
  indigo icon, and a plain `flex items-center` row that never stacked, so at
  phone widths the button squeezed the text beside it. Both are
  `components/site/about-banner.tsx` now, which is what stops them drifting
  again; the footnote states how many certifications the page itself lists.
  Verified geometry-neutral for the CV banner -- 164 / 118 / 102px at 375 / 768 /
  1280, identical to live.
  **A lone action hugs its label** (137px: 97 text + 14 icon + 4 gap + 20 padding
  + 2 border) rather than splitting the half-width row the three CV buttons
  share. The banner takes its actions as *data* and derives this from how many
  there are, instead of a flag the two callers could set inconsistently -- these
  are server components, so there is no context to carry the decision.
- **The dashboard's stat values are unweighted.** `font-medium` came off the six
  WakaTime figures and the four GitHub numbers; the labels above them keep it.
  Live renders all ten at weight 500.
- **Confirmation is a promise, not two `data-confirm-*` modes.** Django needed
  both: `data-confirm-action` posted the dialog's own form, and
  `data-confirm-event` dispatched a `CustomEvent` for actions carried out over
  fetch, which could not navigate away without discarding the page state they
  had just updated. Neither problem exists here -- every caller is already a
  client component doing its own work -- so `await confirm({ ... })` returns a
  boolean and both modes collapse into one. It also removes the delegation from
  `document` the original needed, which existed because the guestbook replaced
  its whole panel after each post and left any load-time handler pointing at
  dead nodes.
- **Toasts stack newest-first, and overflow queues rather than being dropped.**
  The original appended to a column and deleted from the front, so the newest
  four showed oldest-at-top; sonner's top-anchored stack puts the newest at the
  top, and a fifth waits at `opacity: 0` until one ahead of it clears instead of
  being discarded outright. Both keep the newest four visible, which is the
  property that mattered -- a burst of errors must not push the newest
  off-screen.

## Known, imperceptible differences

- **The palette is serialised differently by the two build pipelines.** Django's
  Tailwind CLI emits `--color-zinc-700: oklch(37% .013 285.805)`; the Next
  pipeline's Lightning CSS pass emits a `#3f3f46` fallback followed by
  `lab(26.8019% 1.35386 -4.68303)`, because it targets browsers without `oklch`
  support. Converting through those spaces lands one unit apart in a single
  channel on some colours — zinc-700 paints as `63,63,71` on live and `63,63,70`
  here, and the hex is Tailwind's own canonical value for it. Every other colour
  measured is bit-identical. `scripts/compare-interactions.mjs` allows one step
  per channel and flags anything larger.

## Traps that must not be re-introduced

- **`/static/svg/icon/`** — 78 skill icons are absolute URLs stored *in the database*.
  Nothing in the codebase references them; no check can see them break.
- **`.gitignore`** — a bare `*.json` and unanchored `lib/`, `build/`, `dist/`, `var/`
  silently swallow new files. Add a `!` line in the same commit and confirm with `git status`.
- **Driver: `node-postgres`, never `postgres.js`.** postgres.js pipelines concurrent
  queries onto one socket, which stalls *permanently* under Supabase's transaction
  pooler -- and not at a clean threshold: 4 and 5 concurrent queries deadlocked while 6
  succeeded. `pg` queues per client and handled 100 concurrent through a pool of 5 in
  687ms. See the table in `lib/db/client.ts`.
- **TLS is set in code, not in the connection URL.** `pg` reads `sslmode=require` as
  `verify-full`, which Supabase's pooler certificate does not satisfy.
- **`unstable_rethrow`** must stay first in any catch around a route handler.
- **`auth_user.username` is generated by two different rules, and both are load-bearing.**
  The provider's own handle is taken verbatim (GitHub's `login` — which is why
  `Harindrawahyu` is stored with its capital) and everything else is slugified
  lowercase (`Ridwan` → `ridwan`). On a collision allauth suffixes the *first*
  candidate rather than falling through to the next, so someone whose GitHub
  login is taken becomes `login2`, never their first name. Both rules were got
  wrong on the first pass and only `scripts/check-auth-adapter.mjs` caught it —
  running against real rows is what made the collision reachable at all.
- **Auth.js writes `socialaccount.extra_data` as the raw provider profile**, the
  shape allauth stored (`google: {sub,name,picture,email,…}`,
  `github: {id,login,name,avatar_url,…}`). `lib/auth/profile.ts` reads the
  display name and avatar back out of it, so a "tidied" subset would blank
  every avatar on the guestbook.
- **A layout is not an auth gate.** Returning a "Not permitted" screen instead of
  `{children}` does not stop the page underneath running: React renders a layout
  and its children concurrently, so the layout only decides what is *displayed*.
  The admin's first version answered a non-staff request with 72KB in which the
  visible HTML said "Not permitted" and the Flight payload below it carried every
  blog post, its slug and its edit URL — not rendered, but transmitted, and
  invisible to any check that reads the page the way a person does. Every admin
  page calls `requireStaff()` as its first `await`; route handlers and server
  actions, which do not nest under a layout at all, call `isStaffRequest()`.
  `scripts/check-admin.mjs` reads whole response bodies, payload included, and
  fails if row data appears in one. Removing the gate to prove it fails takes ten
  seconds and is worth doing after touching any of it.
- **`is_staff` is read from the database per request, never from the token.** Same
  rule as `is_author`/`is_co_author`, and it matters more here: sessions are
  thirty-day JWTs, so a token minted while someone was staff would keep asserting
  it for a month after the flag was cleared.
- **A dynamic route under `cacheComponents` cannot 404.** The status is committed
  as soon as the route is known to be dynamic, and reading the session cookie —
  which every admin page does first, deliberately — is what makes it so. Putting
  the registry lookup ahead of the gate would fix the status; it is not done,
  because the gate goes first. `app/admin/not-found.tsx` does recover a real 404
  for URLs the *router* rejects (an unbuilt screen, an unknown key), and it also
  keeps a mistyped record inside the admin instead of on the site's public 404.
  Assert the body, not the status.
- **`notFound()` thrown inside a `<Suspense>` boundary resolves to nothing.**
  Once the shell is committed and the fallback is on screen, throwing it leaves
  an empty `main` — no message, no 404, nothing. A missing record on
  `/admin/<model>/<id>` is therefore *rendered* (`NothingHere`) rather than
  thrown. Reserve `notFound()` for reads that happen before a boundary.
- **Form submission normalises line breaks to CRLF in *every* field value, not
  only in a `<textarea>`.** The JSON editors escape their newlines inside a JSON
  string, so nothing real reaches the encoder and they were never affected. The
  rich-text field carries HTML with actual newlines in it, and without
  `normaliseNewlines` an untouched save rewrote a whole post with carriage
  returns the stored data has none of — 2068 characters became 2072, silently.
- **ProseMirror's schema requires a block child in every table cell**, so the
  moment a post is edited `<td>x</td>` comes back as `<td><p>x</p></td>` (plus
  `colspan="1" rowspan="1"`). That is not avoidable, so `styles/prose.css` is
  what makes the two render identically: `td > p:last-child` carries no bottom
  margin, or editing one word would add a rem of space under all forty-four
  cells of a table. Measured: 73px either way.
- **A grid item's `min-width` defaults to its min-content width.** The form rows
  are `sm:grid-cols-3`, and a wide table inside the editor pushed the value
  column to 889px in a 360px viewport — every scroll container inside is
  powerless until the item itself carries `min-w-0`. This is the *real* fix for
  the same symptom `contain: layout` treats on the changelist.
- **Django's `on_delete=CASCADE` is Python, not SQL — every foreign key in this
  database is `NO ACTION`.** Django gathers the related rows and deletes them
  itself; Postgres knows nothing about it (`confdeltype = 'a'` on all 37 FKs).
  So deleting any parent with children raises a foreign-key violation unless the
  application clears them first.

  This shipped as a live bug: `deleteMessage` in `lib/actions/guestbook.ts`
  carried a comment saying "`reply_to` cascades in Postgres exactly as Django
  declared it", and deleting a guestbook message that had replies would have
  failed. It now walks the branch with a recursive CTE, and the admin's
  `deleteWithChildren` does the same from the `cascades` a form declares.

  **It hid because the constraints are `DEFERRABLE INITIALLY DEFERRED`**: the
  check happens at commit, so a transaction that rolls back never reaches it —
  which is exactly what a check script cleaning up after itself does. To test
  this at all, force it: `set constraints all immediate` before the rollback.
  The same property is what lets one transaction delete a parent and its
  children in any order.
- **The JSON editors normalise exactly one thing: CRLF.** Nothing is trimmed —
  two stored `class` strings contain double spaces and block text is raw HTML —
  but a textarea's *submission* value is CRLF-normalised per the HTML spec and
  the stored data contains no carriage return at all. Django dodged that by
  reading `.value` from JavaScript; here the value really is posted, so it is
  normalised on arrival.
- **List order is real; object key order is not.** Postgres `jsonb` preserves
  array order and normalises object key order, so the string-list editor offers
  reordering and the key/value editor deliberately does not — a reorder control
  there would appear to work locally and be a silent no-op live.
- **A file is never deleted because one row stopped naming it.** Several are
  deliberately shared: `profile/ridwaanhall_20250913_2.webp` is named by
  twenty-one rows (all twenty blog posts and the profile),
  `logo/al_mukmin_ngruki.webp` by three organisations. `deleteUnreferenced`
  checks all five key-holding columns first, in one statement, and only then
  deletes. `FILE_COLUMNS` is a hand-written list because there is no reflection
  over a Drizzle schema — `scripts/check-storage.mjs` scans every text column in
  the public schema for key-shaped values and fails if one is not declared.
- **Cleanup is never the reason a save fails.** Storage errors are collected and
  returned, never thrown; an orphaned object is a far smaller problem than a 500
  on the screen that triggered it. The budget spans the whole operation rather
  than each call, because a cascade issues one delete per row — seven on the
  largest live project — and a per-call limit would reset seven times and bound
  nothing.
- **An empty file input means "not edited", never "make it empty".** Treating it
  as a clear would blank the image every time any other field on the record was
  saved. Removing an image is a separate checkbox.
- **`export const instant = false` is per page file and does not survive a
  rewrite.** It was dropped from the record route when that file was rewritten
  to add the form, and the dev overlay raised the insight again. The record route
  now takes the *stream* fix instead — a non-`async` page passing the `params`
  promise into a suspended child — so navigating from a changelist to a row
  paints the frame at once. The admin layout keeps `instant = false` on purpose:
  a shell that showed the sidebar before `staffGate` resolved would flash the
  whole admin at someone not entitled to it.
- **Nothing that holds a Drizzle column may cross to a client component.** A
  `PgColumn` references its table, which references every column back, so
  serialising one is an infinite walk — and React answers it with
  `RangeError: Maximum call stack size exceeded`, which names nothing. Form
  descriptors go through `toClientFieldsets`, which builds the projection up
  explicitly rather than destructuring the column away, so a field gaining
  another non-serialisable property is a compile error and not a stack overflow.
- **Writes are keyed by the Drizzle property, not the SQL column name.**
  `insert` and `set` take the schema's own keys (`iconSvg`); `PgColumn.name` is
  `icon_svg`. Handing over the latter produced an insert Drizzle had no column
  for and every create silently wrote nothing. `toColumns` resolves the key from
  the table by column identity — the two happen to match on single-word columns,
  which is exactly why guessing looked fine.
- **A driver error is on `error.cause`, not on `error`.** Drizzle wraps a failed
  query in a `DrizzleQueryError`, so `error.code` is `undefined` and a unique
  violation falls through as a 500 instead of a message on the field.
  `driverError` walks the chain.
- **Django's two spellings of "optional" produce different columns.**
  `blank=True` alone leaves a `NOT NULL` column holding the empty string;
  `blank=True, null=True` allows a real null. Writing `null` into the first
  raises a not-null violation — which is what every optional field on the first
  form did. `blankValue` reads `column.notNull` rather than assuming.
- **Never build a correlated subquery as a raw `sql` template.** Drizzle renders
  a column interpolated into `sql` with its *bare* name, not `"table"."column"`,
  and a correlated subquery is exactly where that decides which table a name
  binds to. Written by hand, the users screen produced `where "user_id" = "id"`
  — correlating `guestbook_userprofile` with itself instead of with `auth_user`.
  The lookups that appeared to work did so only because the outer column's name
  did not exist on the inner table, so Postgres resolved it outward by
  elimination. Passing the same thing through drizzle's `QueryBuilder` renders
  it fully qualified; `lib/admin/sql.ts` is that, and every scalar lookup in the
  admin goes through it.
- **`contain: layout` on the changelist's scroll container is load-bearing.**
  Without it the table's `min-w-[46rem]` leaked past its own `overflow-x-auto`
  into the initial containing block and the whole page scrolled 78px sideways at
  390px wide — while `body` and every ancestor correctly reported 390, so only
  `document.documentElement.scrollWidth` showed it. Clipping the container,
  clipping any wrapper, `overflow-x: clip` on `main` or `html`, `width: 100%`,
  `min-width: 0` and `flow-root` all changed nothing; only `contain: layout` (or
  the heavier `contain: paint`) did.
- **No shadows.** `grep -rn 'shadow' app components` should stay empty apart from `ring-*`.
- **Tooltips are `title` attributes**, never `group-hover` chips — a chip is unreachable on touch.
- **A check script that drives a `server-only` module needs
  `--conditions=react-server`.** `import "server-only"` throws on purpose
  outside a server environment, which otherwise makes the email and Turnstile
  modules unimportable from `tsx` — and testing a copy of them instead would
  defeat the point. The condition resolves its no-op export.
- **`compare-layout.mjs`'s `EXPECTED` entries only applied to `main`** until the
  comment work needed one elsewhere: every entry carried a `key`, but the call
  site hard-coded `key === "main"`, so the field was decorative and no exemption
  could be written for a heading. It is matched now. A body whose height differs
  moves every heading below it, and those are separate measurements.
- **A client component must not import from a module that touches `db`.** The
  guestbook panel imported two constants from `lib/data/guestbook.ts` and pulled
  `pg` into the browser bundle, which fails outright on `Can't resolve 'dns'`.
  Types alone are erased; it is a *value* import that drags the module in. Pure
  shapes, limits and logic live in `lib/data/guestbook-tree.ts` for exactly this
  reason -- and it mirrors the original's own split, `tree.py` issuing no
  queries.
- **Under `cacheComponents`, an uncached read outside `<Suspense>` is an error.**
  The guestbook reads the session cookie and a live thread; both have to sit
  inside a boundary or the route fails to prerender
  (`blocking-prerender-dynamic`). The dashboard already had this shape for its
  two API panels.
- **Never store CSS classes in the database.** Tailwind generates a class only if it can
  *see* it in a scanned file, so a class that exists only in a row silently does nothing —
  which is how `pl-5`, `lg:text-2xl` and `text-blue-600` came to be no-ops on the live site.
  This is the whole reason the content blocks were replaced with rich text.
- **`drizzle-kit generate` output must be read line by line before running.** It does not
  model RLS, so it emits `DISABLE ROW LEVEL SECURITY` for all 42 tables, and it round-trips
  bigint maxvalues through a JS double and emits a corrupted `SET MAXVALUE`. Prefer writing
  the migration by hand, as `drizzle/0001_add_rich_text_columns.sql` is.
