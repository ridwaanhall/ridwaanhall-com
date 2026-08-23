import { getAboutDataWithStatus } from "@/lib/data/about";
import { handle, notFound, ok } from "@/lib/api/response";

export const GET = handle(async () => {
  const data = await getAboutDataWithStatus();
  return data ? ok(data) : notFound("Profile has not been set up.");
});
