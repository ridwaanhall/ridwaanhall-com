# ridwaanhall.com

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3FCF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)

![ridwaanhall.com](public/image.png)

> **The portfolio behind [ridwaanhall.com](https://ridwaanhall.com) — database-backed content with its own admin, live GitHub and WakaTime dashboards, an OAuth guestbook with threaded replies, and light and dark themes. Fork it and make it your own; see [Making It Your Own](#making-it-your-own) below.**

## Key Features

- **Database-backed content**: Blog posts, projects, bio, experience, skills, awards, legal documents and more live as real tables — manage all of it from the `/admin` panel, with no deploy needed to change content
- **Supabase-powered**: Postgres and Storage (blog and project images, logos, the profile photo) both on Supabase, reached through Drizzle ORM and a small storage client rather than an SDK
- **Light and dark themes**: Dark by default, with a toggle in the navbar. The public site is eight greys defined once per theme, and the admin's Tailwind palette is remapped from those same greys rather than by adding `dark:` variants, so both themes stay in sync automatically — see [Theming](#theming)
- **Content caching**: Every read path is behind `use cache` with a tag per content area, so an edit invalidates only what it touched. Tag revalidation is cross-instance by construction, which matters on serverless where an edit handled by one instance must not leave the others stale
- **Real-time dashboard**: Live GitHub contribution graph, WakaTime coding-activity stats, and a seven-day AI breakdown — tokens, estimated spend and cost by model — cut on Jakarta time and refreshed every 15 minutes
- **Interactive guestbook**: Google/GitHub OAuth login, threaded replies, pinning by staff (up to 3 at a time), deletion by a superuser, automatic link detection, email notifications routed on role — or disable it entirely with one env var
- **Blog and projects**: Searchable listings with multi-image support, tags, categories, threaded comments, and a project lifecycle status system whose every status carries a one-sentence description
- **Filters behind a button**: Work and Writing open with one line — search, a Filters button with a count, sort and view — and the filter groups open below it, with what is applied shown as removable chips
- **SEO built in**: Per-page meta tags, Open Graph, Twitter Cards, JSON-LD schema, and auto-generated sitemaps/robots.txt
- **A Markdown twin of every page**: add `.md` to an address, or ask with `Accept: text/markdown`; `/llms.txt` lists them all
- **A CV generated from your About page**: `/cv.pdf`, rendered on the server in a layout applicant tracking systems can read, with an in-page viewer
- **Security-first**: row-level security on every Supabase table, an admin gated per screen — three roles and a view/add/change/delete grant on each screen, all read from the database on every request and never carried in the session token — and Cloudflare Turnstile on the contact form
- **Image optimization**: every picture on the public site goes through one wrapper, and *how* it is resized is a setting in the admin — Next.js's optimizer, [wsrv.nl](https://wsrv.nl) or none — so the host's image-transformation quota can be left alone
- **Built for touch as well as pointer**: mobile-first Tailwind CSS v4, with as little client JavaScript as the feature allows. Tooltips work on tap as well as hover, and every animation respects `prefers-reduced-motion`

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Cache Components), React 19, TypeScript
- **Styling**: Tailwind CSS v4, and a hand-written class vocabulary for the public site (`styles/site.css`)
- **Motion**: Motion (Framer Motion) for what responds to a press, GSAP for what follows the scroll
- **Database**: Supabase Postgres via Drizzle ORM over `node-postgres`
- **Media**: Supabase Storage, through a small REST client (`lib/storage/`)
- **Auth**: Auth.js v5 with Google and GitHub, over the existing account tables
- **Email**: Resend
- **APIs**: GitHub GraphQL, WakaTime
- **Spam**: Cloudflare Turnstile
- **Deployment**: Vercel


## Project Structure

