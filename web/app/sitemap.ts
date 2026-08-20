import type { MetadataRoute } from "next";

import { allEntries } from "@/lib/seo/sitemap";

/**
 * `/sitemap.xml` -- every URL in one document.
 *
 * Matches what Django served: its `sitemap` view was given all three
 * collections at once and emitted a single `<urlset>`, not a sitemap index.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return allEntries();
}
