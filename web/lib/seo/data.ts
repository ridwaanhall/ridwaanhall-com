import type { AboutData } from "@/lib/data/about";
import type { BlogPost, BlogSummary, Project, ProjectSummary } from "@/lib/data/content";
import type { LegalDocument } from "@/lib/data/legal";

import {
  AUTHOR,
  COMMON_KEYWORDS,
  CONTENT_TYPES,
  DEFAULT_DESCRIPTION_LENGTH,
  DEFAULT_IMAGE,
  SITE_URL,
} from "./config";

/**
 * Per-page SEO data.
 *
 * A port of apps/seo/data.py. Every title, description and keyword list is
 * copied verbatim -- these strings are what currently appears in search
 * results, so rewording them is a content decision, not a migration one.
 */

export type SeoData = {
  title: string;
  description: string;
  keywords: string;
  og_image: string;
  og_type: string;
  twitter_card: string;
  canonical_url: string;
  content_type: string;
  published_date?: Date | string;
  modified_date?: Date | string;
  tags?: string[];
  author?: string;
  twitter_image_alt?: string;
  twitter_site?: string;
  twitter_creator?: string;
};

/** Trim a description to the meta length, preferring a word boundary. */
export function optimizeDescription(
  description: string,
  maxLength = DEFAULT_DESCRIPTION_LENGTH,
): string {
  if (description.length <= maxLength) return description;
  const truncated = description.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  // Only break at a word boundary when doing so does not lose too much.
  return lastSpace > maxLength * 0.8
    ? `${truncated.slice(0, lastSpace)}...`
    : `${truncated}...`;
}

function baseSeo() {
  return {
    twitter_site: "@ridwaanhall",
    twitter_creator: "@ridwaanhall",
    twitter_image_alt: "ridwaanhall.com - Ridwan Halim Portfolio",
  };
}

function imageAlt(title: string, context = "ridwaanhall.com"): string {
  return title ? `${title} - ${context}` : `${context} - Portfolio and Blog`;
}

/** Prefer the content's own image, then the profile photo, then the site default. */
function resolveImage(about: AboutData, primary?: { image_url?: string } | null): string {
  const fallback = about.image_url || DEFAULT_IMAGE;
  if (!primary) return fallback;
  return primary.image_url || fallback;
}

export function homepageSeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 5),
    ...COMMON_KEYWORDS.technical.slice(0, 5),
    ...COMMON_KEYWORDS.content.slice(0, 3),
  ];
  const title = `Hey, I'm ${about.name} - Leaving Traces in Code and Thought`;
  return {
    title,
    // The typographic apostrophe is deliberate -- it is what ships today.
    description: `${about.name}’s personal site—${about.short_description || "A place where I share my projects, ideas, and journey."}`,
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: CONTENT_TYPES.homepage.og_type,
    twitter_card: CONTENT_TYPES.homepage.twitter_card,
    canonical_url: SITE_URL,
    content_type: "homepage",
    ...baseSeo(),
    twitter_image_alt: imageAlt(`Hey, I'm ${about.name}`),
  };
}

export function dashboardSeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    ...COMMON_KEYWORDS.technical.slice(0, 5),
    "dashboard", "stats", "github", "wakatime", "coding activity",
  ];
  return {
    title: "Focused Hours & Quiet Commits - Coding Traces That Tell",
    description: optimizeDescription(
      `Focused hours and quiet commits. This is where ${about.first_name || about.name}'s coding traces unfold.`,
    ),
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: CONTENT_TYPES.dashboard.og_type,
    twitter_card: CONTENT_TYPES.dashboard.twitter_card,
    canonical_url: `${SITE_URL}/dashboard/`,
    content_type: "dashboard",
    ...baseSeo(),
  };
}

