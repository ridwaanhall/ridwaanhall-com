import { ITEMS_PER_PAGE } from "@/lib/api/pagination";
import { getBlogs, getProjects } from "@/lib/data/content";
import { getLegalDocuments } from "@/lib/data/legal";

import { SITE_URL } from "./config";

/**
 * Sitemap entries.
 *
 * Two things here are worth stating, because both were wrong for a long time
 * without anything noticing.
 *
 * **`lastmod` must come from the rows.** It used to be derived from files on
 * disk that had been deleted when the content moved into the database, so the
 * lookup matched nothing and every page fell through to a hard-coded fallback
 * of 2024-01-01 -- home, about, contact, privacy, terms, blog and projects, all
 * claiming the same date for two years. A sitemap that lies about freshness is
 * worse than one that omits the field.
 *
 * **Paginated URLs were generated at six per page while the site paginates at
 * ten.** That advertised `/blog/?page=3` and `?page=4` when only two pages
 * exist, and eleven project pages when there are seven. An out-of-range page
 * clamps to the last one rather than 404ing, so each phantom URL returned 200
 * with duplicate content. Fixed by using the real page size.
 */

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
};

/** The date the site launched, used where nothing better is known. */
const FALLBACK = new Date("2025-03-16T00:00:00+07:00");

const latest = (dates: (Date | null | undefined)[]): Date => {
  const times = dates.filter((d): d is Date => d instanceof Date).map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)) : FALLBACK;
};

export async function staticEntries(): Promise<SitemapEntry[]> {
  const [blogs, projects, legal] = await Promise.all([
    getBlogs(),
    getProjects(),
    getLegalDocuments(),
  ]);

  const blogUpdated = latest(blogs.map((b) => b.updated_at));
  const projectUpdated = latest(projects.map((p) => p.updated_at));
  // The home page surfaces both feeds plus the profile, so it is as fresh as
  // the freshest of them.
  const homeUpdated = latest([blogUpdated, projectUpdated]);

  const privacy = legal.find((d) => d.slug === "privacy-policy");
  const terms = legal.find((d) => d.slug === "terms-and-conditions");

  const entries: SitemapEntry[] = [
    { url: `${SITE_URL}/`, lastModified: homeUpdated, changeFrequency: "weekly", priority: 1.0 },
    // The dashboard reflects GitHub and WakaTime activity, which genuinely
    // changes daily, but it holds no stored timestamp of its own.
    { url: `${SITE_URL}/dashboard`, lastModified: homeUpdated, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/about`, lastModified: homeUpdated, changeFrequency: "monthly", priority: 1.0 },
    { url: `${SITE_URL}/contact`, lastModified: FALLBACK, changeFrequency: "monthly", priority: 1.0 },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: privacy?.last_updated ?? FALLBACK,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: terms?.last_updated ?? FALLBACK,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    // The guestbook is excluded until the feature lands in phase 2; adding it
    // now would advertise a page that is still a stub.
  ];

  // Paginated listing pages, at the size the site actually uses.
  const pageEntries = (base: string, count: number, updated: Date): SitemapEntry[] => {
    const pages = Math.max(1, Math.ceil(count / ITEMS_PER_PAGE));
    return Array.from({ length: pages }, (_, i) => ({
      url: i === 0 ? `${SITE_URL}${base}` : `${SITE_URL}${base}?page=${i + 1}`,
      lastModified: updated,
      changeFrequency: "monthly" as const,
      priority: i === 0 ? 1.0 : 0.9,
    }));
  };

  return [
    ...entries,
    ...pageEntries("/blog", blogs.length, blogUpdated),
    ...pageEntries("/projects", projects.length, projectUpdated),
  ];
}

export async function blogEntries(): Promise<SitemapEntry[]> {
  const blogs = await getBlogs();
  return blogs.map((blog) => ({
    url: `${SITE_URL}/blog/${blog.slug}`,
    lastModified: blog.updated_at,
    changeFrequency: "monthly",
    // Featured content is worth crawling more often.
    priority: blog.is_featured ? 0.9 : 0.7,
  }));
}

export async function projectEntries(): Promise<SitemapEntry[]> {
  const projects = await getProjects();
  return projects.map((project) => ({
    url: `${SITE_URL}/projects/${project.slug}`,
    lastModified: project.updated_at ?? FALLBACK,
    changeFrequency: "monthly",
    priority: project.is_featured ? 0.9 : 0.7,
  }));
}

export async function allEntries(): Promise<SitemapEntry[]> {
  const [statics, blogs, projects] = await Promise.all([
    staticEntries(),
    blogEntries(),
    projectEntries(),
  ]);
  return [...statics, ...blogs, ...projects];
}

/**
 * Render entries as a sitemap XML document.
 *
 * Hand-rendered because Next only generates `/sitemap.xml` from
 * `app/sitemap.ts`, while robots.txt also advertises `sitemap-static.xml`,
 * `sitemap-blog.xml` and `sitemap-projects.xml`. Those URLs are already
 * submitted to Search Console, so they have to keep working.
 *
 * `lastmod` is a plain date -- a timestamp would imply a precision the source
 * data does not have.
 */
export function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (entry) =>
        `<url><loc>${escapeXml(entry.url)}</loc>` +
        `<lastmod>${entry.lastModified.toISOString().slice(0, 10)}</lastmod>` +
        `<changefreq>${entry.changeFrequency}</changefreq>` +
        `<priority>${entry.priority.toFixed(1)}</priority></url>`,
    )
    .join("");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    `${urls}\n</urlset>`
  );
}

/** A slug or title could carry `&`; an unescaped one makes the document invalid. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
