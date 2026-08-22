import { alias } from "drizzle-orm/pg-core";

import { LEGAL_DOCUMENT_TYPE_CHOICES } from "@/lib/admin/choices";
import { legalLegaldocument, legalLegalsection } from "@/lib/db/schema";

import { countWhere, lookup } from "@/lib/admin/sql";

import type { AdminFormModel } from "@/lib/admin/form";
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

export const legalDocumentForm: AdminFormModel = {
  key: "legal-document",
  from: legalLegaldocument,
  pk: legalLegaldocument.id,
  label: (values) => String(values.title ?? "Document"),
  deleteWarning: "Every section of this document is deleted with it.",
  cascades: [
    { table: legalLegalsection, fk: legalLegalsection.documentId, pk: legalLegalsection.id },
  ],
  fieldsets: [
    {
      fields: [
        {
          name: "title",
          column: legalLegaldocument.title,
          label: "Title",
          kind: "text",
          required: true,
          maxLength: 200,
        },
        {
          name: "slug",
          column: legalLegaldocument.slug,
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
          column: legalLegaldocument.documentType,
          label: "Type",
          kind: "select",
          required: true,
          choices: LEGAL_DOCUMENT_TYPE_CHOICES,
          maxLength: 20,
        },
        {
          name: "sortOrder",
          column: legalLegaldocument.sortOrder,
          label: "Order",
          kind: "number",
          min: 0,
        },
        {
          name: "isPublished",
          column: legalLegaldocument.isPublished,
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
          column: legalLegaldocument.summary,
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
  from: legalLegalsection,
  pk: legalLegalsection.id,
  label: (values) => String(values.heading ?? "Section"),
  deleteWarning: "Any section nested under this one is deleted with it.",
  cascades: [
    {
      table: legalLegalsection,
      fk: legalLegalsection.parentId,
      pk: legalLegalsection.id,
      selfReference: true,
    },
  ],
  fieldsets: [
    {
      fields: [
        {
          name: "heading",
          column: legalLegalsection.heading,
          label: "Heading",
          kind: "text",
          required: true,
          maxLength: 200,
        },
        {
          name: "documentId",
          column: legalLegalsection.documentId,
          label: "Document",
          kind: "reference",
          required: true,
          reference: {
            table: legalLegaldocument,
            value: legalLegaldocument.id,
            label: legalLegaldocument.title,
          },
        },
        {
          /*
           * Every section is offered as a parent, not only the top-level ones of
           * the same document -- which is looser than Django's inline, where the
           * queryset was filtered to both.
           *
           * The filtering there was possible because the inline knew which
           * document was being edited. This screen edits a section on its own,
           * and the document is a field on the same form that has not been
           * submitted yet, so there is nothing to filter against at render time.
           * Nesting is one level deep by convention rather than by constraint;
           * the renderer walks a single hop and simply ignores anything deeper.
           */
          name: "parentId",
          column: legalLegalsection.parentId,
          label: "Nested under",
          kind: "reference",
          reference: {
            table: legalLegalsection,
            value: legalLegalsection.id,
            label: legalLegalsection.heading,
          },
          help: "Leave blank for a top-level section. Nesting is one level deep.",
        },
        {
          name: "order",
          column: legalLegalsection.order,
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
          column: legalLegalsection.body,
          label: "Body",
          kind: "textarea",
        },
        {
          name: "items",
          column: legalLegalsection.items,
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
   * loop it would follow. Django avoided the question by only offering
   * top-level sections of the same document; this offers all of them, so the
   * one case that cannot work is refused here instead.
   */
  validate: async (values, { id }) =>
    id !== null && values.parentId === id ? "A section cannot be nested under itself." : null,
};
