import "server-only";

import {
  clearFieldName,
  MAX_UPLOAD_BYTES,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { objectKeyFor } from "@/lib/storage/keys";
import { putObject } from "@/lib/storage/objects";

/**
 * Turning an `image` field's submission into a stored key.
 *
 * Shared by the record and its inlines rather than living in the save action,
 * because a gallery row has exactly the same three cases as the record it hangs
 * off -- and the third is the one that is easy to get wrong.
 */

export type ImageOutcome =
  | { ok: true; values: FormValues; stale: string[] }
  | { ok: false; errors: Record<string, string> };

/**
 * Upload whatever was sent, and say what the old keys were.
 *
 * Three cases:
 *
 * 1. a file was chosen -- upload it and store the key;
 * 2. the clear box was ticked -- empty the column;
 * 3. **neither -- the field was not edited**, so it is left out of the values
 *    entirely and the caller never writes it. Treating an empty file input as
 *    "make it empty" would blank the image every time any other field on the
 *    record was saved.
 *
 * The old key is returned as `stale`, never deleted here: deleting before the
 * write would take the file away from a save that then failed, and deleting
 * without the reference check would take it away from the other rows that share
 * it -- one author photo is named by twenty-one.
 */
export async function applyImageFields(
  fields: FormField[],
  data: FormData,
  current: Record<string, string>,
  prefix = "",
): Promise<ImageOutcome> {
  const values: FormValues = {};
  const errors: Record<string, string> = {};
  const stale: string[] = [];

  for (const field of fields) {
    const name = `${prefix}${field.name}`;
    const uploaded = data.get(name);
    const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    const cleared = data.get(clearFieldName(name)) !== null;
    const existing = current[field.name] ?? "";

    if (file) {
      if (file.size > MAX_UPLOAD_BYTES) {
        errors[name] = `${field.label} is ${(file.size / 1024 / 1024).toFixed(1)}MB; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`;
        continue;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const keyed = objectKeyFor(field.prefix ?? "profile", file.name, bytes);
      if (!keyed.ok) {
        errors[name] = keyed.error;
        continue;
      }

      try {
        await putObject(keyed.key, bytes, keyed.contentType);
      } catch (error) {
        errors[name] = error instanceof Error ? error.message : "The upload failed.";
        continue;
      }

      values[field.name] = keyed.key;
      // Equal keys mean the same bytes -- the name carries a digest of them --
      // so there is nothing stale to clean up.
      if (existing && existing !== keyed.key) stale.push(existing);
      continue;
    }

    if (cleared) {
      if (field.required) {
        errors[name] = `${field.label} is required.`;
        continue;
      }
      values[field.name] = field.column.notNull ? "" : null;
      if (existing) stale.push(existing);
      continue;
    }

    if (field.required && !existing) {
      errors[name] = `${field.label} is required.`;
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values, stale };
}

/** The `image` fields of a field list, which are handled apart from the rest. */
export function imageFields(fields: FormField[]): FormField[] {
  return fields.filter((field) => field.kind === "image" && !field.readOnly);
}
