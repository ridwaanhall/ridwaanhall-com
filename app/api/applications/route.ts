import type { NextRequest } from "next/server";

import { getApplications } from "@/lib/data/about";
import { handle, ok } from "@/lib/api/response";
import { pageParam, paginate } from "@/lib/api/pagination";

export const GET = handle(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const all = await getApplications();

  // `?all=1` returns the unpaginated list, the same escape hatch `/api/blog`
  // offers -- and what an existing consumer of this endpoint was getting before
  // it learned to page.
  if (params.get("all") === "1") return ok(all);

  return ok(paginate(all, pageParam(params)));
});
