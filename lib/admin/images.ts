import "server-only";

import {
  clearFieldName,
  linkFieldName,
  MAX_UPLOAD_BYTES,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { imageSourceFor } from "@/lib/admin/image-source";
import { fetchLinkedImage, REMOTE_FETCH_BUDGET_MS } from "@/lib/storage/fetch-image";
import { objectKeyFor, type UploadPrefix } from "@/lib/storage/keys";
import { putObject } from "@/lib/storage/objects";

/**
 * Turning an `image` field's submission into a stored key.
 *
 * Shared by the record and its inlines rather than living in the save action,
 * because a gallery row has exactly the same cases as the record it hangs off --
 * and the one that is easy to get wrong is the same one in both.
 */

export type ImageOutcome =
  | { ok: true; values: FormValues; stale: string[] }
  | { ok: false; errors: Record<string, string> };

/**
 * Store bytes, whether they arrived as an upload or came back from a link.
 *
 * Both doors end here on purpose. The key is a digest of the content, so the
 * same image uploaded once and linked once is one object with one `media_asset`
 * row -- which is what lets `lib/storage/cleanup.ts` count references over it.
 * A second path that named files differently would split that count in two.
 */
async function store(
  bytes: Uint8Array,
  filename: string,
  prefix: UploadPrefix,
): Promise<{ ok: true; key: string } | { ok: false; error: string }> {
  const keyed = objectKeyFor(prefix, filename, bytes);
  if (!keyed.ok) return { ok: false, error: keyed.error };

  try {
    await putObject(keyed.key, bytes, keyed.contentType);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "The upload failed." };
  }
  return { ok: true, key: keyed.key };
}

/**
 * Store whatever was supplied, and say what the old keys were.
 *
 * Which of the ways in was used is decided by `imageSourceFor`, which is pure
 * and has the whole matrix under test -- a file, a pasted link, the clear box,
 * both at once, and the resting state where none of them was touched. This is
 * left holding the bytes and the network.
 *
 * **An untouched field is left out of the values entirely** and the caller never
 * writes it. Treating an empty file input as "make it empty" would blank the
 * image every time any other field on the record was saved.
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
  /**
   * When every link on this save has to be done by.
   *
   * One deadline for the operation, not one timeout per fetch. A record can
   * carry several image fields and each inline row carries its own, so a
   * per-fetch limit bounds one call and says nothing about the save -- which is
   * the shape that produced a live gateway error once already.
   */
  { deadline = Date.now() + REMOTE_FETCH_BUDGET_MS }: { deadline?: number } = {},
): Promise<ImageOutcome> {
  const values: FormValues = {};
  const errors: Record<string, string> = {};
  const stale: string[] = [];

  for (const field of fields) {
    const name = `${prefix}${field.name}`;
    const uploaded = data.get(name);
    const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    const link = data.get(linkFieldName(name));
    const existing = current[field.name] ?? "";

    const source = imageSourceFor({
      label: field.label,
      hasFile: file !== null,
      link: typeof link === "string" ? link.trim() : "",
      cleared: data.get(clearFieldName(name)) !== null,
      existing,
      required: field.required,
    });

    if (source.kind === "error") {
      errors[name] = source.error;
      continue;
    }

    if (source.kind === "untouched") continue;

    if (source.kind === "clear") {
      values[field.name] = field.column.notNull ? "" : null;
      if (existing) stale.push(existing);
      continue;
    }

    let bytes: Uint8Array;
    let filename: string;

    if (source.kind === "link") {
      const fetched = await fetchLinkedImage(source.link, { deadline });
      if (!fetched.ok) {
        errors[name] = fetched.error;
        continue;
      }
      bytes = fetched.image.bytes;
      filename = fetched.image.filename;
    } else if (file) {
      /*
       * Refused here rather than at the gateway. This number tracks the request
       * body limit a serverless platform enforces, so an oversized upload would
       * otherwise come back as an error the application never saw and cannot
       * explain -- and the reader is told in words before a byte is sent.
       */
      if (file.size > MAX_UPLOAD_BYTES) {
        errors[name] =
          `${field.label} is ${(file.size / 1024 / 1024).toFixed(1)}MB; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`;
        continue;
      }
      bytes = new Uint8Array(await file.arrayBuffer());
      filename = file.name;
    } else {
      // `imageSourceFor` answers "upload" only where a file was present, so
      // there is no third way to get here. Narrowing rather than asserting is
      // what keeps that true if the rule ever grows a case.
      continue;
    }

    const stored = await store(bytes, filename, field.prefix ?? "profile");
    if (!stored.ok) {
      errors[name] = stored.error;
      continue;
    }

    values[field.name] = stored.key;
    // Equal keys mean the same bytes -- the name carries a digest of them -- so
    // there is nothing stale to clean up. That holds across the two doors as
    // well: linking the image that is already stored there is a no-op.
    if (existing && existing !== stored.key) stale.push(existing);
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values, stale };
}

/**
 * The `image` fields of a field list, which are handled apart from the rest.
 *
 * Pass a list that has already been through `formFieldsFor`: `readOnly` may be
 * the string `"afterCreate"`, which is truthy, so testing it raw would read an
 * unresolved field as read-only whichever form it was on.
 */
export function imageFields(fields: FormField[]): FormField[] {
  return fields.filter((field) => field.kind === "image" && field.readOnly !== true);
}
