import type { NextRequest } from "next/server";

import { handle, notFound, ok } from "@/lib/api/response";
import { findBySlug, getProjects } from "@/lib/data/content";

export const GET = handle(
  async (_request: NextRequest, ctx: RouteContext<"/api/projects/[slug]">) => {
    const { slug } = await ctx.params;
    const project = findBySlug(await getProjects(), slug);
    return project ? ok(project) : notFound("No project matches that slug.");
  },
);
