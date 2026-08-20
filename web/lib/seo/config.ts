/**
 * SEO constants.
 *
 * A port of apps/seo/config.py. These strings are indexed -- titles, canonical
 * URLs and descriptions all appear in search results today -- so they are
 * carried over verbatim rather than rewritten.
 */

export const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL ?? "https://ridwaanhall.com").replace(
  /\/+$/,
  "",
);

export const SITE_NAME = "ridwaanhall.com";
export const AUTHOR = "Ridwan Halim";

export const DEFAULT_DESCRIPTION_LENGTH = 160;
export const DEFAULT_OG_TYPE = "website";
export const DEFAULT_TWITTER_CARD = "summary_large_image";
export const DEFAULT_TWITTER_SITE = "@ridwaanhall";

/**
 * The site-wide fallback social image.
 *
 * Django pointed this at `/staticfiles/img/ridwaanhall.webp`, which **404s** --
 * `STATIC_URL` is `static/`, so the published path is `/static/img/...`. The
 * bug is latent rather than visible: this value is only reached when the
 * profile has no image of its own, and it does have one. Corrected here, and
 * the file is kept at the working path in public/static/img/.
 */
export const DEFAULT_IMAGE = `${SITE_URL}/static/img/ridwaanhall.webp`;

type ContentTypeConfig = {
  og_type: string;
  twitter_card: string;
  /** Used by the sitemap, not by the page metadata. */
  priority: number;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
};

export const CONTENT_TYPES = {
  homepage: { og_type: "website", twitter_card: "summary_large_image", priority: 1.0, changefreq: "weekly" },
  blog_list: { og_type: "website", twitter_card: "summary_large_image", priority: 0.9, changefreq: "daily" },
  blog_detail: { og_type: "article", twitter_card: "summary_large_image", priority: 0.8, changefreq: "monthly" },
  project_list: { og_type: "website", twitter_card: "summary_large_image", priority: 0.9, changefreq: "monthly" },
  project_detail: { og_type: "website", twitter_card: "summary_large_image", priority: 0.8, changefreq: "monthly" },
  dashboard: { og_type: "website", twitter_card: "summary_large_image", priority: 0.7, changefreq: "daily" },
  about: { og_type: "profile", twitter_card: "summary_large_image", priority: 1.0, changefreq: "monthly" },
  contact: { og_type: "website", twitter_card: "summary", priority: 0.8, changefreq: "monthly" },
  guestbook: { og_type: "website", twitter_card: "summary_large_image", priority: 0.7, changefreq: "daily" },
  privacy_policy: { og_type: "website", twitter_card: "summary", priority: 0.5, changefreq: "yearly" },
} as const satisfies Record<string, ContentTypeConfig>;

export const COMMON_KEYWORDS = {
  personal: [
    "ridwaanhall", "Ridwan Halim", "ridwaanhall.com",
    "ridwaanhall blog", "ridwaanhall portfolio",
    "software developer", "web developer", "python developer",
    "machine learning engineer", "AI engineer", "full stack developer",
  ],
  technical: [
    "Django", "Python", "JavaScript",
    "Machine Learning", "AI", "Data Science", "Web Development",
  ],
  content: [
    "portfolio", "blog", "tutorials", "coding", "programming",
    "tech insights", "development tips", "project showcase",
  ],
  location: [
    "Indonesia", "Indonesian developer", "Southeast Asia",
    "Jakarta developer", "Indonesian tech", "Southeast Asian tech",
  ],
} as const;
