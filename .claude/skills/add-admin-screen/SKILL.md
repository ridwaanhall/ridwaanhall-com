---
name: add-admin-screen
description: Add or extend an admin screen (a model, a vocabulary, a field, an inline) through the descriptor system - registry entry, list and form descriptors, permissions, grants, skeleton - and prove it. Use whenever /admin needs a new screen or a new field on one.
---

# Add an admin screen

Rules: `lib/admin/CLAUDE.md`, `components/admin/CLAUDE.md`,
`lib/auth/CLAUDE.md`, `app/CLAUDE.md`. Owner: `admin-engineer`.

## Steps

1. **Schema first.** If the table or column does not exist, run the
   `schema-delta` skill and restart the dev server.
2. **Descriptor.** In `lib/admin/models/<area>.ts` declare the changelist
   (columns, filters, search fields, ordering on a real order column) and the
   form (fieldsets, field kinds, inlines). A vocabulary uses the `vocabulary`
   factory in `lib/admin/models/settings.ts`. Offer vocabularies through
   `vocabularyOptions`.
   - Fields about a person: `readOnly: "afterCreate"`, read via `formFieldsFor`.
   - Deletes with consequence: `canDelete: "superuser"`, read via `permits()`.
   - Singletons: no create, no delete.
   - Lookup tables get a "Used by" column covering every FK the catalogue
     reports (counts via `lib/admin/sql.ts`).
   - Image fields go through `lib/admin/media.ts`; new image columns join
     `lib/storage/cleanup.ts`.
   - No Drizzle column objects in anything passed to a client component.
3. **Registry.** Add the entry to `lib/admin/registry.ts` in the right group.
   Not `custom` unless a route file renders it (then it needs `(index)` route
   files and no form descriptor).
4. **Grants.** `npx tsx scripts/seed-admin-access.mjs` (dry run, read it), then
   `--apply`. Without grant rows the screen is invisible to every staff account
   and nothing reports it. Presets in `lib/auth/presets.ts` work per group, so a
   screen in an existing group inherits automatically.
5. **Routes.** None needed for a descriptor screen; `/admin/[model]` renders it.
   Build any link with `adminPath`.
6. **Skeleton.** If the list or form shape differs from the generic ones,
   update the skeleton in the same change (`ScreenHeadSkeleton`,
   `components/skeleton.tsx`).
7. **Public side.** If the data shows on the site, add or extend the cached
   read in `lib/data/` with its tag, and make sure the admin save invalidates it.
8. **Prove it** (dev server running):
   ```bash
   npm test && npx tsc --noEmit && npm run lint   # descriptors.test.ts holds registry/descriptor agreement
   npx tsx scripts/check-admin.mjs
   npx tsx --conditions=react-server scripts/check-admin-forms.mjs
   npx tsx --conditions=react-server scripts/check-admin-noop-save.mjs
   npx tsx --conditions=react-server scripts/check-admin-access.mjs
   npx tsx --conditions=react-server scripts/check-admin-labels.mjs
   npx tsx scripts/check-admin-usage.mjs
   npx tsx scripts/check-admin-nav.mjs
   ```
9. **Look at it** signed in as staff (the user signs in): list, create, edit,
   untouched save says "No changes to save.", delete refusal names blockers.
