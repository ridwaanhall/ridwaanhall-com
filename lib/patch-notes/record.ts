import "server-only";

import { eq, sql } from "drizzle-orm";

import { db } from "@/lib/db/client";
import { patchNote, patchNoteEntry } from "@/lib/db/app-schema";

import {
  defaultTitle,
  formatVersion,
  latestVersion,
  nextVersion,
  parseCommit,
  releaseMarkdown,
  type Entry,
  type Version,
} from "./commits";

/**
 * The version the first automatic release takes when the table is empty.
 * v3.0.0 was the last release cut by hand; the redesign that followed is 4.0.0.
 */
const FIRST: Version = [4, 0, 0];

/**
 * The key every release contends on, so two pushes landing together cannot
 * both read 4.1.0 as the latest and both write 4.2.0. Advisory locks share
 * one namespace across the database; the guestbook's pin lock is 8_471_002.
 */
const PATCH_NOTE_LOCK = 8_471_003;

export type Recorded = { version: string; markdown: string; created: boolean } | { skipped: true };

/**
 * Record one push to main as a release.
 *
 * Idempotent on the pushed commit: a workflow that is re-run finds its own
 * release and answers with it, rather than bumping the version again. A push
 * with nothing in it worth a line -- merges only, or `[skip release]` --
 * records nothing.
 */
export async function recordRelease(sha: string, commits: { sha: string; message: string }[]): Promise<Recorded> {
  const entries = commits.map((commit) => parseCommit(commit.message, commit.sha)).filter((e): e is Entry => e !== null);

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${PATCH_NOTE_LOCK}::bigint)`);

    const [existing] = await tx.select().from(patchNote).where(eq(patchNote.commitSha, sha)).limit(1);
    if (existing) {
      const rows = await tx.select().from(patchNoteEntry).where(eq(patchNoteEntry.patchNoteId, existing.id));
      const saved = rows
        .sort((a, b) => a.position - b.position)
        .map((row) => ({ kind: row.kind, scope: row.scope, body: row.body, sha: row.commitSha }) as Entry);
      return { version: existing.version, markdown: releaseMarkdown({ summary: existing.summary, entries: saved }), created: false };
    }
    if (entries.length === 0) return { skipped: true } as const;

    // Every version, hidden ones too: a hidden 4.2.0 still owns its number.
    const versions = await tx.select({ version: patchNote.version }).from(patchNote);
    const version = formatVersion(nextVersion(latestVersion(versions.map((row) => row.version)), entries, FIRST));

    const [note] = await tx
      .insert(patchNote)
      .values({ version, title: defaultTitle(entries), summary: "", commitSha: sha })
      .returning({ id: patchNote.id });
    await tx.insert(patchNoteEntry).values(
      entries.map((entry, position) => ({
        patchNoteId: note.id,
        kind: entry.kind,
        scope: entry.scope,
        body: entry.body,
        commitSha: entry.sha,
        position,
      })),
    );

    return { version, markdown: releaseMarkdown({ summary: "", entries }), created: true };
  });
}
