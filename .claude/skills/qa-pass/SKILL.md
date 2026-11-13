---
name: qa-pass
description: Full QA sweep of ridwaanhall.com - offline checks, the harnesses scripts/CLAUDE.md recommends, then a browser pass over every public route and admin screen in both themes at 375px and desktop - ending in a pass/fail report with evidence. Use before a release, after a large change, or when asked for a QA pass.
---

# QA pass

Owner: `qa-engineer`; findings go to the owning engineer. Read
`scripts/CLAUDE.md` and `app/CLAUDE.md` first.

## 0. Ground rules

- Reads only. The database is production; harnesses restore after themselves,
  you do not save forms or post messages by hand.
- Never enter credentials. Ask the user to sign in (staff account) in the
  browser you are driving, then continue.
- Prefer Claude in Chrome when connected; otherwise the built-in browser on the
  `next` dev server from `.claude/launch.json`.
- Evidence for every verdict: a console excerpt, a network status, a DOM fact
  or a screenshot.
- **This is the whole-site sweep**, for a release or a change to the shell every
  page shares. An ordinary change uses `verify-change`, which skips UI checks
  entirely when no UI path changed.
- **One load at a time.** Harnesses and a browser pass against the same
  `next dev` starve each other: goto timeouts and a cold-compile 500 that never
  reproduces. Run the harness batch, then browse.
- **A hidden browser measures nothing.** A minimized window or a hidden pane
  throttles the frames React uses to reveal streamed content, so `<main>` reads
  as empty and widths as 0. Measure layout with headless Playwright (as the
  harnesses do) and use the visible browser for looking.

## 1. Offline

```bash
npm test
npx next typegen && npx tsc --noEmit
npm run lint
node scripts/check-skeleton-scope.mjs
node scripts/check-fresh-start.mjs
npx tsx scripts/check-rls.mjs
npx tsx scripts/check-baseline-schema.mjs
npx tsx scripts/check-app-schema.mjs
npx tsx scripts/check-db-classes.mjs
npx tsx scripts/check-admin-usage.mjs
node scripts/check-auth-config.mjs
```

## 2. Harnesses against `npm run dev`

Start the dev server (preview tooling, config `next`) and note its port; most
harnesses default to `http://localhost:3000`. Public side first:

```bash
npx tsx --conditions=react-server scripts/check-site-console.mjs
node scripts/check-breakpoints.mjs
node scripts/check-ui-state.mjs
node scripts/check-notifications.mjs
node scripts/check-markdown.mjs
node scripts/check-drafts.mjs
npx tsx scripts/check-account-panel.mjs
npx tsx --conditions=react-server scripts/check-page-loading.mjs
npx tsx --conditions=react-server scripts/check-skeleton-shape.mjs
node scripts/check-headers.mjs
```

Admin (mint their own sessions; they write and restore):

```bash
npx tsx scripts/check-admin.mjs
npx tsx --conditions=react-server scripts/check-admin-access.mjs
npx tsx scripts/check-admin-nav.mjs
npx tsx --conditions=react-server scripts/check-admin-console.mjs
npx tsx --conditions=react-server scripts/check-admin-forms.mjs
npx tsx --conditions=react-server scripts/check-admin-noop-save.mjs
npx tsx --conditions=react-server scripts/check-admin-controls.mjs
npx tsx --conditions=react-server scripts/check-admin-labels.mjs
```

The rest of `scripts/CLAUDE.md` before a release.

## 3. Browser pass

### Public routes (`app/(site)/`)

`/`, `/about`, `/projects`, one `/projects/<slug>` with images and one
without, `/blog`, one `/blog/<slug>` with code and images, `/dashboard`,
`/guestbook`, `/contact`, `/openhire`, `/patch-notes`, `/legal/<slug>`,
`/privacy-policy`, `/terms`, `/sign-in`, an unknown path (404 body), an
unknown `/blog/<slug>`, and `/index.md` + one detail `.md` twin.

Per page:
- Every section renders with content (not a stuck skeleton or `data-fh-hold`).
- Console: no errors, no hydration warnings. Network: no 4xx/5xx for assets.
- Links: collect `a[href^="/"]` and HEAD/GET each once (dedupe across pages).
- Images: every visible `img` has `naturalWidth > 0` and a non-empty `alt`
  unless decorative.
- One visible `<main>`; one visible theme toggle.
- Light and dark (toggle; the choice persists on reload).
- 375px: no horizontal scroll (`document.documentElement.scrollWidth <=
  innerWidth`), nav usable, controls at least 40px under touch.
- Keyboard: Tab reaches the skip/nav/actions in order with a visible focus ring;
  Escape closes overlays.

Shared chrome, once: command palette (open by shortcut and button, search a
post title, Enter navigates, Escape closes), account menu (signed out and
signed in; closes after navigating), Work and Writing filters (open panel,
apply, chip appears, URL updates, reload keeps it, Clear all), CV viewer.

### Admin (`app/admin/`, signed in as staff)

`/admin`, every key in `lib/admin/registry.ts` (list, and one record form),
the Settings section tabs, `/admin/access`, one `/admin/access/<id>`,
`/admin/backup`. Per screen: renders, console clean, rail highlights the right
group, collapsed rail works, both themes, 375px drawer. Do **not** press Save,
Delete or Restore.

## 4. Report

Write `qa-report.md` (outside the repo, or in the shared notes folder) with:

| Area | Page/section | Light | Dark | 375px | Desktop | Console | Links/images | Result | Evidence |

then a list of findings: severity, page, reproduction, cause (file:line),
owner, and whether it was fixed (commit) or deferred. End with what was not
covered and why.