```text
app/
  (site)/            The public pages: home, about, blog, projects, dashboard,
                     contact, guestbook, openhire, legal, sign-in
  admin/             The admin: two dynamic routes and the Access screen render
                     every screen the registry names
  api/               The few JSON endpoints the client actually calls
  md/, llms*.txt     The Markdown twin of every page, and the index of them
  cv.pdf/, cv/       The generated CV and its viewer
components/
  foothill/          The public site: pages, cards, filters, charts, motion
  admin/             The generic changelist, form, field and inline renderers
  site/, layout/     The few pieces both halves use: toasts, rich text, comments,
                     the account panel, the loading bar, the theme toggle
  auth/, seo/        Sign-in buttons, structured data
  providers/         Confirm dialog, notifications, tooltips, theme
lib/
  data/              Read paths, each behind `use cache` with a tag
  actions/           Server actions: contact, comments, guestbook, admin
  admin/             The descriptors that drive every admin screen
  auth/              Roles, grants and the Auth.js adapter over the account tables
  db/                The generated Drizzle mapping and the connection pool
  email/             Templates and the Resend client
  markdown/, cv/     The Markdown twins and the generated CV
  seo/, og/          Metadata, JSON-LD, sitemaps, share images
  site/, motion/     Pure helpers the public site shares
  storage/           Supabase Storage: upload, delete, reference-counted cleanup
drizzle/             0000_init.sql — the whole schema, in one file
scripts/             Verification harnesses — see scripts/CLAUDE.md
styles/              The hand-written stylesheets app/globals.css imports
public/              Favicons, fonts, static images
```

## Content Architecture: Database-backed

Every piece of content is a row, not a file: bio, experience, education,
certifications, awards, skills, applications, projects, blog posts, legal
documents, and the hiring / open-to-work status. Changing any of it is an edit
in `/admin`, never a deploy.

The schema is `drizzle/0000_init.sql` — every table, in its own `app` schema,
keyed by uuid, with real foreign keys and real referential actions. Run it once
against an empty database and you have the whole thing. `lib/db/app-schema.ts`
is the Drizzle mapping, generated from the live schema by
`scripts/gen-app-schema.mjs` rather than typed by hand.

Read paths live in `lib/data/`, each behind `use cache` with a tag from
`lib/data/tags.ts`, so a save invalidates only the area it touched.

The admin itself is declarative. `lib/admin/registry.ts` names every screen and
`lib/admin/models/` declares what each one shows and edits; two generic
components render all of them. Adding a screen is adding a descriptor.

## Theming

