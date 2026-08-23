import type { Metadata } from "next";

import type { AboutData } from "@/lib/data/about";

import { DEFAULT_IMAGE, DEFAULT_OG_TYPE, DEFAULT_TWITTER_CARD, DEFAULT_TWITTER_SITE, SITE_NAME } from "./config";
import type { SeoData } from "./data";

/**
 * Turn a `SeoData` into Next's `Metadata`.
 *
 * A port of `SEOManager.get_meta_tags` plus seo/meta_tags.html. Every tag the
 * template emitted has an equivalent here; the handful that Next has no field
 * for go through `other`.
 *
 * One thing worth stating: the canonical, `og:url` and `twitter:url` never come
 * from the requested URL. Echoing the request makes a paginated or
 * query-filtered listing declare itself canonical, which is precisely what a
 * canonical tag exists to prevent. They come from `SeoData`, where the list
 * pages already compute a page-aware value.
 */
export function buildMetadata(seo: SeoData, about: AboutData): Metadata {
  const ogType = seo.og_type || DEFAULT_OG_TYPE;
  const image = seo.og_image || DEFAULT_IMAGE;

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
      images: [{ url: image, width: 1200, height: 630, alt: seo.twitter_image_alt ?? seo.title }],
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
      images: [{ url: image, alt: seo.twitter_image_alt ?? seo.title }],
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
