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
import { commentIdsOnTarget, contentTypeId, getComment } from "@/lib/data/comments";
import { db } from "@/lib/db/client";
import { commentsComment } from "@/lib/db/schema";

/**
 * Posting and deleting comments.
 *
 * Django's pair were POST-then-redirect, which is why a comment's markup lives
 * in one template while the guestbook's had to exist twice. Server actions keep
 * that property and the progressive enhancement with it: the form carries a
 * real `action`, so it still posts with JavaScript unavailable.
 *
 * `next` and its same-site validation are gone with the redirect. Django needed
 * `url_has_allowed_host_and_scheme` because the destination arrived in the POST
 * body and fed a redirect sink; here the action revalidates the path it already
 * knows and the reader never leaves the page, so there is no sink and no
 * attacker-controlled URL. The `#comments` fragment those forms carried existed
 * to avoid being dropped at the masthead of a 2000-word post after a reload --
 * also moot when nothing reloads.
 */

export type CommentResult = { ok: true; notice: string } | { ok: false; error: string };

async function viewer() {
  const session = await auth();
  const id = Number(session?.user?.id);
  if (!Number.isInteger(id)) return null;
  const profile = await getUserProfile(id);
  return profile
    ? { userId: profile.id, isAuthor: profile.isAuthor, isCoAuthor: profile.isCoAuthor }
    : null;
}

/** Where the section lives, so the action can revalidate it. */
function pathFor(label: string, slug: string): string {
  return label === "blog.blogpost" ? `/blog/${slug}` : `/projects/${slug}`;
}

export async function postComment(formData: FormData): Promise<CommentResult> {
  const who = await viewer();
  // The section hides the form when signed out, but hiding a control is not
  // access control -- the endpoint has to refuse too.
  if (!who) return { ok: false, error: "Sign in to post a comment." };

  const label = String(formData.get("content_type") ?? "");
  const targetId = Number(formData.get("object_id"));
  const slug = String(formData.get("slug") ?? "");

  // Without the allowlist, `content_type` is attacker-chosen and comments could
  // be attached to any table in the database.
  if (!isCommentable(label)) return { ok: false, error: "Not commentable" };
  if (!Number.isInteger(targetId) || targetId <= 0) {
    return { ok: false, error: "Unknown object" };
  }

  const body = String(formData.get("body") ?? "").trim();
  // A body of only whitespace passes a `required` check but is not a comment.
  if (!body) return { ok: false, error: "Write something before posting." };
  if (body.length > MAX_COMMENT_LENGTH) {
    return { ok: false, error: `Comments are limited to ${MAX_COMMENT_LENGTH} characters.` };
  }

  const typeId = await contentTypeId(label);

  /*
   * Resolve the parent, then apply the two rules Django put in `Comment.save()`
   * rather than in its view -- so they hold however a row is created.
   *
   * - **Scope the lookup to this target.** A reply must not be graftable onto
   *   a thread belonging to a different post, which a bare `pk` lookup would
   *   allow.
   * - **Flatten to one level.** Replying to a reply attaches to *its* parent.
   *   The section renders one level of nesting and a deeper row would simply
   *   not appear.
   */
  let replyToId: number | null = null;
  const requested = Number(formData.get("reply_to"));
  if (Number.isInteger(requested) && requested > 0) {
    const [parent] = await commentIdsOnTarget(typeId, targetId, [requested]);
    if (!parent) return { ok: false, error: "That comment is no longer available." };
    replyToId = parent.replyToId ?? parent.id;
  }

  await db.insert(commentsComment).values({
    contentTypeId: typeId,
    objectId: targetId,
    userId: who.userId,
    body,
    replyToId,
    isDeleted: false,
    createdAt: new Date().toISOString(),
  });

  if (slug) revalidatePath(pathFor(label, slug));
  return { ok: true, notice: replyToId ? "Reply posted." : "Comment posted." };
}

export async function deleteComment(id: number, slug: string): Promise<CommentResult> {
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
    .update(commentsComment)
    .set({ isDeleted: true })
    .where(and(eq(commentsComment.id, id), eq(commentsComment.isDeleted, false)));

  if (slug) {
    const label = comment.contentTypeId === (await contentTypeId("blog.blogpost"))
      ? "blog.blogpost"
      : "projects.project";
    revalidatePath(pathFor(label, slug));
  }
  return { ok: true, notice: "Comment deleted." };
}
