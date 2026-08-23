import { alias } from "drizzle-orm/pg-core";

import { LEGAL_DOCUMENT_TYPE_CHOICES } from "@/lib/admin/choices";
import { legalDocument, legalSection } from "@/lib/db/app-schema";

import { countWhere, lookup } from "@/lib/admin/sql";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/** The two `legal` changelists: documents, and the sections inside them. */

// --- LegalDocument -----------------------------------------------------------

const documentTypeLabel = (value: string) =>
  LEGAL_DOCUMENT_TYPE_CHOICES.find((choice) => choice.value === value)?.label ?? value;

/** How many sections hang off this document. */
const sectionCount = countWhere(legalSection.documentId, legalDocument.id);

export type LegalDocumentRow = {
  id: string;
  title: string;
  documentType: string;
  slug: string;
  isPublished: boolean;
  position: number;
  sections: number;
  lastUpdated: string;
};

export const legalDocumentList: AdminListModel<LegalDocumentRow> = {
  key: "legal-document",
  from: legalDocument,
  pk: legalDocument.id,
  select: {
    id: legalDocument.id,
    title: legalDocument.title,
    documentType: legalDocument.documentType,
    slug: legalDocument.slug,
    isPublished: legalDocument.isPublished,
    position: legalDocument.position,
    sections: sectionCount,
    lastUpdated: legalDocument.lastUpdated,
  },
  columns: [
    { key: "title", label: "Title", sort: legalDocument.title, value: (row) => row.title },
    {
      key: "document_type",
      label: "Type",
      kind: "muted",
      sort: legalDocument.documentType,
      value: (row) => documentTypeLabel(row.documentType),
    },
    { key: "slug", label: "Slug", kind: "code", sort: legalDocument.slug, value: (row) => row.slug },
    {
      key: "is_published",
      label: "Published",
      kind: "bool",
      sort: legalDocument.isPublished,
      value: (row) => row.isPublished,
    },
    // `sort_order` drives the ordering but was not in `list_display`, which
    // would leave the list unsortable by its own order. It gets a column.
    {
      key: "sort_order",
      label: "Order",
      kind: "number",
      sort: legalDocument.position,
      value: (row) => row.position,
    },
    { key: "sections", label: "Sections", kind: "number", sort: sectionCount, value: (row) => row.sections },
    {
      key: "last_updated",
      label: "Updated",
      kind: "datetime",
      sort: legalDocument.lastUpdated,
      value: (row) => row.lastUpdated,
    },
  ],
  filters: [
    {
      key: "document_type",
      label: "Type",
      kind: "choice",
      column: legalDocument.documentType,
      choices: LEGAL_DOCUMENT_TYPE_CHOICES,
    },
    { key: "is_published", label: "Published", kind: "boolean", column: legalDocument.isPublished },
  ],
  search: {
    fields: [legalDocument.title, legalDocument.slug, legalDocument.summary],
    placeholder: "Search title, slug or summary",
  },
  // `ordering = ["sort_order", "title"]`; only the first is expressible as one
  // key, and with two documents the title tiebreak never comes up.
  defaultSort: { key: "sort_order", dir: "asc" },
  rowId: (row) => row.id,
};

// --- LegalSection ------------------------------------------------------------

const documentTitle = lookup<string>(
  legalDocument.title,
  legalDocument.id,
  legalSection.documentId,
);

/**
 * The parent section's heading.
 *
 * Nesting is deliberately one level deep -- `LegalSectionInline` only ever
 * offers top-level sections of the same document as a parent -- so this never
 * needs to walk further than one hop.
 */
const parentSection = alias(legalSection, "parent_section");
const parentHeading = lookup<string>(
  parentSection.heading,
  parentSection.id,
  legalSection.parentId,
);

export type LegalSectionRow = {
  id: string;
  heading: string;
  document: string;
  parent: string | null;
  order: number;
};

export const legalSectionList: AdminListModel<LegalSectionRow> = {
  key: "legal-section",
  from: legalSection,
  pk: legalSection.id,
  select: {
    id: legalSection.id,
    heading: legalSection.heading,
    document: documentTitle,
    parent: parentHeading,
    order: legalSection.position,
  },
  columns: [
    { key: "heading", label: "Heading", sort: legalSection.heading, value: (row) => row.heading },
    { key: "document", label: "Document", kind: "muted", sort: documentTitle, value: (row) => row.document },
    { key: "parent", label: "Parent", kind: "muted", sort: parentHeading, value: (row) => row.parent },
    { key: "order", label: "Order", kind: "number", sort: legalSection.position, value: (row) => row.order },
  ],
  filters: [
    {
      key: "document",
      label: "Document",
      kind: "choice",
      column: legalSection.documentId,
      choices: { table: legalDocument, value: legalDocument.id, label: legalDocument.title },
    },
  ],
  search: {
    fields: [legalSection.heading, legalSection.body],
    placeholder: "Search heading or body",
  },
  // Sections are edited through their document's inline; this list exists only
  // so they can be searched across documents, which the inline cannot do.
  defaultSort: { key: "order", dir: "asc" },
  rowId: (row) => row.id,
};

