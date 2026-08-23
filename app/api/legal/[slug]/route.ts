import type { NextRequest } from "next/server";

import { handle, notFound, ok } from "@/lib/api/response";
import { getLegalDocument } from "@/lib/data/legal";

export const GET = handle(async (_request: NextRequest, ctx: RouteContext<"/api/legal/[slug]">) => {
  const { slug } = await ctx.params;
  const document = await getLegalDocument(slug);
  return document ? ok(document) : notFound("No such document.");
});
