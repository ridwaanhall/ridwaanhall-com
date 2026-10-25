import { asc, desc, eq, inArray } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import { patchNote, patchNoteEntry } from "@/lib/db/app-schema";
import { KINDS, type Kind } from "@/lib/patch-notes/commits";

import { TAGS } from "./tags";

/** The site's release history, newest first, for the page and its Markdown twin. */

export type PatchNoteEntry = { kind: Kind; scope: string; body: string; sha: string };

export type PatchNote = {
  version: string;
  title: string;
  summary: string;
  released_at: string;
  commit_sha: string;
  entries: PatchNoteEntry[];
};

const REPOSITORY = "https://github.com/ridwaanhall/ridwaanhall-com";

export const releaseUrl = (version: string) => `${REPOSITORY}/releases/tag/v${version}`;
export const commitUrl = (sha: string) => `${REPOSITORY}/commit/${sha}`;

/**
 * Published notes only. Ordered by `released_at`, not by version: the version
 * is text, so "4.10.0" would sort before "4.9.0", and the date says the same
 * thing without the parsing.
 */
export async function getPatchNotes(): Promise<PatchNote[]> {
  "use cache";
  cacheTag(TAGS.patchNotes);
  cacheLife("days");

  const notes = await db
    .select()
    .from(patchNote)
    .where(eq(patchNote.isPublished, true))
    .orderBy(desc(patchNote.releasedAt), desc(patchNote.version));
  if (notes.length === 0) return [];

  const entries = await db
    .select()
    .from(patchNoteEntry)
    .where(
      inArray(
        patchNoteEntry.patchNoteId,
        notes.map((note) => note.id),
      ),
    )
    .orderBy(asc(patchNoteEntry.position), asc(patchNoteEntry.id));

  return notes.map((note) => ({
    version: note.version,
    title: note.title,
    summary: note.summary,
    released_at: note.releasedAt,
    commit_sha: note.commitSha ?? "",
    entries: entries
      .filter((entry) => entry.patchNoteId === note.id)
      .map((entry) => ({
        // The column is constrained to these, so this only narrows the type.
        kind: (KINDS as readonly string[]).includes(entry.kind) ? (entry.kind as Kind) : "other",
        scope: entry.scope,
        body: entry.body,
        sha: entry.commitSha,
      })),
  }));
}
