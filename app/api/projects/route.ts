import type { NextRequest } from "next/server";

import { handle, ok } from "@/lib/api/response";
import { pageParam, paginate } from "@/lib/api/pagination";
import { getProjects, searchProjects, sortProjects, toProjectSummary } from "@/lib/data/content";

export const GET = handle(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const all = await getProjects();

  // Unsorted and unpaginated, matching ContentManager.get_projects() -- for the
  // sitemap and the parity harness.
  if (params.get("all") === "1") return ok(all);

  const matched = searchProjects(sortProjects(all), params.get("q") ?? "");
  const page = paginate(matched, pageParam(params));

  // Card-sized rows: the list never renders a project's feature list or its
  // description blocks.
  return ok({
    ...page,
    items: page.items.map(toProjectSummary),
    query: params.get("q") ?? "",
  });
});
