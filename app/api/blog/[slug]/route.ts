import type { NextRequest } from "next/server";

import { handle, notFound, ok } from "@/lib/api/response";
import { findBySlug, getBlogs, incrementBlogViews } from "@/lib/data/content";

export const GET = handle(async (_request: NextRequest, ctx: RouteContext<"/api/blog/[slug]">) => {
  const { slug } = await ctx.params;
  // Resolved against the cached list rather than a fresh query: the whole feed
  // is already in memory, so re-reading one row would only cost a round trip.
  const post = findBySlug(await getBlogs(), slug);
  return post ? ok(post) : notFound("No post matches that slug.");
});

export const POST = handle(async (_request: NextRequest, ctx: RouteContext<"/api/blog/[slug]">) => {
  const { slug } = await ctx.params;
  const post = findBySlug(await getBlogs(), slug);
  if (!post) return notFound("No post matches that slug.");

  await incrementBlogViews(post.id);
  // The cached payload still holds the old count, so report the incremented
  // value rather than re-reading -- the page shows it immediately and the
  // cache catches up within its lifetime.
  return ok({ views: post.views + 1 });
});
