import type { Metadata } from "next";

import { twinOf } from "@/lib/site/twins";
import type { AboutData } from "@/lib/data/about";

import { DEFAULT_OG_TYPE, DEFAULT_TWITTER_CARD, DEFAULT_TWITTER_SITE, SITE_NAME } from "./config";
import type { SeoData } from "./data";

/**
 * Turn a `SeoData` into Next's `Metadata`.
 *
 * Everything the `<head>` needs, in one place. The handful of tags Next has no
 * typed field for go through `other`.
 *
 * One thing worth stating: the canonical, `og:url` and `twitter:url` never come
 * from the requested URL. Echoing the request makes a paginated or
 * query-filtered listing declare itself canonical, which is precisely what a
 * canonical tag exists to prevent. They come from `SeoData`, where the list
 * pages already compute a page-aware value.
 */
/** `https://host/about/` to `https://host/about.md`; the home page is `/index.md`. */
function markdownAddress(canonical: string): string {
  const url = new URL(canonical);
  url.pathname = twinOf(url.pathname);
  return url.toString();
}

export function buildMetadata(seo: SeoData, about: AboutData): Metadata {
  const ogType = seo.og_type || DEFAULT_OG_TYPE;
  const image = seo.og_image;

  const metadata: Metadata = {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: seo.author ?? about.name }],
    creator: about.name,
    publisher: about.name,
    alternates: {
      canonical: seo.canonical_url,
      languages: {
        en: seo.canonical_url,
        "x-default": seo.canonical_url,
      },
      // The page's Markdown twin, for a crawler that reads the head to find it.
      // Derived from the canonical address, so a filtered listing -- whose
      // canonical is the unfiltered page -- names that page's twin.
      types: { "text/markdown": markdownAddress(seo.canonical_url) },
    },
    robots: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
    openGraph: {
      type: ogType as "website",
      url: seo.canonical_url,
      title: seo.title,
      description: seo.description,
      siteName: SITE_NAME,
      locale: "en_US",
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: seo.twitter_image_alt ?? seo.title }] } : {}),
      ...(ogType === "article"
        ? {
            publishedTime: toIso(seo.published_date),
            modifiedTime: toIso(seo.modified_date),
            authors: seo.author ? [seo.author] : undefined,
            tags: seo.tags,
          }
        : {}),
    },
    twitter: {
      card: (seo.twitter_card || DEFAULT_TWITTER_CARD) as "summary_large_image",
      title: seo.title,
      description: seo.description,
      ...(image ? { images: [{ url: image, alt: seo.twitter_image_alt ?? seo.title }] } : {}),
      site: seo.twitter_site ?? DEFAULT_TWITTER_SITE,
      creator: seo.twitter_creator ?? `@${about.username}`,
    },
    other: {
      // Tags the Metadata type has no field for, kept because the template
      // emitted them.
      language: "en",
      rating: "general",
      distribution: "global",
      "revisit-after": "1 days",
      copyright: seo.author ?? about.name,
    },
  };

  return metadata;
}

function toIso(value: Date | string | undefined): string | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}
