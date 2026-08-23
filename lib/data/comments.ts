import { and, asc, eq, inArray } from "drizzle-orm";

import { getUserProfiles } from "@/lib/auth/profile";
import {
  canDeleteComment,
  type CommentNode,
  type CommentSection,
  type CommentTargetLabel,
} from "@/lib/data/comment-shapes";
import { db } from "@/lib/db/client";
import { comment } from "@/lib/db/app-schema";

/**
 * Comments on blog posts and projects.
 *
 * One table with a generic relation serves both, rather than a
 * BlogComment/ProjectComment pair duplicating the query, the actions and the
 * markup as well as the rows.
 *
 * **Deliberately not cached.** Every other read on the site goes through `use
 * cache`, and this one must not: the cached blog and project payloads are what
 * the busiest pages are built from, so tying comments to them would make every
 * comment posted force a full rebuild from Supabase. It is a single indexed
 * lookup on `(target_kind, target_id, created_at)` instead, which is the index
 * `drizzle/0000_init.sql` declares for exactly this.
 */

/**
 * Just the verbs this file uses, so a drizzle transaction satisfies it as
 * readily as the pooled connection does -- `scripts/check-comments.mjs` drives
 * these against the live schema inside a transaction it rolls back. The rules
 * worth checking -- the target scoping, the `reply_to` cascade, `is_deleted` --
 * are enforced by Postgres and by nothing else.
 */
export type Database = Pick<typeof db, "select" | "insert" | "update" | "delete">;

/**
 * The whole section for one commented object.
 *
 * Two queries: the comments, then their authors' profiles in one batch. Not
 * one query per author, which is what a naive render of a thread produces.
 *
 * **The count comes from what was fetched**, not a second `COUNT(*)`: the rows
 * are already in memory, so a round trip would buy nothing.
 */
export async function getCommentSection({
  label,
  targetId,
  viewer,
  database = db,
}: {
  label: CommentTargetLabel;
  targetId: string;
  viewer: { userId: string; isAuthor: boolean; isCoAuthor: boolean } | null;
  database?: Database;
}): Promise<CommentSection> {
  const rows = await database
    .select({
      id: comment.id,
      body: comment.body,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      replyToId: comment.replyToId,
      userId: comment.accountId,
    })
    .from(comment)
    // Two plain columns, no join: a comment names what it is attached to
    // directly, so finding a thread never needs a second table.
    .where(and(eq(comment.targetKind, label), eq(comment.targetId, targetId)))
    .orderBy(asc(comment.createdAt), asc(comment.id));

  const profiles = await getUserProfiles(rows.map((row) => row.userId), database);

  const toNode = (row: (typeof rows)[number]): CommentNode => {
    const profile = profiles.get(row.userId);
    return {
      id: row.id,
      /*
       * The same name the guestbook shows, which is a deliberate change.
       *
       * The stored `first_name`/`last_name` are written once, at sign-up, and
       * never again -- so a comment rendered from them and a guestbook message
       * rendered from the live provider profile show the same person under two
       * different names on the same page. Both read the provider profile.
       */
      displayName: profile?.fullName ?? profile?.username ?? "Unknown",
      username: profile?.username ?? "unknown",
      userId: row.userId,
      profileImage: profile?.profileImage ?? null,
      isAuthor: profile?.isAuthor ?? false,
      isCoAuthor: profile?.isCoAuthor ?? false,
      body: row.isDeleted ? "" : row.body,
      isDeleted: row.isDeleted,
      createdAt: row.createdAt,
      replies: [],
      canDelete: canDeleteComment({ userId: row.userId, isDeleted: row.isDeleted }, viewer),
    };
  };

  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // One level, so a single pass in created order suffices: a reply's parent is
  // always a root and roots are never replies. The flattening that guarantees
  // that happens on write, in `lib/actions/comments.ts`.
  for (const row of rows) {
    const node = toNode(row);
    byId.set(node.id, node);
    if (row.replyToId === null) roots.push(node);
  }
  for (const row of rows) {
    if (row.replyToId === null) continue;
    const parent = byId.get(row.replyToId);
    const node = byId.get(row.id);
    if (parent && node) parent.replies.push(node);
    // A reply whose parent is missing is dropped rather than promoted: the
    // parent row cannot be absent (`reply_to` cascades), so this can only mean
    // a reply that outlived its target, and showing it detached would be worse
    // than not showing it.
  }

  const count = rows.filter((row) => !row.isDeleted).length;

  return { comments: roots, count, targetLabel: label, targetId };
}

/** Fetch a comment for a permission check, scoped to nothing -- see the action. */
export async function getComment(id: string) {
  const [row] = await db
    .select({
      id: comment.id,
      userId: comment.accountId,
      isDeleted: comment.isDeleted,
      body: comment.body,
      targetKind: comment.targetKind,
      targetId: comment.targetId,
      replyToId: comment.replyToId,
    })
    .from(comment)
    .where(eq(comment.id, id))
    .limit(1);
  return row ?? null;
}

/** Ids that exist on this target, for scoping a reply's parent. */
export async function commentIdsOnTarget(
  targetKind: CommentTargetLabel,
  targetId: string,
  ids: string[],
  database: Database = db,
) {
  if (ids.length === 0) return [];
  return database
    .select({ id: comment.id, replyToId: comment.replyToId })
    .from(comment)
    .where(
      and(
        eq(comment.targetKind, targetKind),
        eq(comment.targetId, targetId),
        inArray(comment.id, ids),
      ),
    );
}
