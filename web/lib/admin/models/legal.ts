import { alias } from "drizzle-orm/pg-core";

import { LEGAL_DOCUMENT_TYPE_CHOICES } from "@/lib/admin/choices";
import { legalLegaldocument, legalLegalsection } from "@/lib/db/schema";

import { countWhere, lookup } from "@/lib/admin/sql";

import type { AdminListModel } from "@/lib/admin/list";

/** The two `legal` changelists, from `apps/legal/admin.py`. */

// --- LegalDocument -----------------------------------------------------------

const documentTypeLabel = (value: string) =>
  LEGAL_DOCUMENT_TYPE_CHOICES.find((choice) => choice.value === value)?.label ?? value;

/** How many sections hang off this document -- Django's `section_count`. */
const sectionCount = countWhere(legalLegalsection.documentId, legalLegaldocument.id);

export type LegalDocumentRow = {
  id: number;
  title: string;
  documentType: string;
  slug: string;
  isPublished: boolean;
  sortOrder: number;
  sections: number;
  lastUpdated: string;
};

export const legalDocumentList: AdminListModel<LegalDocumentRow> = {
  key: "legal-document",
  from: legalLegaldocument,
  pk: legalLegaldocument.id,
  select: {
    id: legalLegaldocument.id,
    title: legalLegaldocument.title,
    documentType: legalLegaldocument.documentType,
    slug: legalLegaldocument.slug,
    isPublished: legalLegaldocument.isPublished,
    sortOrder: legalLegaldocument.sortOrder,
    sections: sectionCount,
    lastUpdated: legalLegaldocument.lastUpdated,
  },
  columns: [
    { key: "title", label: "Title", sort: legalLegaldocument.title, value: (row) => row.title },
    {
      key: "document_type",
      label: "Type",
      kind: "muted",
      sort: legalLegaldocument.documentType,
      value: (row) => documentTypeLabel(row.documentType),
    },
    { key: "slug", label: "Slug", kind: "code", sort: legalLegaldocument.slug, value: (row) => row.slug },
    {
      key: "is_published",
      label: "Published",
      kind: "bool",
      sort: legalLegaldocument.isPublished,
      value: (row) => row.isPublished,
    },
    // `sort_order` drives the ordering but was not in `list_display`, which
    // would leave the list unsortable by its own order. It gets a column.
    {
      key: "sort_order",
      label: "Order",
      kind: "number",
      sort: legalLegaldocument.sortOrder,
      value: (row) => row.sortOrder,
    },
    { key: "sections", label: "Sections", kind: "number", sort: sectionCount, value: (row) => row.sections },
    {
      key: "last_updated",
      label: "Updated",
      kind: "datetime",
      sort: legalLegaldocument.lastUpdated,
      value: (row) => row.lastUpdated,
    },
  ],
  filters: [
    {
      key: "document_type",
      label: "Type",
      kind: "choice",
      column: legalLegaldocument.documentType,
      choices: LEGAL_DOCUMENT_TYPE_CHOICES,
    },
    { key: "is_published", label: "Published", kind: "boolean", column: legalLegaldocument.isPublished },
  ],
  search: {
    fields: [legalLegaldocument.title, legalLegaldocument.slug, legalLegaldocument.summary],
    placeholder: "Search title, slug or summary",
  },
  // `ordering = ["sort_order", "title"]`; only the first is expressible as one
  // key, and with two documents the title tiebreak never comes up.
  defaultSort: { key: "sort_order", dir: "asc" },
  rowId: (row) => row.id,
};

// --- LegalSection ------------------------------------------------------------

const documentTitle = lookup<string>(
  legalLegaldocument.title,
  legalLegaldocument.id,
  legalLegalsection.documentId,
);

/**
 * The parent section's heading.
 *
 * Nesting is deliberately one level deep -- `LegalSectionInline` only ever
 * offers top-level sections of the same document as a parent -- so this never
 * needs to walk further than one hop.
 */
const parentSection = alias(legalLegalsection, "parent_section");
const parentHeading = lookup<string>(
  parentSection.heading,
  parentSection.id,
  legalLegalsection.parentId,
);

export type LegalSectionRow = {
  id: number;
  heading: string;
  document: string;
  parent: string | null;
  order: number;
};

export const legalSectionList: AdminListModel<LegalSectionRow> = {
  key: "legal-section",
  from: legalLegalsection,
  pk: legalLegalsection.id,
  select: {
    id: legalLegalsection.id,
    heading: legalLegalsection.heading,
    document: documentTitle,
    parent: parentHeading,
    order: legalLegalsection.order,
  },
  columns: [
    { key: "heading", label: "Heading", sort: legalLegalsection.heading, value: (row) => row.heading },
    { key: "document", label: "Document", kind: "muted", sort: documentTitle, value: (row) => row.document },
    { key: "parent", label: "Parent", kind: "muted", sort: parentHeading, value: (row) => row.parent },
    { key: "order", label: "Order", kind: "number", sort: legalLegalsection.order, value: (row) => row.order },
  ],
  filters: [
    {
      key: "document",
      label: "Document",
      kind: "choice",
      column: legalLegalsection.documentId,
      choices: { table: legalLegaldocument, value: legalLegaldocument.id, label: legalLegaldocument.title },
    },
  ],
  search: {
    fields: [legalLegalsection.heading, legalLegalsection.body],
    placeholder: "Search heading or body",
  },
  // `ordering = ["order", "id"]`. Sections are edited through their document's
  // inline; this list exists so they can be searched across documents, which is
  // exactly why Django registered the model separately as well.
  defaultSort: { key: "order", dir: "asc" },
  rowId: (row) => row.id,
};
