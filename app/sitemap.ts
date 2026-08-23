import type { MetadataRoute } from "next";

import { allEntries } from "@/lib/seo/sitemap";

/**
 * `/sitemap.xml` -- every URL in one document.
 *
 * One `<urlset>` with all three collections in it, not a sitemap index: an
 * index earns its keep past 50,000 URLs, and this is nowhere near that.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return allEntries();
}
