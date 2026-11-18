import { patchNote, patchNoteEntry } from "@/lib/db/app-schema";
import { KINDS, KIND_LABEL } from "@/lib/patch-notes/commits";

import { countWhere } from "@/lib/admin/sql";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * Patch notes: written by the release workflow for every push to main that
 * passes CI, and opened here to reword a line, add a summary, or hide a
 * release.
 *
 * Created here as well, for a release cut by hand -- but the version is the
 * git tag's name once published, so it is fixed after creation.
 */

/**
 * One version component: 0 to 9999, written without leading zeros.
 *
 * The column's CHECK accepts any run of digits, and the release workflow takes
 * the highest stored version (hidden ones included) as the base for the next
 * tag. A component past 2^53 stops being exact once read as a number, and one
 * of 22 digits prints as `1e+21` -- a next version the CHECK then refuses, so
 * every release fails until the row is removed. Four digits is far beyond any
 * real release and well inside exact arithmetic. Leading zeros are refused
 * because `4.01.0` and `4.1.0` would be two rows naming one tag.
 */
const VERSION_PART = /^(0|[1-9][0-9]{0,3})$/;

/** The sentence for a version `VERSION_PART` refuses, or `null`. */
export function versionProblem(version: string): string | null {
  const parts = version.split(".");
  return parts.length === 3 && parts.every((part) => VERSION_PART.test(part))
    ? null
    : "A version is three numbers from 0 to 9999 separated by dots, like 4.1.0, with no leading zeros.";
}

/** The kinds the column's CHECK constraint allows, spelled out with their headings. */
const KIND_CHOICES = KINDS.map((kind) => ({ value: kind, label: KIND_LABEL[kind] }));

const entryCount = countWhere(patchNoteEntry.patchNoteId, patchNote.id);

export type PatchNoteRow = {
  id: string;
  version: string;
  title: string;
  releasedAt: string;
  isPublished: boolean;
  entries: number;
};

export const patchNoteList: AdminListModel<PatchNoteRow> = {
  key: "patch-note",
  from: patchNote,
  pk: patchNote.id,
  select: {
    id: patchNote.id,
    version: patchNote.version,
    title: patchNote.title,
    releasedAt: patchNote.releasedAt,
    isPublished: patchNote.isPublished,
    entries: entryCount,
  },
  columns: [
    { key: "version", label: "Version", kind: "code", sort: patchNote.version, value: (row) => row.version },
    { key: "title", label: "Title", sort: patchNote.title, value: (row) => row.title },
    { key: "entries", label: "Lines", kind: "number", sort: entryCount, value: (row) => row.entries },
    { key: "is_published", label: "Published", kind: "bool", sort: patchNote.isPublished, value: (row) => row.isPublished },
    { key: "released_at", label: "Released", kind: "datetime", sort: patchNote.releasedAt, value: (row) => row.releasedAt },
  ],
  filters: [{ key: "is_published", label: "Published", kind: "boolean", column: patchNote.isPublished }],
  search: {
    fields: [patchNote.version, patchNote.title, patchNote.summary],
    placeholder: "Search version, title or summary",
  },
  // By date rather than version: the version is text, and "4.10.0" sorts before "4.9.0".
  defaultSort: { key: "released_at", dir: "desc" },
  rowId: (row) => row.id,
};

export const patchNoteForm: AdminFormModel = {
  key: "patch-note",
  from: patchNote,
  pk: patchNote.id,
  label: (values) => `v${String(values.version ?? "")}`,
  deleteWarning: "Every line of this release is deleted with it. Its git tag and GitHub release stay.",
  cascades: [{ table: patchNoteEntry, fk: patchNoteEntry.patchNoteId, pk: patchNoteEntry.id }],
  /*
   * Create only. The version is `readOnly: "afterCreate"`, so on an edit the
   * value `validate` sees is the stored one (`valuesForValidation`), and a row
   * written before this rule must not become unsaveable because of it.
   */
  validate: async (values, { id }) =>
    id === null && typeof values.version === "string" ? versionProblem(values.version) : null,
  fieldsets: [
    {
      fields: [
        {
          name: "version",
          column: patchNote.version,
          label: "Version",
          kind: "text",
          required: true,
          maxLength: 32,
          readOnly: "afterCreate",
          help: "Bare semver, like 4.1.0. Fixed once saved: it is the name of the release's git tag.",
        },
        { name: "title", column: patchNote.title, label: "Title", kind: "text", maxLength: 200 },
        {
          name: "releasedAt",
          column: patchNote.releasedAt,
          label: "Released",
          kind: "datetime",
          required: true,
          help: "Orders the patch notes page, newest first.",
        },
        {
          name: "isPublished",
          column: patchNote.isPublished,
          label: "Published",
          kind: "checkbox",
          help: "Off, the release is left off the patch notes page. Its version still counts, so the next one does not reuse it.",
        },
      ],
    },
    {
      title: "Summary",
      fields: [
        {
          name: "summary",
          column: patchNote.summary,
          label: "Summary",
          kind: "textarea",
          help: "A paragraph above the lines, in your own words. The workflow leaves it empty.",
        },
      ],
    },
  ],
  inlines: [
    {
      name: "entries",
      table: patchNoteEntry,
      pk: patchNoteEntry.id,
      parent: patchNoteEntry.patchNoteId,
      title: "Lines",
      help: "One per commit, grouped on the page by kind.",
      itemLabel: "line",
      orderColumn: patchNoteEntry.position,
      fields: [
        { name: "kind", column: patchNoteEntry.kind, label: "Kind", kind: "select", required: true, choices: KIND_CHOICES },
        { name: "scope", column: patchNoteEntry.scope, label: "Scope", kind: "text", maxLength: 60 },
        { name: "body", column: patchNoteEntry.body, label: "Line", kind: "text", required: true, maxLength: 500 },
        { name: "commitSha", column: patchNoteEntry.commitSha, label: "Commit", kind: "text", maxLength: 40 },
      ],
    },
  ],
};
