import type { NextRequest } from "next/server";

import { getCertifications } from "@/lib/data/about";
import { handle, ok } from "@/lib/api/response";
import { pageParam, paginate } from "@/lib/api/pagination";

export const GET = handle(async (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  const all = await getCertifications();

  // `?all=1` returns the unpaginated list, the same escape hatch `/api/blog`
  // offers. This endpoint answered that way and only that way until there were
  // a hundred and eleven certifications behind it, so the flag is also what
  // keeps an existing consumer working.
  if (params.get("all") === "1") return ok(all);

  // Already ordered by the read path: featured first, then newest. Paging over
  // an ordering decided here would put a different list behind `?page=2` than
  // behind the tab that shows the same rows.
  return ok(paginate(all, pageParam(params)));
});
