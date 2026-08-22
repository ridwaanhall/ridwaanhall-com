import type { AboutData } from "@/lib/data/about";
import type { BlogPost, BlogSummary, Project, ProjectSummary } from "@/lib/data/content";
import type { LegalDocument } from "@/lib/data/legal";

import { SITE_URL } from "./config";
import {
  blogPostingSchema,
  blogSchema,
  breadcrumbSchema,
  collectionPageSchema,
  contactPageSchema,
  legalDocumentSchema,
  personSchema,
  privacyPolicySchema,
  profilePageSchema,
  softwareSourceCodeSchema,
  websiteSchema,
  type JsonLd,
} from "./schema";

/**
 * Which structured-data blocks each page carries.
 *
 * A port of the `schemas` list `SEOManager` attached per page type, kept
 * one-to-one so the emitted JSON-LD matches what is indexed today. Keeping this
 * separate from `schema.ts` means the generators stay independently testable
 * and the per-page composition is readable in one place.
 */

const HOME = { name: "Home", url: SITE_URL };

export async function homepageSchemas(about: AboutData): Promise<JsonLd[]> {
  return [websiteSchema(), await personSchema(about)];
}

export async function dashboardSchemas(about: AboutData): Promise<JsonLd[]> {
  return [
    await personSchema(about),
    breadcrumbSchema([HOME, { name: "Dashboard", url: `${SITE_URL}/dashboard/` }]),
  ];
}

export function projectsListSchemas(
  about: AboutData,
  projects: (Project | ProjectSummary)[],
): JsonLd[] {
  return [
    collectionPageSchema(projects, about, "projects"),
    breadcrumbSchema([HOME, { name: "Projects", url: `${SITE_URL}/projects/` }]),
  ];
}

export function projectDetailSchemas(about: AboutData, project: Project): JsonLd[] {
  return [
    softwareSourceCodeSchema(project, about),
    breadcrumbSchema([
      HOME,
      { name: "Projects", url: `${SITE_URL}/projects/` },
      { name: project.title, url: `${SITE_URL}/projects/${project.slug}` },
    ]),
  ];
}

export function blogListSchemas(about: AboutData, blogs: (BlogPost | BlogSummary)[]): JsonLd[] {
  return [
    blogSchema(about, blogs),
    collectionPageSchema(blogs, about, "blog"),
    breadcrumbSchema([HOME, { name: "Blog", url: `${SITE_URL}/blog/` }]),
  ];
}

export function blogDetailSchemas(about: AboutData, blog: BlogPost): JsonLd[] {
  return [
    blogPostingSchema(blog, about),
    breadcrumbSchema([
      HOME,
      { name: "Blog", url: `${SITE_URL}/blog/` },
      { name: blog.title, url: `${SITE_URL}/blog/${blog.slug}` },
    ]),
  ];
}

export async function aboutSchemas(about: AboutData): Promise<JsonLd[]> {
  return [
    await profilePageSchema(about),
    breadcrumbSchema([HOME, { name: "About Me", url: `${SITE_URL}/about/` }]),
  ];
}

export function contactSchemas(about: AboutData): JsonLd[] {
  return [
    contactPageSchema(about),
    breadcrumbSchema([HOME, { name: "Contact Me", url: `${SITE_URL}/contact/` }]),
  ];
}

export function guestbookSchemas(): JsonLd[] {
  return [breadcrumbSchema([HOME, { name: "Guestbook", url: `${SITE_URL}/guestbook/` }])];
}

export function openhireSchemas(): JsonLd[] {
  return [breadcrumbSchema([HOME, { name: "Open Hire", url: `${SITE_URL}/openhire/` }])];
}

export function privacyPolicySchemas(about: AboutData, document?: LegalDocument | null): JsonLd[] {
  return [
    privacyPolicySchema(about, document),
    breadcrumbSchema([HOME, { name: "Privacy Policy", url: `${SITE_URL}/privacy-policy/` }]),
  ];
}

export function legalDocumentSchemas(about: AboutData, document: LegalDocument): JsonLd[] {
  return [
    legalDocumentSchema(about, document),
    breadcrumbSchema([HOME, { name: document.title, url: `${SITE_URL}${document.url}` }]),
  ];
}
