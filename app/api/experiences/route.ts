import type { NextRequest } from "next/server";

import { getExperiences } from "@/lib/data/about";
import { handle, ok } from "@/lib/api/response";

export const GET = handle(async (request: NextRequest) => {
  const currentOnly = request.nextUrl.searchParams.get("current_only") === "true";
  return ok(await getExperiences(currentOnly));
});
