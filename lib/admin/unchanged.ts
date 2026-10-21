import "server-only";

import { inArray } from "drizzle-orm";

import {
  altFieldName,
  clearFieldName,
  formFieldsFor,
  inlineCountName,
  inlineFieldName,
  INLINE_ID,
  linkFieldName,
  parseFields,
  type AdminFormModel,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { loadInlineRows, type InlineRow } from "@/lib/admin/inlines";
import { loadFormValues } from "@/lib/admin/record";
import { sameFormValues } from "@/lib/admin/same-value";
import { mediaAsset } from "@/lib/db/app-schema";
import { db } from "@/lib/db/client";

/**
 * Whether a save would change anything at all.
 *
 * Pressing Save on a record nobody edited used to write every column and every
 * child row back, and report "Saved." -- which is the wrong answer twice over.
 * It claims something happened, and the write was never quite the identity it
 * looked like: a timestamp lost its seconds, a trailing newline was trimmed,
 * and on the inline editors a row added on the previous save was inserted a
 * second time (see `InlineEditor`). So the save first asks this, and an
 * untouched form writes nothing and says so.
 *
 * Read from the same loaders the form was drawn from, so the two sides are
 * compared in the shape the form was given, and compared by
 * `sameFormValue`'s rules rather than strictly. Anything this cannot account
 * for -- a new inline row, an upload, a link, a cleared image, a field that
 * does not parse -- is a change, because a false "changed" costs one redundant
 * write and a false "unchanged" loses an edit.
 */

export type StoredRecord = { values: FormValues; inlines: Record<string, InlineRow[]> };

/** The record as its form was drawn: own fields, many-to-manys, and inline rows. */
export async function loadStoredRecord(model: AdminFormModel, id: string): Promise<StoredRecord | null> {
  const values = await loadFormValues(model, id);
  if (!values) return null;
  const inlines = Object.fromEntries(
    await Promise.all(
      (model.inlines ?? []).map(async (inline) => [inline.name, await loadInlineRows(inline, id)] as const),
    ),
  );
  return { values, inlines };
}

/** The fields whose values are compared: written, and not bytes. */
const comparable = (fields: FormField[]) =>
  fields.filter((field) => !field.readOnly && field.kind !== "image");

export async function changesNothing(
  model: AdminFormModel,
  id: string,
  stored: StoredRecord,
  /** What the record's own fields parsed to, sanitised, image fields excluded. */
  submitted: FormValues,
  data: FormData,
  /** Image descriptions the record's own fields carried, by storage key. */
  recordAlts: Record<string, string>,
): Promise<boolean> {
  if (!sameFormValues(comparable(formFieldsFor(model, id)), stored.values, submitted)) return false;

  const alts: Record<string, string> = { ...recordAlts };

  for (const inline of model.inlines ?? []) {
    const storedRows = stored.inlines[inline.name] ?? [];
    const count = Number(data.get(inlineCountName(inline.name)) ?? 0);
    if (!Number.isInteger(count) || count < 0) return false;

    const rows: { id: string; values: FormValues }[] = [];
    for (let index = 0; index < count; index++) {
      const marker = inlineFieldName(inline.name, index, INLINE_ID);
      if (!data.has(marker)) continue;
      const rowId = String(data.get(marker) ?? "");
      // A row with no id is one the editor added.
      if (!rowId) return false;

      const prefix = `${inline.name}:${index}:`;
      const parsed = parseFields(inline.fields, data, prefix);
      if (!parsed.ok) return false;

      const storedRow = storedRows.find((row) => row.__id === rowId);
      for (const field of inline.fields) {
        if (field.kind !== "image") continue;
        const name = `${prefix}${field.name}`;
        const file = data.get(name);
        const link = data.get(linkFieldName(name));
        if (file instanceof File && file.size > 0) return false;
        if (data.get(clearFieldName(name)) !== null) return false;
        if (typeof link === "string" && link.trim()) return false;
        const alt = data.get(altFieldName(name));
        const key = storedRow?.[field.name];
        if (typeof alt === "string" && typeof key === "string" && key) alts[key] = alt.trim();
      }
      rows.push({ id: rowId, values: parsed.values });
    }

    if (rows.length !== storedRows.length) return false;
    const fields = comparable(inline.fields);
    for (const [index, row] of rows.entries()) {
      const storedRow = storedRows[index];
      // Same rows, same order -- a move is a change even when no text is.
      if (row.id !== storedRow.__id) return false;
      if (!sameFormValues(fields, storedRow, row.values)) return false;
    }
  }

  const keys = Object.keys(alts).filter(Boolean);
  if (keys.length === 0) return true;
  const described = await db
    .select({ key: mediaAsset.storageKey, alt: mediaAsset.alt })
    .from(mediaAsset)
    .where(inArray(mediaAsset.storageKey, keys));
  // A key with no asset row has nothing to describe; `setImageAlts` would
  // update no row for it either.
  return described.every((row) => row.alt === alts[row.key]);
}
