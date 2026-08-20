import { getApplications } from "@/lib/data/about";
import { handle, ok } from "@/lib/api/response";

export const GET = handle(async () => {
  return ok(await getApplications());
});