export const legalDocumentForm: AdminFormModel = {
  key: "legal-document",
  from: legalDocument,
  pk: legalDocument.id,
  label: (values) => String(values.title ?? "Document"),
  deleteWarning: "Every section of this document is deleted with it.",
  cascades: [
    { table: legalSection, fk: legalSection.documentId, pk: legalSection.id },
  ],
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: legalDocument.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 200,
        },
        {
          name: "slug",
          column: legalDocument.slug,
          label: "Slug",
          kind: "slug",
          maxLength: 200,
          slugFrom: "title",
          // The privacy policy is served from `/privacy-policy` and the terms
          // from `/terms`, both of which are already indexed. Changing a slug
          // changes the canonical URL these documents live at.
          help: "Part of the published URL. Changing it moves the document.",
        },
        {
          name: "documentType",
          column: legalDocument.documentType,
          label: "Type",
          kind: "select",
          required: true,
          choices: LEGAL_DOCUMENT_TYPE_CHOICES,
          maxLength: 20,
        },
        {
          name: "sortOrder",
          column: legalDocument.position,
          label: "Order",
          kind: "number",
          min: 0,
        },
        {
          name: "isPublished",
          column: legalDocument.isPublished,
          label: "Published",
          kind: "checkbox",
          help: "An unpublished document 404s and stays out of the sitemap.",
        },
      ],
    },
    {
      title: "Intro",
      fields: [
        {
          name: "summary",
          column: legalDocument.summary,
          label: "Summary",
          kind: "textarea",
          help: "Shown under the title, and used as the page's meta description.",
        },
      ],
    },
  ],
};

export const legalSectionForm: AdminFormModel = {
  key: "legal-section",
  from: legalSection,
  pk: legalSection.id,
  label: (values) => String(values.heading ?? "Section"),
  deleteWarning: "Any section nested under this one is deleted with it.",
  cascades: [
    {
      table: legalSection,
      fk: legalSection.parentId,
      pk: legalSection.id,
      selfReference: true,
    },
  ],
  fieldsets: [
    {
      fields: [
        {
          name: "heading",
          column: legalSection.heading,
          label: "Heading",
          kind: "text",
          required: true,
          maxLength: 200,
        },
        {
          name: "documentId",
          column: legalSection.documentId,
          label: "Document",
          kind: "reference",
          required: true,
          reference: {
            table: legalDocument,
            value: legalDocument.id,
            label: legalDocument.title,
          },
        },
        {
          /*
           * Every section is offered as a parent, not only the top-level ones
           * of the same document.
           *
           * Filtering the list would need to know which document is being
           * edited. This screen edits a section on its own, and the document is
           * a field on the same form that has not been
           * submitted yet, so there is nothing to filter against at render time.
           * Nesting is one level deep by convention rather than by constraint;
           * the renderer walks a single hop and simply ignores anything deeper.
           */
          name: "parentId",
          column: legalSection.parentId,
          label: "Nested under",
          kind: "reference",
          reference: {
            table: legalSection,
            value: legalSection.id,
            label: legalSection.heading,
          },
          help: "Leave blank for a top-level section. Nesting is one level deep.",
        },
        {
          name: "order",
          column: legalSection.position,
          label: "Order",
          kind: "number",
          min: 0,
        },
      ],
    },
    {
      title: "Body",
      fields: [
        {
          name: "body",
          column: legalSection.body,
          label: "Body",
          kind: "textarea",
        },
        {
          name: "items",
          column: legalSection.items,
          label: "Definitions",
          kind: "key-value",
          keyLabel: "Term",
          valueLabel: "Meaning",
          help: "Rendered as a definition list under the body.",
        },
      ],
    },
  ],
  /**
   * A section cannot be its own parent.
   *
   * The renderer walks from a section to its parent, so a self-reference is a
   * loop it would follow. Every section is offered as a parent (see above), so
   * the one case that cannot work is refused here instead.
   */
  validate: async (values, { id }) =>
    id !== null && values.parentId === id ? "A section cannot be nested under itself." : null,
};
