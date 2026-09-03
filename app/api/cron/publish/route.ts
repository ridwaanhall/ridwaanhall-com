import { revalidateTag } from "next/cache";
import { and, eq, lte, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { fail, handle, ok } from "@/lib/api/response";
import { TAGS } from "@/lib/data/tags";
import { db } from "@/lib/db/client";
import { blogPost } from "@/lib/db/app-schema";

/**
 * Publish the posts whose time has come.
 *
 * `is_published` is the only thing the public read paths look at, and they are
 * cached for days -- so the schedule cannot be a `published_at <= now()` in the
 * query. A clock comparison inside a `"use cache"` function is evaluated when
 * the entry is filled and then frozen with it, which would leave a post
 * scheduled for tomorrow hidden for days after its moment. The flag moves
 * instead, and this is what moves it.
 *
 * Only blog posts. `project` carries the same draft flag but no column saying
 * *when* it should go live, so a project is published by hand -- which is the
 * honest shape for it: a project goes public when there is something to link
 * to, and that is not a date anybody knows in advance.
 *
 * `revalidateTag` rather than `updateTag`, which reads backwards for a
 * read-your-own-writes job and is not a choice: `updateTag` is refused outside
 * a Server Action, and this is a route handler. The cost is one request --
 * `profile: "max"` marks the tag stale and serves the stale copy while the
 * refresh runs behind it, so the post appears on the request after the first
 * one rather than on the first. Seconds, against a schedule measured in days.
 */
export const GET = handle(async (request: NextRequest) => {
  /*
   * Fails closed when unset, unlike the other secret with this shape.
   * `verifyTurnstile` passes when its key is missing, which is defensible for a
   * spam gate nobody has configured yet and is not defensible here: an open
   * endpoint that writes to `blog_post` publishes drafts for anybody who finds
   * the path.
   */
  const secret = process.env.CRON_SECRET;
  if (!secret) return fail("This endpoint needs CRON_SECRET to be set.", 503);
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return fail("Not authorised.", 401);
  }

  // `now()` is the database's clock, which is the same one `published_at` was
  // written against. Comparing here against the server's would make the moment
  // depend on which machine answered.
  const due = await db
    .update(blogPost)
    .set({ isPublished: true })
    .where(and(eq(blogPost.isPublished, false), lte(blogPost.publishedAt, sql`now()`)))
    .returning({ slug: blogPost.slug });

  // Only when something actually moved. Marking the tag on every run would
  // discard the blog payload on a schedule, which is the opposite of what a
  // cache with a lifetime of days is for.
  if (due.length > 0) revalidateTag(TAGS.blog, "max");

  return ok({ published: due.map((row) => row.slug) });
});
