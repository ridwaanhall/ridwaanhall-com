import "server-only";

import { asc, eq, getTableColumns, inArray } from "drizzle-orm";

import {
  inlineCountName,
  inlineFieldName,
  INLINE_ID,
  parseFields,
  type AdminInline,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { db } from "@/lib/db/client";

/**
 * Loading, diffing and writing the child rows of a record.
 *
 * Django's inlines were formsets: the whole set posts on the parent's form, and
 * saving reconciles it against what is stored. That shape is kept because the
 * alternative -- editing children on their own screens -- turns adding three
 * donate links into three round trips through a list.
 *
 * **Rows are matched by primary key, never by position.** A row the editor
 * added has no id and is inserted; a row whose id is missing from the submission
 * was removed and is deleted. Position carries only the order, and only for an
 * inline that declares a column to put it in.
 */

export type InlineRow = FormValues & { __id: number | null };

/** The child rows of one parent, in the order the inline declares. */
export async function loadInlineRows(
  inline: AdminInline,
  parentId: number,
): Promise<InlineRow[]> {
  const shape = Object.fromEntries(inline.fields.map((field) => [field.name, field.column]));
  const rows = (await db
    .select({ ...shape, [INLINE_ID]: inline.pk })
    .from(inline.table)
    .where(eq(inline.parent, parentId))
    .orderBy(asc(inline.orderBy ?? inline.orderColumn ?? inline.pk))) as Record<string, unknown>[];

  return rows.map((row) => {
    const values: InlineRow = { __id: Number(row[INLINE_ID]) };
    for (const field of inline.fields) {
      const raw = row[field.name];
      values[field.name] = toFormValue(field, raw);
    }
    return values;
  });
}

/** One blank row, for the editor's "add" button. */
export function blankInlineRow(inline: AdminInline): InlineRow {
  const values: InlineRow = { __id: null };
  for (const field of inline.fields) {
    values[field.name] = field.kind === "checkbox" ? false : field.kind === "string-list" ? [] : null;
  }
  return values;
}

function toFormValue(field: FormField, raw: unknown): FormValues[string] {
  if (raw === null || raw === undefined) return field.kind === "checkbox" ? false : null;
  if (field.kind === "checkbox") return Boolean(raw);
  if (Array.isArray(raw)) return raw.filter((entry): entry is string => typeof entry === "string");
  if (field.kind === "key-value" && typeof raw === "object") {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([key, entry]) => [key, String(entry)]),
    );
  }
  if (typeof raw === "number" || typeof raw === "string") return raw;
  if (raw instanceof Date) return raw.toISOString();
  return String(raw);
}

export type InlineResult = { ok: true } | { ok: false; errors: Record<string, string> };

/**
 * Reconcile every inline of a record against what was submitted.
 *
 * Deletes go first so a row removed in the same save cannot collide with a new
 * one on a unique constraint -- `ProfileSkillHighlight` is unique on
 * `(profile, skill)`, so swapping which skill sits in a slot would otherwise
 * fail against the row being replaced.
 */
export async function saveInlines(
  inlines: AdminInline[],
  data: FormData,
  parentId: number,
): Promise<InlineResult> {
  const errors: Record<string, string> = {};
  const work: { inline: AdminInline; rows: { id: number | null; values: FormValues }[] }[] = [];

  for (const inline of inlines) {
    const count = Number(data.get(inlineCountName(inline.name)) ?? 0);
    if (!Number.isInteger(count) || count < 0 || count > 200) continue;

    const rows: { id: number | null; values: FormValues }[] = [];
    for (let index = 0; index < count; index++) {
      const prefix = `${inline.name}:${index}:`;
      // A row the editor removed leaves a gap in the numbering rather than
      // renumbering everything below it, so an absent id marker means "not
      // submitted", not "new".
      if (!data.has(inlineFieldName(inline.name, index, INLINE_ID))) continue;

      const parsed = parseFields(inline.fields, data, prefix);
      if (!parsed.ok) {
        for (const [field, message] of Object.entries(parsed.errors)) {
          errors[`${prefix}${field}`] = message;
        }
        continue;
      }

      const rawId = String(data.get(inlineFieldName(inline.name, index, INLINE_ID)) ?? "");
      const id = rawId ? Number(rawId) : null;
      if (id !== null && (!Number.isInteger(id) || id <= 0)) continue;
      rows.push({ id, values: parsed.values });
    }

    work.push({ inline, rows });
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  for (const { inline, rows } of work) {
    const existing = await db
      .select({ id: inline.pk })
      .from(inline.table)
      .where(eq(inline.parent, parentId));

    const kept = new Set(rows.map((row) => row.id).filter((id): id is number => id !== null));
    const removed = existing.map((row) => Number(row.id)).filter((id) => !kept.has(id));
    if (removed.length > 0) {
      await db.delete(inline.table).where(inArray(inline.pk, removed));
    }

    const columns = Object.entries(getTableColumns(inline.table));
    const keyFor = (field: FormField) => {
      const entry = columns.find(([, column]) => column === field.column);
      if (!entry) {
        throw new Error(`Inline "${inline.name}" declares a field whose column is not on its table.`);
      }
      return entry[0];
    };
    const parentKey = columns.find(([, column]) => column === inline.parent)?.[0];
    const orderKey = inline.orderColumn
      ? columns.find(([, column]) => column === inline.orderColumn)?.[0]
      : undefined;

    for (const [index, row] of rows.entries()) {
      const payload: Record<string, unknown> = {};
      for (const field of inline.fields) {
        if (field.readOnly) continue;
        if (!(field.name in row.values)) continue;
        payload[keyFor(field)] = row.values[field.name];
      }
      // Position is the order, so a moved row needs no input of its own.
      if (orderKey) payload[orderKey] = index;

      if (row.id === null) {
        if (parentKey) payload[parentKey] = parentId;
        await db.insert(inline.table).values(payload);
      } else {
        await db.update(inline.table).set(payload).where(eq(inline.pk, row.id));
      }
    }
  }

  return { ok: true };
}
