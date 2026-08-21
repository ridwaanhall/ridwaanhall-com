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
npx tsx scripts/check-auth-adapter.mjs # Auth.js adapter vs the live schema, rolled back
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
- [ ] **Register the new OAuth redirect URIs before cutover.** Auth.js sends
      `/api/auth/callback/google` and `/api/auth/callback/github`; allauth used
      `/accounts/google/login/callback/`. Add the new pair alongside the old in
      the Google Cloud console and the GitHub OAuth app (localhost and production
      origins both) — until then sign-in fails at the provider with
      `redirect_uri_mismatch`, which looks nothing like an app bug.
- [ ] Guestbook — threaded tree (3 levels), pin, delete branch, `show_reply_to`
- [ ] Comments — generic relation, single-level flattening, soft delete
- [ ] Contact form — react-hook-form + zod + Turnstile + Resend
- [ ] Email templates (5 pairs) via react-email
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
- [ ] Blog view counter

---

## Rich text (replaces the stored content blocks)

The blog body and project descriptions were authored as JSONB blocks carrying
hand-typed Tailwind classes. They are HTML now, styled by `styles/prose.css`.

- [x] `scripts/blocks-to-html.mjs` — conversion, dry-run by default
- [x] `blog_blogpost.content_html`, `projects_project.description_html`
      (additive; `content`/`description` stay until cutover, so Django's admin
      keeps working and the conversion stays reversible)
- [x] `styles/prose.css` — every value measured from the live rendering
- [x] `components/site/rich-text.tsx` + `lib/utils/sanitize.ts`
- [ ] **Tiptap editor in the admin** (phase 3): headings 2–4, bold, italic,
      code, link, bullet/ordered list, code block, table, image. Must emit the
      same vocabulary the sanitiser allows.
- [ ] At cutover: drop `content` and `description`, and remove the now-unused
      `@source inline(...)` entries for classes that only existed in blocks

## Phase 3 — admin
- [ ] Shell, auth gate on `is_staff`
- [ ] List views (TanStack Table) matching each `list_display` / `list_filter` / `search_fields`
- [ ] Forms, inlines with dnd-kit ordering, singleton editors
- [ ] The five JSON editors (string list, key/value, grouped, credits, content blocks)
- [ ] Image upload to Supabase Storage + reference-counted cleanup
- [ ] Users screen (`is_staff` / `is_author` / `is_co_author`)

---

## Phase 4 — cutover
- [ ] backup Django project to the new branch with name django
- [ ] Promote `web/` to repo root, delete the Django tree from nextjs-migration
- [ ] Replace `vercel.json`, swap CI to Node
- [ ] **Re-apply RLS as a SQL migration** — `enable_row_level_security` disappears with
      `apps/core/signals.py`, and without it every public table becomes readable
      to anyone holding the Supabase anon key
- [ ] Drop `core_contentversion`; **keep `django_content_type`** (live FK from comments)
- [ ] Rewrite `CLAUDE.md`, `README.md`, `CONTRIBUTING.md`
- [ ] Env vars: add `AUTH_SECRET`/`AUTH_URL`/`RESEND_API_KEY`, drop `SECRET_KEY`/`DEBUG`/`CONTENT_CACHE_*`

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
- **The search palette highlights its first navigable result on open**, so
  Ctrl+K, type, Enter goes somewhere. Django added the highlight only on an
  arrow key, which meant Enter did nothing until you pressed one. The highlight
  skips the "You are here" row for the same reason Enter does.
- **Leaving the palette's list returns the highlight to that first result.**
  Hovering a row moves the keyboard highlight -- which Django's palette never
  did -- and nothing used to move it back, so a hovered row wore two marks (the
  row's `hover:bg-zinc-800` and the `li`'s `.highlighted` wash) and taking the
  pointer off the list dropped only the first. The wash that outlived it read as
  a stuck hover. One `onMouseLeave` on the scroll container resets to index 0 --
  not -1, because that is the state the palette opens in and it keeps Enter
  pointing at a real row.
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
- **No shadows.** `grep -rn 'shadow' app components` should stay empty apart from `ring-*`.
- **Tooltips are `title` attributes**, never `group-hover` chips — a chip is unreachable on touch.
- **Never store CSS classes in the database.** Tailwind generates a class only if it can
  *see* it in a scanned file, so a class that exists only in a row silently does nothing —
  which is how `pl-5`, `lg:text-2xl` and `text-blue-600` came to be no-ops on the live site.
  This is the whole reason the content blocks were replaced with rich text.
- **`drizzle-kit generate` output must be read line by line before running.** It does not
  model RLS, so it emits `DISABLE ROW LEVEL SECURITY` for all 42 tables, and it round-trips
  bigint maxvalues through a JS double and emits a corrupted `SET MAXVALUE`. Prefer writing
  the migration by hand, as `drizzle/0001_add_rich_text_columns.sql` is.
