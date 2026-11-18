import { handle, notFound, ok } from "@/lib/api/response";
import { openhireEnabled } from "@/lib/api/openhire-gate";
import { getAboutData } from "@/lib/data/about";
import { getOpenToWorkData } from "@/lib/data/openhire";

export const GET = handle(async () => {
  // The same flag the /openhire page and its Markdown twin gate on.
  if (!openhireEnabled(await getAboutData(), "is_open_to_work")) {
    return notFound("No open-to-work profile has been set up.");
  }
  const data = await getOpenToWorkData();
  return data ? ok(data) : notFound("No open-to-work profile has been set up.");
});
