import { revalidateTag } from "next/cache";
import { and, eq, lte, sql } from "drizzle-orm";

import { handle, ok } from "@/lib/api/response";
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
export const GET = handle(async () => {
  /*
   * Open on purpose. What it publishes is exactly the set of posts whose
   * `published_at` has already passed -- the set the scheduled run publishes
   * anyway -- so a request from anybody can bring a post forward by at most one
   * interval of the workflow, and can never reach one dated in the future. A
   * secret guarded nothing a stranger could not get by waiting fifteen minutes,
   * and cost a value that had to be set, and match, in two places.
   *
   * The corollary is the one thing to know: unpublishing a post whose date is
   * in the past does not keep it down -- the next run puts it back. Move the
   * date forward to take one off the schedule.
   */

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
