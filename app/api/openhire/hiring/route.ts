import { handle, notFound, ok } from "@/lib/api/response";
import { getHiringData } from "@/lib/data/openhire";

export const GET = handle(async () => {
  const data = await getHiringData();
  return data ? ok(data) : notFound("No hiring profile has been set up.");
});
