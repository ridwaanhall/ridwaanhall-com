import type { NextRequest } from "next/server";

import { getEducation } from "@/lib/data/about";
import { handle, ok } from "@/lib/api/response";

export const GET = handle(async (request: NextRequest) => {
  const lastOnly = request.nextUrl.searchParams.get("last_only") === "true";
  return ok(await getEducation(lastOnly));
});
