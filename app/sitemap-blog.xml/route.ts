import { blogEntries, renderSitemap } from "@/lib/seo/sitemap";

/**
 * Kept alongside `/sitemap.xml` because robots.txt advertises this URL and it
 * is already submitted to Search Console. Next generates only `/sitemap.xml`
 * from `app/sitemap.ts`, so the named documents are rendered here.
 */
export async function GET() {
  return new Response(renderSitemap(await blogEntries()), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
