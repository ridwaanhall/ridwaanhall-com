import type { NextRequest } from "next/server";

import { getSkills, getSkillsByCategory } from "@/lib/data/about";
import { handle, ok } from "@/lib/api/response";

export const GET = handle(async (request: NextRequest) => {
  // `?grouped=1` returns the category-ordered map the openhire page needs;
  // the default is the flat icon-bearing list the homepage marquee uses.
  const grouped = request.nextUrl.searchParams.get("grouped");
  return ok(grouped === "1" || grouped === "true" ? await getSkillsByCategory() : await getSkills());
});