The site ships dark by default, with a light theme behind a toggle in the navbar (and in the admin's top bar). The choice is stored in `localStorage`; the OS `prefers-color-scheme` is deliberately not consulted, because dark is the default rather than a fallback.

There are two layers, and neither uses `dark:` variants:

- **The public site is eight greys.** `--fh-bg`, `surface`, `raise`, `line`, `line-2`, `mute`, `ink-2` and `ink` are defined once for light on `:root` and redefined under `:root[data-theme="dark"]`, in `styles/site.css`. Every public rule is written in that sheet's class vocabulary and refers to those tokens, so a theme is one table. Colour belongs to the work itself (screenshots, covers, logos); the interface never adds any.
- **The admin wears the same greys.** It is written in stock Tailwind classes (`zinc` for surfaces, lines and text), and `styles/theme-light.css` defines zinc, black, white and indigo *from the site's tokens*, so the admin follows the site in both themes. Only the status hues (green, red, amber and the rest) keep a light table of their own, tuned by measurement because a plain mirror of a ramp preserves distance from its end rather than perceived contrast.

Two consequences worth knowing before you edit anything:

- **Stay inside the vocabulary.** On the public site that is the tokens and classes in `styles/site.css`; in the admin it is the zinc ramp, indigo and the status hues. An arbitrary value like `bg-[#18181b]`, or a colour family that isn't defined, will render its dark value on a white page with no error.
- **Unlayered sheets beat utilities.** The stylesheets under `styles/` are imported outside every layer, so a plain class there wins over any Tailwind utility on the same property, whatever the selector. `CLAUDE.md` has the details.

Switching themes crossfades the whole page as one View Transition (or, without that API, puts every element on one shared 320ms colour transition), so nothing changes in a visible cascade even though elements declare different durations. Under `prefers-reduced-motion` the swap is instant.

One related front-end detail: **tooltips work on touch.** A native `title` only appears on hover, so on a phone every one of them was unreachable. `components/providers/tooltips.tsx` upgrades them to show on hover, on keyboard focus, and on tap. Tapping never blocks the trigger, so a tooltip on a link or a button still follows through on the same tap.

## PageSpeed Insights

Scores for the reference deployment at [ridwaanhall.com](https://ridwaanhall.com):

[![Desktop: 99.5](https://img.shields.io/badge/Desktop-99.5-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/rstqtcxhc0?form_factor=desktop)
[![Mobile: 99](https://img.shields.io/badge/Mobile-99-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/rstqtcxhc0?form_factor=mobile)

| Platform | Performance | Accessibility | Best Practices | SEO | Average |
|----------|-------------|---------------|----------------|-----|---------|
| **Desktop** | 98 | 100 | 100 | 100 | **99.5** |
| **Mobile** | 96 | 100 | 100 | 100 | **99** |
| **Average** | **97** | **100** | **100** | **100** | **99.25** |

## Quick Start

**1. Get the code and its dependencies.**

```bash
git clone https://github.com/ridwaanhall/ridwaanhall-com.git
cd ridwaanhall-com
npm install
```

**2. Create a Supabase project**, then copy two connection strings and two keys
out of it — the pooled and direct Postgres URLs, the project URL, and the
service-role key. Create a public storage bucket named `media` while you are
there.

**3. Fill in the environment.** `cp .env.example .env.local` and set at least
`STORAGE_POSTGRES_URL` and `STORAGE_POSTGRES_URL_NON_POOLING`. The app throws at
import without the first; everything else degrades rather than crashing, so you
can add the rest as you need it. See [Environment Configuration](#environment-configuration).

**4. Create the schema.** One file, run once, over the *direct* connection —
DDL is not reliable through the pooler:

```bash
node scripts/apply-migration.mjs drizzle/0000_init.sql           # dry run first
node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
```

That creates every table and enables row-level security on each of them.
`npx tsx scripts/check-baseline-schema.mjs` proves the file and the database
agree, and `node scripts/db-probe.mjs` shows you what is there.

**5. Run it.**

```bash
npm run dev            # http://localhost:3000
```

The site comes up empty, because nothing is seeded. To fill it: set up OAuth
(below), sign in once so your account row exists, then make that account staff
**and** superuser —

```sql
update app.account
   set is_staff = true, is_superuser = true
 where email = 'you@example.com';
```

— and `/admin` opens. Both flags matter: `is_staff` is what gets you through the
door, and `is_superuser` is what puts every screen behind it within reach. A
staff account that is not superuser sees only the screens granted to it in
`app.admin_access`, which for a fresh account is none — an admin with nothing in
it, and the index page says so.

Once you are in, `/admin/access` is where you hand out the rest: a checkbox per
screen per action for everybody else who signs in.

> **There is no local database.** `STORAGE_POSTGRES_URL` points at Supabase in
> development as well as in production, so a page rendered locally shows live
> content and a write from `/admin` is a live write. Point it at your own
> project before you change anything.

## Checks

Two layers, and the split is deliberate.

**Unit tests** cover the pure logic and run anywhere — no database, no browser,
no network. Node's built-in runner over `tsx`; there is no test framework
installed.

```bash
npm test
npm run test:watch
```

**Harnesses** cover everything that only means something against the real thing:
the admin gate, the schema, row-level security, uploads and their reference
counting, the emails, the loading states. Each drives the live application and
cleans up after itself in a `finally` that then proves the cleanup.

```bash
npx tsc --noEmit                                  # types
npm run lint                                      # eslint
npm run build && node scripts/check-css-sources.mjs
node scripts/check-headers.mjs                    # the security headers
npx tsx scripts/check-baseline-schema.mjs         # the schema file builds the schema
npx tsx scripts/check-app-schema.mjs              # the mapping matches it
npx tsx scripts/check-rls.mjs                     # row-level security is on
npx tsx scripts/check-admin.mjs                   # the admin gate and changelists
```

`scripts/CLAUDE.md` lists all of them and says which need `--conditions=react-server`.

CI runs types, lint, the unit tests and the build. The harnesses deliberately do
not run there: they drive a browser against a running app and write to the live
database, which is right for a developer checking a change and wrong for a pull
request from a fork.

Deploying? `docs/cutover.md` has the order to do it in.

## Environment Configuration

Copy `.env.example` to `.env.local` and fill it in. Nothing has a default: the
app will not start without the database URL, and the rest fail quietly rather
than loudly — no key means no email, no spam check, no dashboard panel.

| Variable | Required | What it does |
|---|---|---|
| `STORAGE_POSTGRES_URL` | **Yes** | Supabase Postgres, pooled. The app throws at import without it |
| `STORAGE_POSTGRES_URL_NON_POOLING` | For DDL | Direct connection. Migrations and introspection do not work through the pooler |
| `STORAGE_SUPABASE_URL` | For media | Project URL; also the `next/image` allow-list at build time |
| `STORAGE_SUPABASE_SERVICE_ROLE_KEY` | For media | Server-side only. Never expose it |
| `SUPABASE_STORAGE_BUCKET` | For media | Defaults to `media` |
| `AUTH_SECRET` | For sign-in | Auth.js session signing key |
| `AUTH_URL`, `AUTH_TRUST_HOST` | For sign-in | Where callbacks come back to |
| `AUTH_GOOGLE_ID` / `_SECRET` | For sign-in | Google OAuth |
| `AUTH_GITHUB_ID` / `_SECRET` | For sign-in | GitHub OAuth |
| `RESEND_API_KEY` | For email | Resend API key |
| `DEFAULT_FROM_EMAIL` | For email | **Must be on a domain verified at resend.com/domains**, or every send fails with a 403 naming the domain |
| `CONTACT_EMAIL_RECIPIENT` | For email | Where the contact form lands |
| `GITHUB_ACCESS_TOKEN` | For dashboard | Personal access token for the contribution graph |
| `WAKATIME_API_KEY` | For dashboard | Coding stats. Absent, the panel is hidden |
| `NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY` | For the contact form | Turnstile site key |
| `CF_TURNSTILE_SECRET_KEY` | For the contact form | Turnstile secret. Absent, verification passes by design |
| `NEXT_PUBLIC_BASE_URL` | Recommended | Canonical URLs, Open Graph, sitemaps |
| `NEXT_PUBLIC_GUESTBOOK_ENABLED` | No | `false` hides the guestbook entirely |

The `STORAGE_`-prefixed names look redundant and are kept verbatim on purpose:
they are what Vercel's Supabase integration provisions, so `vercel env pull`
keeps working without a manual re-sync when keys change.

**OAuth redirect URIs.** Auth.js uses `/api/auth/callback/<provider>`, so both
providers need `https://your-domain.com/api/auth/callback/google` and
`.../github` (plus the `localhost:3000` equivalents for development).

## Making It Your Own

This started as a personal site, but the architecture does not assume you are
Ridwan Halim. To adopt it as your own portfolio:

1. **Your database** — point `STORAGE_POSTGRES_URL` at your own Supabase project
   before anything else. There is no local database, so until you do, `/admin`
   writes to somebody else's site. Run `drizzle/0000_init.sql` against it; that
   creates every table and enables row-level security on all of them.
2. **Your content** — nothing is seeded. Sign in once so your account row
   exists, set `is_staff` and `is_superuser` on it in `app.account` (superuser
   is what reaches every screen; staff alone reaches only what
   `app.admin_access` grants), then add your bio, experience, education,
   certifications, awards, skills, posts, projects, legal documents and
   open-to-work status through `/admin`.
3. **Your branding** — `lib/seo/config.ts` hardcodes the site name, author and
   handles.
4. **Your domain** — set `NEXT_PUBLIC_BASE_URL`, and register the OAuth redirect
   URIs (`/api/auth/callback/google` and `/api/auth/callback/github`) for it.
5. **Your assets** — replace `public/favicon/` and the manifest in
   `app/manifest.ts`. Photos and logos are uploaded through `/admin` to Supabase
   Storage, not committed.
6. **Your emails** — `lib/email/` holds the five templates and one shared shell.
   They are plain string substitution, styled to match the site.
7. **Your colours** — the public palette is the eight `--fh-*` greys at the top
   of `styles/site.css`, once for light and once for dark, and the admin follows
   them through `styles/theme-light.css`. Changing a grey re-skins every page at
   once. If you add a colour, re-measure contrast: the status-hue tables were
   tuned by measurement, not by eye (see [Theming](#theming)).
8. **Optional features** — `NEXT_PUBLIC_GUESTBOOK_ENABLED=false` hides the
   guestbook entirely; leaving the Turnstile keys empty skips spam verification.

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=Database-backed%20developer%20portfolio%20with%20its%20own%20admin%2C%20live%20dashboards%20and%20an%20OAuth%20guestbook.&demo-image=https%3A%2F%2Fridwaanhall.com%2Fstatic%2Fimg%2Fproject%2Fridwaanhall_com_2025070701.webp&demo-title=ridwaanhall.com&demo-url=https%3A%2F%2Fridwaanhall.com&from=templates&project-name=ridwaanhall-com&repository-name=ridwaanhall-com&repository-url=https%3A%2F%2Fgithub.com%2Fridwaanhall%2Fridwaanhall-com)

### Manual Setup

1. Fork this repository
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel --prod`
4. Configure environment variables in the Vercel dashboard
5. Set `NEXT_PUBLIC_BASE_URL` to your own domain, and register the OAuth
   redirect URIs for it — see [Making It Your Own](#making-it-your-own)

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes in the repo's [commit format](CONTRIBUTING.md#commit-message-guidelines)
4. Push branch: `git push origin feature/name`
5. Open pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards and commit message conventions.

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

**ridwaanhall.com** — a portfolio, built to be forked.
