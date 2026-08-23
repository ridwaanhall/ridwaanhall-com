import "server-only";

import { and, asc, eq, getTableColumns, inArray } from "drizzle-orm";

import {
  inlineCountName,
  inlineFieldName,
  INLINE_ID,
  parseFields,
  type AdminInline,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { applyImageFields, imageFields } from "@/lib/admin/images";
import { db } from "@/lib/db/client";
import { isUuid } from "@/lib/utils/uuid";

/**
 * Loading, diffing and writing the child rows of a record.
 *
 * The whole set posts on the parent's form and saving reconciles it against
 * what is stored. The alternative -- editing children on their own screens --
 * turns adding three donate links into three round trips through a list.
 *
 * **Rows are matched by primary key, never by position.** A row the editor
 * added has no id and is inserted; a row whose id is missing from the submission
 * was removed and is deleted. Position carries only the order, and only for an
 * inline that declares a column to put it in.
 */

export type InlineRow = FormValues & { __id: string | null };


/**
 * Which rows belong to this inline.
 *
 * The parent key, and a `kind` too where the child table holds more than one
 * list -- see `scope` on `AdminInline`. Written once so reading, counting and
 * deleting cannot disagree about it: an inline that loaded one scope and
 * deleted another would quietly take the neighbouring list with it.
 */
/** An inline table's `position` column, where it has one. */
function positionColumn(inline: AdminInline) {
  return Object.entries(getTableColumns(inline.table)).find(([name]) => name === "position")?.[1];
}

function inlineWhere(inline: AdminInline, parentId: string) {
  const parent = eq(inline.parent, parentId);
  return inline.scope ? and(parent, eq(inline.scope.column, inline.scope.value)) : parent;
}

/** The child rows of one parent, in the order the inline declares. */
export async function loadInlineRows(
  inline: AdminInline,
  parentId: string,
): Promise<InlineRow[]> {
  const shape = Object.fromEntries(inline.fields.map((field) => [field.name, field.column]));
  const rows = (await db
    .select({ ...shape, [INLINE_ID]: inline.pk })
    .from(inline.table)
    .where(inlineWhere(inline, parentId))
    /*
     * Two keys, and the second one matters. Ordering by a nullable column --
     * the journey orders by `occurred_at` -- leaves every row that has no value
     * tied, and Postgres is free to return ties in any order. That was invisible
     * while keys were serial: rows came back in insertion order because that is
     * the order they were on disk, and it happened to be right.
     *
     * A uuid key has no such accident. `position` is the declared fallback and
     * carries the order rows were entered in, so a set of undated steps stays
     * put instead of shuffling between two loads of the same form.
     */
    .orderBy(
      asc(inline.orderBy ?? inline.orderColumn ?? inline.pk),
      asc(inline.orderColumn ?? positionColumn(inline) ?? inline.pk),
    )) as Record<string, unknown>[];

  return rows.map((row) => {
    const values: InlineRow = { __id: String(row[INLINE_ID]) };
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

export type InlineResult =
  /** Keys the write orphaned, for the caller to hand to `deleteUnreferenced`. */
  | { ok: true; stale: string[] }
  | { ok: false; errors: Record<string, string> };

/**
 * Every image key a record's child rows currently hold.
 *
 * Needed when the parent is deleted: the children go with it, so their files
 * become candidates for cleanup -- subject, as always, to nothing else naming
 * them.
 */
export async function inlineImageKeys(
  model: { inlines?: AdminInline[] },
  parentId: string,
): Promise<string[]> {
  const keys: string[] = [];
  for (const inline of model.inlines ?? []) {
    const pictures = imageFields(inline.fields);
    if (pictures.length === 0) continue;
    const shape = Object.fromEntries(pictures.map((field) => [field.name, field.column]));
    const rows = await db.select(shape).from(inline.table).where(inlineWhere(inline, parentId));
    for (const row of rows) {
      for (const value of Object.values(row)) if (typeof value === "string" && value) keys.push(value);
    }
  }
  return keys;
}

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
  parentId: string,
): Promise<InlineResult> {
  const errors: Record<string, string> = {};
  const stale: string[] = [];
  const work: { inline: AdminInline; rows: { id: string | null; values: FormValues }[] }[] = [];

  for (const inline of inlines) {
    const count = Number(data.get(inlineCountName(inline.name)) ?? 0);
    if (!Number.isInteger(count) || count < 0 || count > 200) continue;

    const rows: { id: string | null; values: FormValues }[] = [];
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
      const id = rawId ? String(rawId) : null;
      if (id !== null && !isUuid(id)) continue;

      // Uploads for this row, handled exactly as the parent's are: the field
      // names are prefixed, and the rest is the same three cases.
      const pictures = imageFields(inline.fields);
      let images: FormValues = {};
      if (pictures.length > 0) {
        const current = id === null ? {} : await currentInlineImages(inline, pictures, id);
        const applied = await applyImageFields(pictures, data, current, prefix);
        if (!applied.ok) {
          Object.assign(errors, applied.errors);
          continue;
        }
        images = applied.values;
        stale.push(...applied.stale);
      }

      rows.push({ id, values: { ...parsed.values, ...images } });
    }

    work.push({ inline, rows });
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  for (const { inline, rows } of work) {
    const existing = await db
      .select({ id: inline.pk })
      .from(inline.table)
      .where(inlineWhere(inline, parentId));

    const kept = new Set(rows.map((row) => row.id).filter((id): id is string => id !== null));
    const removed = existing.map((row) => String(row.id)).filter((id) => !kept.has(id));
    if (removed.length > 0) {
      // Their files become candidates too, gathered before the rows go.
      const pictures = imageFields(inline.fields);
      if (pictures.length > 0) {
        const shape = Object.fromEntries(pictures.map((field) => [field.name, field.column]));
        const going = await db.select(shape).from(inline.table).where(inArray(inline.pk, removed));
        for (const row of going) {
          for (const value of Object.values(row)) {
            if (typeof value === "string" && value) stale.push(value);
          }
        }
      }
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
    /*
     * Where the order goes. An inline that declares `orderColumn` offers move
     * buttons and stores what they produce.
     *
     * An inline that does not still stamps a `position` if its table has one,
     * and that is not the same thing: nothing is offering to reorder these, but
     * the rows do need to come back the way they went in. The journey sorts by
     * `occurred_at`, which is nullable, and a set of undated steps is a set of
     * ties -- ordered by whatever Postgres feels like, once serial keys stopped
     * supplying an accidental insertion order. This is the tiebreak
     * `loadInlineRows` reads.
     */
    const orderKey = inline.orderColumn
      ? columns.find(([, column]) => column === inline.orderColumn)?.[0]
      : columns.find(([name]) => name === "position")?.[0];

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
        // A scoped inline stamps its own kind, so a new row lands in the list
        // that is being edited rather than in whichever one sorts first.
        if (inline.scope) {
          const columns = Object.entries(getTableColumns(inline.table));
          const key = columns.find(([, column]) => column === inline.scope?.column)?.[0];
          if (key) payload[key] = inline.scope.value;
        }
        await db.insert(inline.table).values(payload);
      } else {
        await db.update(inline.table).set(payload).where(eq(inline.pk, row.id));
      }
    }
  }

  return { ok: true, stale };
}

/** What one child row currently stores for each of its image fields. */
async function currentInlineImages(
  inline: AdminInline,
  fields: FormField[],
  id: string,
): Promise<Record<string, string>> {
  const shape = Object.fromEntries(fields.map((field) => [field.name, field.column]));
  const [row] = await db.select(shape).from(inline.table).where(eq(inline.pk, id)).limit(1);
  if (!row) return {};
  return Object.fromEntries(
    Object.entries(row).map(([name, value]) => [name, typeof value === "string" ? value : ""]),
  );
}
