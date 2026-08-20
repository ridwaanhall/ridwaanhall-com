# Django → Next.js migration checklist

Working list for the port. Tracked in the repo so it survives between sessions.
Tick items as they land; strike an item out with a reason when it turns out not
to be needed rather than deleting it, so the decision stays visible.

Verification harnesses (run all three before calling a phase done):

```bash
node scripts/compare-with-django.mjs   # data layer vs Django, field by field
node scripts/compare-meta.mjs          # <head> vs the live site, page by page
node scripts/check-breakpoints.mjs     # one visible theme toggle at every width
node scripts/compare-jsonld.mjs        # structured data vs the live site
node scripts/compare-prose.mjs [slug] [width]   # rich-text typography vs live
MSYS_NO_PATHCONV=1 node scripts/compare-layout.mjs [path]   # rendered geometry vs live
```

`compare-layout.mjs` takes an optional path and a `WIDTH` env var. On Git Bash,
`MSYS_NO_PATHCONV=1` is required or a leading-slash argument is rewritten into a
Windows path before node sees it.

`compare-with-django.mjs` needs a fresh dump first:
`cd .. && DEBUG=False uv run python web/scripts/django_dump.py`

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
- [ ] Auth.js v5 adapter over `auth_user` / `socialaccount_socialaccount` / `guestbook_userprofile`
- [ ] Guestbook — threaded tree (3 levels), pin, delete branch, `show_reply_to`
- [ ] Comments — generic relation, single-level flattening, soft delete
- [ ] Contact form — react-hook-form + zod + Turnstile + Resend
- [ ] Email templates (5 pairs) via react-email
- [ ] Toast stack (sonner) + confirm dialog — **must mount outside `#page-content`**
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
- [ ] Promote `web/` to repo root, delete the Django tree
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
