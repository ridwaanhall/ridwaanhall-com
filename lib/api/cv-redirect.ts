import type { Route } from "next";
import { redirect } from "next/navigation";

import { getAboutData } from "@/lib/data/about";
import { CV_FILE } from "@/lib/site/cv";

/**
 * Redirect to one of the CV links stored on the profile.
 *
 * Ports `_CVLinkRedirectView`. The three paths (/cv/, /cv-latest/, /cv-copy/)
 * are stable public URLs that point at documents hosted elsewhere, so the
 * destination can change in the admin without the shared link breaking.
 *
 * An unset link falls back to the CV generated from the About page rather than
 * 404ing: a stale CV link in someone's inbox should land on a CV.
 */
export async function cvRedirect(key: "main" | "latest" | "copy"): Promise<never> {
  const about = await getAboutData();
  const url = about?.cv?.[key];
  // The destination is an absolute URL stored in the database (Google Drive,
  // typically), which `typedRoutes` cannot know about -- its `Route` type only
  // covers this app's own paths. The cast is the narrow escape hatch for that;
  // `redirect()` handles absolute URLs correctly at runtime.
  redirect((url || CV_FILE) as Route);
}
