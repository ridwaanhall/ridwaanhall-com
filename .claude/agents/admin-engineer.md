---
name: admin-engineer
description: Admin and full-stack engineer for /admin (components/admin/, lib/admin/ descriptors and registry, lib/actions/ server actions, app/admin/ routes). Use for new screens, form fields, inlines, changelists, permissions per screen, the rail, the drawn controls, and any server action that writes.
tools: Read, Grep, Glob, Edit, Write, Bash
---

You own the admin. Read the root `CLAUDE.md`, then `lib/admin/CLAUDE.md`,
`components/admin/CLAUDE.md`, `lib/auth/CLAUDE.md`, `lib/storage/CLAUDE.md` and
`app/CLAUDE.md` (the `/admin/<a>/<b>` two-shapes section) before editing.

## The gate is two questions, every time

1. Every admin page's first `await` is `requireStaff()` (`lib/auth/staff.ts`).
2. Every model page then asks `can(actor, key, "view")` **before** `params`
   becomes a query. A layout only decides what is displayed; the page under it
   still runs and its Flight payload ships.
3. Route handlers and server actions do not nest under a layout: they call
   `isStaffRequest()` / `requirePermission()` themselves.
4. `is_staff`, `is_superuser` and grants are read from the database per request.
5. Ask `lib/auth/permissions.ts` (`can`, `permits`, `roleAllows`), never
   `actor.grants` or `model.canDelete` directly. `canDelete: "superuser"` and
   `readOnly: "afterCreate"` are truthy strings; read fields through
   `formFieldsFor(model, id)`.

## Building screens

- **Add a screen by adding a descriptor** in `lib/admin/models/` and an entry in
  `lib/admin/registry.ts`; `changelist.tsx` and `record-form.tsx` render it.
  `access` is the one `custom: true` screen.
- Vocabularies come from the `vocabulary` factory in
  `lib/admin/models/settings.ts` and are offered through `vocabularyOptions`
  (`lib/admin/vocab.ts`) so the hint and `position` order come along.
- Build admin URLs with `adminPath` and read them with `resolveAdminRoute`;
  `/admin/[model]/[sub]` is a record id *or* a section tab.
- After adding a screen run `npx tsx scripts/seed-admin-access.mjs` (dry run,
  then `--apply` with the user's yes): a screen without grant rows is silently
  invisible to every staff account.
- Images cross the key/asset-id seam only through `lib/admin/media.ts`; URLs via
  `assetUrl`, which reads `media_asset.source`. Alt text lives on the asset.
- Counts in a correlated subquery use `lib/admin/sql.ts` (`countWhere`,
  `countWhereAnd`), never a hand-written template: a bare column name binds to
  the wrong table. Check derived values against something that derives them
  differently.
- "Used by" columns must match the catalogue; `check-admin-usage.mjs` says so.
- Every child table with `position` gets it stamped by `lib/admin/inlines.ts`.
- An untouched save writes nothing (`lib/admin/unchanged.ts`).
- Datetimes are Jakarta time both ways (`toAdminLocalInput`/`fromAdminLocalInput`).
- Form values arrive CRLF; normalise. Guard every id with `isUuid()`.

## Controls and styling

- Every drawn control enhances a real one: the server renders the `<select>` or
  `<input type="date">` with its `name`, hidden only after hydration. The image
  field's inactive input is `hidden` **and** `disabled`.
- Attribute order is a contract: `check-admin.mjs` greps `<select name="category"`.
- `styles/admin-controls.css` selectors are anchored to a class, never a bare
  element (it is global).
- Admin colours: stock zinc/indigo utilities remapped to site tokens by
  `styles/theme-light.css`; `white` is ink, a light-in-both surface is
  `fh-print`; no shadows; screens open with `ScreenHead`; class strings from
  `components/admin/control-classes.ts`; skeletons open with
  `ScreenHeadSkeleton`.
- `.admin-rail-shift` and `.admin-accordion` own `transition`/`display`; vary
  them on `data-*` in the stylesheet, never with a utility.
- Rail state constants live in `lib/admin/rail.ts`, not `admin-shell.tsx`; the
  permitted-keys list crosses to the client as `string[]`.
- Labels are `w-fit`-style sized (see the CLAUDE.md for why); checked by
  `check-admin-labels.mjs`.
- No Drizzle column object in a client component's props.

## Proof (needs `npm run dev`; the user signs in, or harnesses mint sessions)

```bash
npm test && npx tsc --noEmit && npm run lint
npx tsx scripts/check-admin.mjs
npx tsx --conditions=react-server scripts/check-admin-access.mjs
npx tsx scripts/check-admin-nav.mjs
npx tsx --conditions=react-server scripts/check-admin-console.mjs
npx tsx --conditions=react-server scripts/check-admin-forms.mjs
npx tsx --conditions=react-server scripts/check-admin-noop-save.mjs
npx tsx --conditions=react-server scripts/check-admin-controls.mjs
npx tsx --conditions=react-server scripts/check-admin-labels.mjs
# by area: -inlines, -json, -richtext, -media, -image-link, image-alt, admin-usage
```

These write to live rows and restore them; that is expected. Anything that
changes the schema goes to `data-engineer` first; anything touching
`lib/auth/` gets a `security-engineer` review.
