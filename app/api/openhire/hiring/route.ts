import { handle, notFound, ok } from "@/lib/api/response";
import { openhireEnabled } from "@/lib/api/openhire-gate";
import { getAboutData } from "@/lib/data/about";
import { getHiringData } from "@/lib/data/openhire";

export const GET = handle(async () => {
  // The same flag the /openhire page and its Markdown twin gate on.
  if (!openhireEnabled(await getAboutData(), "is_hiring")) return notFound("No hiring profile has been set up.");
  const data = await getHiringData();
  return data ? ok(data) : notFound("No hiring profile has been set up.");
});