export function projectsListSeo(
  about: AboutData,
  projects?: (Project | ProjectSummary)[],
  page = 1,
): SeoData {
  const techKeywords = projects
    ? [...new Set(projects.slice(0, 10).flatMap((p) => p.tech_stack.map((t) => t.name)))].slice(0, 8)
    : [];
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    "projects", "portfolio", "github",
    ...techKeywords,
    ...COMMON_KEYWORDS.technical.slice(0, 5),
  ];
  const base: SeoData = {
    title: "Where Code Meets Purpose - Projects That Persist",
    description: optimizeDescription(
      "Projects built from curiosity and care. Practical explorations through machine learning and the web.",
    ),
    keywords: keywords.slice(0, 15).join(", "),
    og_image: resolveImage(about, projects?.[0]),
    og_type: CONTENT_TYPES.project_list.og_type,
    twitter_card: CONTENT_TYPES.project_list.twitter_card,
    canonical_url: `${SITE_URL}/projects/`,
    content_type: "project_list",
    ...baseSeo(),
  };
  // Paginated views get their own title and canonical, so page 2 is not a
  // duplicate of page 1 in the index.
  return page > 1
    ? { ...base, title: `${base.title} - Page ${page}`, canonical_url: `${SITE_URL}/projects/?page=${page}` }
    : base;
}

export function projectDetailSeo(project: Project, about: AboutData): SeoData {
  const techKeywords = project.tech_stack.map((t) => t.name);
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 2),
    ...techKeywords,
    "project", "github", "demo", "code",
  ];
  const description = project.description
    .slice(0, 2)
    .map(String)
    .join(" ")
    .slice(0, DEFAULT_DESCRIPTION_LENGTH);

  return {
    title: `${project.title} - ${about.name}'s Project`,
    description: optimizeDescription(`${project.headline} ${description}`),
    keywords: keywords.slice(0, 15).join(", "),
    og_image: resolveImage(about, project),
    og_type: CONTENT_TYPES.project_detail.og_type,
    twitter_card: CONTENT_TYPES.project_detail.twitter_card,
    // Built from the stored slug rather than re-slugifying the title, which is
    // what Django did -- the column is the authority and cannot drift from it.
    canonical_url: `${SITE_URL}/projects/${project.slug}/`,
    content_type: "project_detail",
    ...baseSeo(),
  };
}

export function blogListSeo(
  about: AboutData,
  blogs?: (BlogPost | BlogSummary)[],
  page = 1,
): SeoData {
  const topicKeywords = blogs
    ? [...new Set(blogs.slice(0, 10).flatMap((b) => b.tags.map(String)))].slice(0, 8)
    : [];
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    ...COMMON_KEYWORDS.content.slice(0, 5),
    ...topicKeywords,
  ];
  const base: SeoData = {
    title: "Beyond Syntax - Reflections in Thought and Trace",
    description: optimizeDescription(
      "Reflections beyond syntax. Thoughts, questions and quiet technical discoveries.",
    ),
    keywords: keywords.slice(0, 15).join(", "),
    og_image: resolveImage(about),
    og_type: CONTENT_TYPES.blog_list.og_type,
    twitter_card: CONTENT_TYPES.blog_list.twitter_card,
    canonical_url: `${SITE_URL}/blog/`,
    content_type: "blog_list",
    ...baseSeo(),
  };
  return page > 1
    ? { ...base, title: `${base.title} - Page ${page}`, canonical_url: `${SITE_URL}/blog/?page=${page}` }
    : base;
}

export function blogDetailSeo(blog: BlogPost, about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 2),
    ...blog.tags.map(String),
    ...COMMON_KEYWORDS.content.slice(0, 3),
  ];
  return {
    title: `${blog.title} | ${about.name}'s Blog`,
    description: optimizeDescription(blog.description),
    keywords: keywords.slice(0, 15).join(", "),
    og_image: resolveImage(about, blog),
    og_type: CONTENT_TYPES.blog_detail.og_type,
    twitter_card: CONTENT_TYPES.blog_detail.twitter_card,
    canonical_url: `${SITE_URL}/blog/${blog.slug}/`,
    content_type: "blog_detail",
    published_date: blog.created_at,
    modified_date: blog.updated_at,
    tags: blog.tags.map(String),
    author: about.name,
    ...baseSeo(),
  };
}

