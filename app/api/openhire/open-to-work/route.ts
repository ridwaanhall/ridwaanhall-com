import { handle, notFound, ok } from "@/lib/api/response";
import { getOpenToWorkData } from "@/lib/data/openhire";

export const GET = handle(async () => {
  const data = await getOpenToWorkData();
  return data ? ok(data) : notFound("No open-to-work profile has been set up.");
});
