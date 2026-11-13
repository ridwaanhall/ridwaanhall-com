---
name: verify-change
description: Choose and run the checks that prove a change in this repo, by the paths it touches. Use before calling any change done, before committing, or when asked "which harness covers this?". Maps every area to its scripts/ harness and says which need npm run dev and which need --conditions=react-server.
---

# Verify a change

Source of truth: `scripts/CLAUDE.md` (the harness list) and the root
`CLAUDE.md` ("Verification"). Read them if this file and they disagree; they
win, and this file should be fixed.

## 1. Baseline, always

```bash
npm test                                   # offline node:test over lib/**/*.test.ts
npx next typegen && npx tsc --noEmit       # typegen first on a fresh checkout
npm run lint
```

## 2. Find what changed

```bash
git diff --name-only main...HEAD; git status --short
```

## 3. Decide whether UI checks apply at all

UI checks prove what a reader *sees*; they cost a dev server, a browser and
minutes each, and prove nothing about a change that draws nothing. Run them
only when the diff touches a **UI path**:

- `components/**` (any `.tsx`), `app/**/{page,layout,loading,error,not-found,template}.tsx`
- `styles/**`, `app/globals.css`, `app/fonts.ts`, `public/**`
- `lib/site/**`, `lib/motion/**` (client display and motion helpers)
- a server read whose *shape* a page renders differently (a new field drawn, a
  list that gets longer or shorter) -- say so when you claim this one

**UI checks**: `check-breakpoints`, `check-ui-state`, `check-notifications`,
`check-site-console`, `check-page-loading`, `check-skeleton-shape`,
`check-admin-nav`, `check-admin-console`, `check-admin-controls`,
`check-admin-labels`, `check-account-panel`, the CSS build checks, and any
browser look (themes, widths, screenshots).

No UI path in the diff (docs, `.claude/`, `scripts/`, `drizzle/`, `lib/` logic,
route handlers, server actions, config): **skip every UI check** and say so in
one line ("no UI paths changed; UI checks skipped"). Behaviour harnesses for
the paths touched still run from the table below.

A UI path in the diff: run the UI checks for *that surface only* -- the public
site's for `components/foothill/` and `app/(site)/`, the admin's for
`components/admin/` and `app/admin/`, skeleton checks only for a skeleton or the
page it mirrors -- and look at it in both themes at 375px and desktop.

## 4. Add the harnesses for each path

`[dev]` = needs `npm run dev` running. `[rs]` = run as
`npx tsx --conditions=react-server scripts/<name>` (imports `server-only`).
Others: `node` for `.mjs` that import nothing aliased, `npx tsx` otherwise, as
written in `scripts/CLAUDE.md`.

| Path touched | Run |
|---|---|
| `styles/`, `app/globals.css`, any class names | `npm run build && node scripts/check-css-sources.mjs && node scripts/check-class-collisions.mjs`; `check-breakpoints` [dev] |
| `components/foothill/`, `app/(site)/` | `check-site-console` [dev][rs], `check-ui-state` [dev], `check-notifications` [dev], `check-breakpoints` [dev] |
| any `loading.tsx` or Suspense fallback, or the page it mirrors | `check-skeleton-scope` (offline), `check-page-loading` [dev][rs], `check-skeleton-shape` [dev][rs] |
| account menu, sign-in/out | `check-account-panel` [dev], `check-auth-config` |
| guestbook, comments, posting rules | `check-comments`, `check-public-access`, `check-turnstile` [dev][rs] |
| `lib/email/` | `check-emails` |
| `lib/markdown/`, `app/md/`, `proxy.ts` twins, sitemap | `check-markdown` [dev] |
| `lib/data/` drafts, publishing | `check-drafts` [dev] |
| `lib/admin/registry.ts`, `lib/admin/models/` | `check-admin` [dev], `check-admin-forms` [dev][rs], `check-admin-noop-save` [dev][rs], `check-admin-usage` |
| `lib/auth/`, admin gate, grants, Access screen | `check-admin-access` [dev][rs], `check-admin` [dev], `check-public-access` |
| `components/admin/` shell or rail | `check-admin-nav` [dev], `check-admin-console` [dev][rs] |
| drawn controls, `styles/admin-controls.css` | `check-admin-controls` [dev][rs], `check-admin-labels` [dev][rs] |
| inlines, cascades, `lib/actions/admin.ts` deletes | `check-admin-inlines` [dev][rs] |
| JSON fields | `check-admin-json` [dev][rs] |
| rich text, `sanitize.ts` | `check-admin-richtext` [dev][rs], `check-db-classes` |
| images, `lib/storage/`, `lib/admin/media.ts` | `check-storage` [rs], `check-admin-media` [dev][rs], `check-admin-image-link` [dev][rs], `check-image-alt` [dev][rs] |
| image-service setting, `SiteImage` | `check-image-service` [dev][rs] |
| `drizzle/`, `lib/db/`, any DDL | `check-baseline-schema`, `check-app-schema`, `check-rls`, `check-auth-adapter` (and restart dev) |
| `project_status` colours, stored HTML | `check-db-classes` |
| `next.config.ts` headers/CSP | `check-headers`, `check-live-config https://<deployment>` |
| comments and docs anywhere | `check-fresh-start` |

## 5. Before a release

Every harness in `scripts/CLAUDE.md`, in its order -- UI checks included,
because a release is the one time the whole surface is claimed to work.

## 6. Read results honestly

- A harness that writes restores in `finally` and proves it; if it reports a
  failed restore, stop and tell the user with what it printed.
- Browser harnesses need a dev server on the port they expect; check the
  harness header for its base URL before blaming the change.
- A one-screen error whose query works under `npx tsx` after DDL is a stale dev
  server: restart it.
- Report each command with pass/fail and the line that proves it. Name anything
  you did not run and why.
