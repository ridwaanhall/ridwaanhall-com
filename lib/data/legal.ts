import { asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/lib/db/client";
import { legalDocument, legalSection } from "@/lib/db/app-schema";

import { TAGS } from "./tags";

/** Legal documents and their sections, shaped for the page and the JSON-LD. */

export type LegalSection = {
  heading: string;
  body: string;
  items: Record<string, unknown>;
  children?: { heading: string; body: string; items: Record<string, unknown> }[];
};

export type LegalDocument = {
  title: string;
  title_lead: string;
  title_accent: string;
  slug: string;
  document_type: string;
  summary: string;
  last_updated: Date;
  url: string;
  sections: Required<LegalSection>[];
};

/**
 * Split "Privacy Policy" into ("Privacy", "Policy").
 *
 * Page headings accent the final word in indigo. It could live in the component
 * that renders the heading, but it stays in the data layer so the API exposes
 * the same two fields the page uses -- one answer, not two that can disagree.
 */
function splitTitle(title: string): [string, string] {
  const index = title.lastIndexOf(" ");
  if (index === -1) return ["", title];
  return [title.slice(0, index), title.slice(index + 1)];
}

/**
 * The canonical path for a document.
 *
 * The privacy policy keeps its original `/privacy-policy/` URL rather than
 * moving under `/legal/`: it is referenced by the sitemap, the SEO config, the
 * footer of every page and the search modal, and all of those predate the
 * legal-document model. Terms is pinned for the same reason.
 */
function documentUrl(slug: string): string {
  if (slug === "privacy-policy") return "/privacy-policy";
  if (slug === "terms-and-conditions") return "/terms";
  return `/legal/${slug}`;
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  "use cache";
  cacheTag(TAGS.legal);
  cacheLife("days");

  const [documents, sections] = await Promise.all([
    db
      .select()
      .from(legalDocument)
      .where(eq(legalDocument.isPublished, true))
      .orderBy(asc(legalDocument.position), asc(legalDocument.title)),
    db
      .select()
      .from(legalSection)
      .orderBy(asc(legalSection.position), asc(legalSection.heading)),
  ]);

  const byDocument = new Map<string, typeof sections>();
  for (const section of sections) {
    const bucket = byDocument.get(section.documentId);
    if (bucket) bucket.push(section);
    else byDocument.set(section.documentId, [section]);
  }

  return documents.map((document) => {
    const own = byDocument.get(document.id) ?? [];
    const [lead, accent] = splitTitle(document.title);

    const childrenOf = (parentId: string) =>
      own
        .filter((section) => section.parentId === parentId)
        .map((child) => ({
          heading: child.heading,
          body: child.body,
          items: (child.items ?? {}) as Record<string, unknown>,
        }));

    return {
      title: document.title,
      title_lead: lead,
      title_accent: accent,
      slug: document.slug,
      document_type: document.documentType,
      summary: document.summary,
      last_updated: new Date(document.lastUpdated),
      url: documentUrl(document.slug),
      // Only one level of nesting exists -- LegalSection.save() re-parents a
      // grandchild onto its grandparent -- so this never has to recurse.
      sections: own
        .filter((section) => section.parentId === null)
        .map((section) => ({
          heading: section.heading,
          body: section.body,
          items: (section.items ?? {}) as Record<string, unknown>,
          children: childrenOf(section.id),
        })),
    };
  });
}

/**
 * One published document by slug.
 *
 * Resolved against the cached list rather than re-queried: there are two
 * documents and they are already in memory, so a fresh lookup would only buy a
 * round trip. Mirrors how the blog and project detail pages resolve a slug.
 */
export async function getLegalDocument(slug: string): Promise<LegalDocument | null> {
  const documents = await getLegalDocuments();
  return documents.find((document) => document.slug === slug) ?? null;
}
