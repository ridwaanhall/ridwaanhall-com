---
name: live-db-write
description: The snapshot-write-restore discipline for touching rows in this repo's database, which is production even in development. Use before any data edit, backfill, cleanup, one-off script, or harness that writes, and before writing a new harness.
---

# Writing to the live database

`STORAGE_POSTGRES_URL` is the production Supabase project, in development too.
There are no fixtures. Root `CLAUDE.md` ("Everything reads the live database")
and `drizzle/CLAUDE.md` are the rules; this is the procedure.

## Decide whether you may

- Schema deltas and data edits: go ahead, report afterwards.
- Rewriting stored copy (posts, about text, anything a reader reads) and
  destructive changes (deletes, truncations, dropping columns): ask first, with
  the row count and what is lost.
- Never as a side effect of a QA pass: QA reads, harnesses restore.

## Procedure for a one-off edit

1. **Read the exact rows first**, by key, with a `select` that returns every
   column you will touch. Count them. If the count surprises you, stop.
2. **Snapshot** to a gitignored file: `<what>-before.dump.json` (the
   `*.dump.json` rule covers it). For a whole-database safety net,
   `node scripts/backup.mjs export` writes `*.backup.json`.
3. **Write in one transaction**, keyed by id, never by label. Use
   `node-postgres` with TLS configured in code (see `lib/db/client.ts`), or
   `scripts/apply-migration.mjs` for SQL files (dry run first; `--apply` to
   commit; the file has no `begin`/`commit` of its own).
4. **Read back** and compare against the intended result.
5. **Invalidate caches**: the public read is cached by tag
   (`lib/data/tags.ts`). An admin save does this itself; a script does not, so
   either save through the admin, or tell the user the page will update when
   the tag expires / on the next deploy.
6. **Report**: rows touched, the snapshot file path, how to restore.

## Procedure for a harness

```js
const before = await snapshot(client, ids);   // every column you will touch
try {
  // ...drive the app; created rows use a `zz-` prefix
} finally {
  await restore(client, before);
  const after = await snapshot(client, ids);
  assert.deepEqual(after, before, "restore did not restore");
  await client.query("delete from app.<table> where slug like 'zz-%'");
}
```

- Prove the restore, do not assume it.
- In a rolled-back transaction, issue `set constraints all immediate` first so
  a deferred FK violation is raised rather than hidden.
- Wait for the "Saved." notice before reading a row back, not `networkidle`.
- Resolve accounts and rows through `scripts/fixture-ids.mjs`; mint sessions
  with `scripts/mint-session.mjs`; never write keys down.

## Never

- Store CSS classes in a row (`check-db-classes.mjs`).
- Key a write on a label.
- Commit a dump.
- Hard-delete a storage object because one row stopped naming it: files are
  reference-counted (`lib/storage/cleanup.ts`); `audit-storage.mjs` reports only.
