"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { getUserProfile } from "@/lib/auth/profile";
import {
  canDeleteComment,
  isCommentable,
  MAX_COMMENT_LENGTH,
} from "@/lib/data/comment-shapes";
import { commentIdsOnTarget, getComment } from "@/lib/data/comments";
import { db } from "@/lib/db/client";
import { comment as commentTable } from "@/lib/db/app-schema";

/**
 * Posting and deleting comments.
 *
 * Server actions rather than POST-then-redirect, and the progressive
 * enhancement comes with them: the form carries a real `action`, so it still
 * posts with JavaScript unavailable.
 *
 * There is no `next` parameter and no same-site validation to get right,
 * because there is no redirect: the action revalidates the path it already
 * knows and the reader never leaves the page. A destination arriving in the
 * POST body would be an attacker-controlled URL feeding a redirect sink; this
 * shape has neither. The `#comments` fragment such forms carry existed
 * to avoid being dropped at the masthead of a 2000-word post after a reload --
 * also moot when nothing reloads.
 */

export type CommentResult = { ok: true; notice: string } | { ok: false; error: string };

async function viewer() {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const profile = await getUserProfile(id);
  return profile
    ? { userId: profile.id, moderate: profile.can.moderateComments, post: profile.can.comment }
    : null;
}

/** Where the section lives, so the action can revalidate it. */
function pathFor(label: string, slug: string): string {
  return label === "blog_post" ? `/blog/${slug}` : `/projects/${slug}`;
}

export async function postComment(formData: FormData): Promise<CommentResult> {
  const who = await viewer();
  // The section hides the form when signed out, but hiding a control is not
  // access control -- the endpoint has to refuse too.
  if (!who) return { ok: false, error: "Sign in to post a comment." };

  /*
   * And being signed in is no longer the whole of it.
   *
   * `can.comment` is false for an account somebody has switched off on the
   * Public access screen, and for any account that is not active -- which used
   * to mean nothing outside the admin, so a deactivated reader could still post
   * here indefinitely. Said once in `lib/auth/public.ts`; asked here.
   */
  if (!who.post) {
    return { ok: false, error: "This account cannot post comments." };
  }

  const label = String(formData.get("content_type") ?? "");
  const targetId = String(formData.get("object_id") ?? "");
  const slug = String(formData.get("slug") ?? "");

  // Without the allowlist, `content_type` is attacker-chosen and comments could
  // be attached to any table in the database.
  if (!isCommentable(label)) return { ok: false, error: "Not commentable" };
  // A uuid or nothing. The old guard parsed it as an integer, which is what
  // a sequential id used to be.
  if (!targetId) return { ok: false, error: "Unknown object" };

  const body = String(formData.get("body") ?? "").trim();
  // A body of only whitespace passes a `required` check but is not a comment.
  if (!body) return { ok: false, error: "Write something before posting." };
  if (body.length > MAX_COMMENT_LENGTH) {
    return { ok: false, error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` };
  }


  /*
   * Resolve the parent, then apply two rules that have to hold however a row is
   * created -- not only on the path this action takes.
   *
   * - **Scope the lookup to this target.** A reply must not be graftable onto
   *   a thread belonging to a different post, which a bare `pk` lookup would
   *   allow.
   * - **Flatten to one level.** Replying to a reply attaches to *its* parent.
   *   The section renders one level of nesting and a deeper row would simply
   *   not appear.
   */
  let replyToId: string | null = null;
  const requested = String(formData.get("reply_to") ?? "");
  if (requested) {
    const [parent] = await commentIdsOnTarget(label, targetId, [requested]);
    if (!parent) return { ok: false, error: "That comment is no longer available." };
    replyToId = parent.replyToId ?? parent.id;
  }

  await db.insert(commentTable).values({
    targetKind: label,
    targetId,
    accountId: who.userId,
    body,
    replyToId,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  });

  if (slug) revalidatePath(pathFor(label, slug));
  return { ok: true, notice: replyToId ? "Reply posted." : "Comment posted." };
}

export async function deleteComment(id: string, slug: string): Promise<CommentResult> {
  const who = await viewer();
  if (!who) return { ok: false, error: "Sign in to manage comments." };

  const comment = await getComment(id);
  if (!comment) return { ok: false, error: "That comment is no longer available." };
  if (!canDeleteComment({ userId: comment.userId, isDeleted: comment.isDeleted }, who)) {
    return { ok: false, error: "You can only delete your own comments." };
  }

  // Soft delete: a removed parent must not take its replies with it, and the
  // thread stays readable with a tombstone in place of the original text.
  await db
    .update(commentTable)
    .set({ isDeleted: true })
    .where(and(eq(commentTable.id, id), eq(commentTable.isDeleted, false)));

  // The row says which kind it is, so there is nothing to resolve: this used
  // to fetch a content-type id and compare against it to work out which path
  // to revalidate.
  if (slug) revalidatePath(pathFor(comment.targetKind, slug));
  return { ok: true, notice: "Comment deleted." };
}
