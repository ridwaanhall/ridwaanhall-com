import type { NextRequest } from "next/server";

import { handle, notFound, ok } from "@/lib/api/response";
import { getPatchNotes } from "@/lib/data/patch-notes";
import { releaseMarkdown } from "@/lib/patch-notes/commits";

/**
 * One release, with the Markdown its GitHub Release carries. The workflow's
 * manual run reads this to publish a release recorded some other way -- the
 * hand-written v4.0.0 -- with the same body an automatic one would get.
 */
export const GET = handle(async (_request: NextRequest, ctx: RouteContext<"/api/patch-notes/[version]">) => {
  const { version } = await ctx.params;
  const note = (await getPatchNotes()).find((candidate) => candidate.version === version.replace(/^v/, ""));
  return note ? ok({ ...note, markdown: releaseMarkdown(note) }) : notFound("No such release.");
});
