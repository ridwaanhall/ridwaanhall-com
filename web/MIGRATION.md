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
- [ ] OpenHire — 19 templates, gated on `is_open_to_work || is_hiring`.
      **Cannot be compared against live**: both flags are false in production, so
      `/openhire/` currently 404s there. The data is fully authored (status
      "Actively Looking", 4 preferred roles, 9 skills, RoneAI, 2 positions), so the
      page matters the moment a flag is flipped — it just has no live rendering to
      diff against. Needs an eyeball check when next enabled.
- [x] Legal / privacy / terms — sections with one level of nesting (layout verified against live)
- [ ] Dashboard — GitHub contributions heatmap + WakaTime stats
- [ ] Contact — form shell (submission is phase 2)

### Client behaviour to port
- [ ] Image lightbox (`imageLightbox.js`, 425 lines + its CSS)
- [x] Blog / project / featured sliders — scroll-snap rows, not Embla: they have no
      transform track or slide indices, and native scrolling keeps swipe, momentum
      and keyboard for free
- [ ] Tooltips (`tooltip.js`) — `title` upgraded, must work on touch
- [ ] Click spark (`clickSpark.js`, canvas, `mousedown` not `pointerdown`)
- [ ] GitHub contributions heatmap (`githubContributions.js`, 295 lines → SVG)
- [x] Tab switching (`switchTab.js`) and the four career toggles (`toggleCareer.js`
      carried `toggleResponsibilities`, `toggleAchievements`, `toggleAchievementsCerts`
      and `toggleJourney` — one `<Disclosure>` replaces all four)
- [x] Back-to-top / floating actions (`backScroll.js`)
- [x] Copy-to-clipboard (in the blog share row)
- [ ] Count-up (`countUp.js`) and search-enable (`searchEnable.js`) — both are dashboard
      and listing niceties; still to port

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