export function aboutSeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal,
    "about", "biography", "background", "experience", "skills",
  ];
  const location = about.location;
  const locationStr = `${location.regency}, ${location.country || "Indonesia"} ${location.flag || "🇮🇩"}`;

  return {
    title: "In Code, Curiosity, and Care - The Story So Far",
    description: `In between ${locationStr} and Bash scripts. A path shaped by code, community and contemplation.`,
    keywords: keywords.slice(0, 15).join(", "),
    og_image: resolveImage(about),
    og_type: CONTENT_TYPES.about.og_type,
    twitter_card: CONTENT_TYPES.about.twitter_card,
    canonical_url: `${SITE_URL}/about/`,
    content_type: "about",
  };
}

export function contactSeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 5),
    "contact", "hire", "freelance", "collaboration", "get in touch",
  ];
  return {
    title: "Reach Out - Conversations that Begin Beyond Code",
    description: "Some conversations begin with code. Others start with a quiet hello.",
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: CONTENT_TYPES.contact.og_type,
    twitter_card: CONTENT_TYPES.contact.twitter_card,
    canonical_url: `${SITE_URL}/contact/`,
    content_type: "contact",
  };
}

export function guestbookSeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    "guestbook", "chat", "live chat", "messages", "community",
  ];
  return {
    title: "Guestbook - Leave a Thought, Leave a Trace",
    description: "Before you go, leave a trace. This quiet corner is open to your words.",
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: CONTENT_TYPES.guestbook.og_type,
    twitter_card: CONTENT_TYPES.guestbook.twitter_card,
    canonical_url: `${SITE_URL}/guestbook/`,
    content_type: "guestbook",
  };
}

export function privacyPolicySeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    "privacy policy", "data protection", "user privacy", "terms",
  ];
  return {
    title: "Privacy Policy - Because Traces Deserve Trust",
    description: "Your data matters here. I protect your traces with clarity and quiet intent.",
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: "website",
    twitter_card: "summary",
    canonical_url: `${SITE_URL}/privacy-policy/`,
    content_type: "privacy_policy",
  };
}

/**
 * Any legal document other than the privacy policy.
 *
 * Terms shipped with none of this at all -- no canonical, no meta description,
 * no structured data -- which left it indistinguishable from a duplicate of
 * another page.
 */
export function legalDocumentSeo(about: AboutData, document: LegalDocument): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    "terms", "conditions", "legal", "policy",
  ];
  const summary = document.summary || `${document.title} for ${SITE_URL}.`;
  return {
    title: `${document.title} - Clear Terms, Plainly Stated`,
    description: optimizeDescription(summary),
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: "website",
    twitter_card: "summary",
    canonical_url: `${SITE_URL}${document.url}`,
    content_type: "privacy_policy",
    ...baseSeo(),
  };
}

export function openhireSeo(about: AboutData): SeoData {
  const keywords = [
    ...COMMON_KEYWORDS.personal.slice(0, 3),
    "open to work", "hiring", "career", "job opportunities", "recruitment",
  ];

  const titleParts: string[] = [];
  if (about.is_open_to_work) titleParts.push("Open to Work");
  if (about.is_hiring) titleParts.push("Hiring");
  const title = titleParts.length ? titleParts.join(" & ") : "Career Opportunities";

  let description = "Explore career opportunities and work availability. ";
  if (about.is_open_to_work) description += "Currently open to new opportunities. ";
  if (about.is_hiring) description += "Actively hiring talented individuals. ";
  description += "Let's build something amazing together.";

  return {
    title: `${title} - Connecting Talent with Opportunity`,
    description,
    keywords: keywords.join(", "),
    og_image: resolveImage(about),
    og_type: "website",
    twitter_card: "summary_large_image",
    canonical_url: `${SITE_URL}/openhire/`,
    content_type: "openhire",
  };
}

export { AUTHOR };
