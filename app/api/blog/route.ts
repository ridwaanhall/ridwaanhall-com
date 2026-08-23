import type { NextRequest } from "next/server";

import { handle, ok } from "@/lib/api/response";
import { pageParam, paginate } from "@/lib/api/pagination";
import { featuredBlogs, getBlogs, searchBlogs, toBlogSummary } from "@/lib/data/content";

export const GET = handle(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const all = await getBlogs();

  // `?all=1` returns the unpaginated list, for the sitemap and for any consumer
  // that wants the whole feed rather than a page of it.
  if (params.get("all") === "1") return ok(all);

  const matched = searchBlogs(all, params.get("q") ?? "");
  const page = paginate(matched, pageParam(params));

  return ok({
    ...page,
    // Card-sized rows: the list never renders a post body, and shipping 20 of
    // them would be most of the response.
    items: page.items.map(toBlogSummary),
    // The slider above the list always shows the newest featured posts,
    // regardless of the current page or search.
    featured: featuredBlogs(all).map(toBlogSummary),
    query: params.get("q") ?? "",
  });
});
