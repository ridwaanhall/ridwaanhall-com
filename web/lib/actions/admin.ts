"use server";

import { eq, getTableColumns, getTableName } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearFieldName,
  formFields,
  MAX_UPLOAD_BYTES,
  parseFormValues,
  type AdminFormModel,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { formModelFor } from "@/lib/admin/models";
import { getStaffUser } from "@/lib/auth/staff";
import { MODEL_TAGS } from "@/lib/data/tags";
import { db } from "@/lib/db/client";
import { deleteUnreferenced } from "@/lib/storage/cleanup";
import { objectKeyFor } from "@/lib/storage/keys";
import { putObject } from "@/lib/storage/objects";

/**
 * Saving and deleting from the admin.
 *
 * **Every entry point re-checks staff itself.** A server action is a POST
 * endpoint with a generated id, not a function call from the page that rendered
 * the form -- it does not inherit `app/admin/layout.tsx`'s screen, and neither
 * does it inherit the page's `requireStaff()`. Anyone who can reach the action
 * id can invoke it, so `getStaffUser()` is the first line of both.
 *
 * **Only declared fields are written.** `parseFormValues` walks the descriptor
 * and reads the names it expects rather than iterating the submitted
 * `FormData`, so a hand-crafted POST carrying `is_superuser` writes nothing:
 * no field is named that, and the column never appears in the `set`.
 *
 * Invalidation is per model, from `MODEL_TAGS` -- see `invalidate` below.
 */

export type SaveResult =
  | { ok: true; notice: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Postgres unique-violation, so a clash reads as a message and not a 500. */
const UNIQUE_VIOLATION = "23505";

type PostgresError = { code?: string; constraint?: string };

/**
 * The driver's error, from wherever Drizzle put it.
 *
 * Drizzle wraps a failed query in a `DrizzleQueryError` and hangs the real
 * `pg` error off `cause`, so `error.code` on the thing that was thrown is
 * `undefined` -- which made every unique clash fall through as an unhandled
 * 500 instead of a message on the field. Walking the chain rather than reaching
 * for `.cause` once keeps that true if another layer is added.
 */
function driverError(error: unknown): PostgresError | null {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current; depth++) {
    if (typeof current === "object" && "code" in current && typeof current.code === "string") {
      return current as PostgresError;
    }
    current = (current as { cause?: unknown }).cause;
  }
  return null;
}

function isUniqueViolation(error: unknown): boolean {
  return driverError(error)?.code === UNIQUE_VIOLATION;
}

/**
 * Which field a unique violation was about.
 *
 * Postgres names the constraint, not the column, and the names here are
 * Django's (`about_skill_slug_key`). Looking for a field's column name inside it
 * is a heuristic, and deliberately a soft one: a miss falls back to a form-level
 * message rather than blaming the wrong input.
 */
function uniqueField(model: AdminFormModel, error: unknown): string | null {
  const constraint = String(driverError(error)?.constraint ?? "");
  const field = formFields(model).find((candidate) =>
    constraint.includes(candidate.column.name),
  );
  return field?.name ?? null;
}

/**
 * `updateTag`, not `revalidateTag`.
 *
 * Both expire a tag; only `updateTag` does it *immediately*, and it is the one
 * meant for a server action -- Next's own words are "read-your-own-writes",
 * which is exactly the case here. `revalidateTag` takes a `cacheLife` profile
 * and lets a stale copy be served until it expires, so a save would appear to
 * do nothing until the window passed. This is the same distinction the Django
 * build drew with `CONTENT_CACHE_VERSION_TTL`: the instance that handled the
 * edit dropped its memo at once so the admin showed the change immediately.
 *
 * Per model, never global. Saving a skill must not throw away the projects,
 * blog and legal caches, each of which costs a fresh set of round trips to
 * Supabase to rebuild.
 */
function invalidate(model: AdminFormModel) {
  for (const tag of MODEL_TAGS[getTableName(model.from)] ?? []) updateTag(tag);
  revalidatePath(`/admin/${model.key}`);
}

/**
 * Map the parsed values onto their columns, dropping the read-only ones.
 *
 * **Keyed by the Drizzle property, not the database column name.** `insert` and
 * `set` take the schema's own keys (`iconSvg`), and `PgColumn.name` is the SQL
 * name (`icon_svg`) -- handing over the latter produced an insert Drizzle had no
 * column for, so every create silently wrote nothing. The two happen to match
 * on the single-word columns, which is exactly why it was worth resolving
 * properly rather than trusting the descriptor's `name` to agree.
 */
function toColumns(model: AdminFormModel, values: FormValues): Record<string, unknown> {
  const columns = Object.entries(getTableColumns(model.from));
  const row: Record<string, unknown> = {};

  for (const field of formFields(model)) {
    if (field.readOnly) continue;
    if (!(field.name in values)) continue;
    const entry = columns.find(([, column]) => column === field.column);
    if (!entry) {
      throw new Error(
        `Admin form "${model.key}" declares a field (${field.name}) whose column is not on ${getTableName(model.from)}.`,
      );
    }
    row[entry[0]] = values[field.name];
  }

  return row;
}

type ImageOutcome =
  | { ok: true; values: FormValues; stale: string[] }
  | { ok: false; errors: Record<string, string> };

/**
 * Upload whatever the form sent for its image fields.
 *
 * Three cases, and the third is the one that is easy to get wrong: a field with
 * no file and no clear box ticked has **not** been edited, so it is left out of
 * the values entirely and `toColumns` never writes it. Treating an empty file
 * input as "make it empty" would blank the image every time any other field on
 * the record was saved.
 *
 * The old key is not deleted here. It is returned as `stale`, and the caller
 * hands it to `deleteUnreferenced` only after the write has succeeded -- deleting
 * first would take the file away from a save that then failed, and deleting
 * without the reference check would take it away from the twenty other rows
 * that share it.
 */
async function applyImages(
  model: AdminFormModel,
  fields: FormField[],
  data: FormData,
  current: Record<string, string>,
): Promise<ImageOutcome> {
  const values: FormValues = {};
  const errors: Record<string, string> = {};
  const stale: string[] = [];

  for (const field of fields) {
    const uploaded = data.get(field.name);
    const file = uploaded instanceof File && uploaded.size > 0 ? uploaded : null;
    const cleared = data.get(clearFieldName(field.name)) !== null;
    const existing = current[field.name] ?? "";

    if (file) {
      if (file.size > MAX_UPLOAD_BYTES) {
        errors[field.name] = `${field.label} is ${(file.size / 1024 / 1024).toFixed(1)}MB; the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB.`;
        continue;
      }

      const bytes = new Uint8Array(await file.arrayBuffer());
      const keyed = objectKeyFor(field.prefix ?? "profile", file.name, bytes);
      if (!keyed.ok) {
        errors[field.name] = keyed.error;
        continue;
      }

      try {
        await putObject(keyed.key, bytes, keyed.contentType);
      } catch (error) {
        errors[field.name] = error instanceof Error ? error.message : "The upload failed.";
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
        errors[field.name] = `${field.label} is required.`;
        continue;
      }
      values[field.name] = field.column.notNull ? "" : null;
      if (existing) stale.push(existing);
      continue;
    }

    if (field.required && !existing) {
      errors[field.name] = `${field.label} is required.`;
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values, stale };
}

/** What the record currently stores for each image field. */
async function currentImages(
  model: AdminFormModel,
  fields: FormField[],
  id: number | null,
): Promise<Record<string, string>> {
  if (id === null || fields.length === 0) return {};
  const shape = Object.fromEntries(fields.map((field) => [field.name, field.column]));
  const [row] = await db.select(shape).from(model.from).where(eq(model.pk, id)).limit(1);
  if (!row) return {};
  return Object.fromEntries(
    Object.entries(row).map(([name, value]) => [name, typeof value === "string" ? value : ""]),
  );
}

/**
 * Create or update one record.
 *
 * `id` is `null` to create. On create the action redirects to the new record,
 * so a reload cannot post the form a second time; on update it stays put and
 * returns a notice for the form to hand to `notify()`. That is the same split
 * the comments and guestbook actions already draw, and the wording stays here
 * on the server for the same reason: a reader sees one feature, so the two
 * surfaces have to say the same words.
 */
export async function saveRecord(
  key: string,
  id: number | null,
  _previous: SaveResult | null,
  data: FormData,
): Promise<SaveResult> {
  const actor = await getStaffUser();
  if (!actor) return { ok: false, error: "You are not permitted to do that." };

  const model = formModelFor(key);
  if (!model) return { ok: false, error: "Unknown record type." };
  if (id === null && model.canCreate === false) {
    return { ok: false, error: "Records of this kind are not created here." };
  }

  const parsed = parseFormValues(model, data);
  if (!parsed.ok) {
    return { ok: false, error: "Some fields need attention.", fieldErrors: parsed.errors };
  }

  const imageFields = formFields(model).filter(
    (field) => field.kind === "image" && !field.readOnly,
  );
  const images = await applyImages(
    model,
    imageFields,
    data,
    await currentImages(model, imageFields, id),
  );
  if (!images.ok) {
    return { ok: false, error: "Some fields need attention.", fieldErrors: images.errors };
  }

  const values = { ...parsed.values, ...images.values };
  const problem = await model.validate?.(values, { id, actorId: actor.id });
  if (problem) return { ok: false, error: problem };

  const row = toColumns(model, values);
  let created: number | null = null;

  try {
    if (id === null) {
      const [inserted] = await db.insert(model.from).values(row).returning({ id: model.pk });
      created = inserted ? Number(inserted.id) : null;
    } else {
      await db.update(model.from).set(row).where(eq(model.pk, id));
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      const field = uniqueField(model, error);
      const message = "Another record already uses that value.";
      return field
        ? { ok: false, error: "Some fields need attention.", fieldErrors: { [field]: message } }
        : { ok: false, error: message };
    }
    throw error;
  }

  // Only now that the write has landed. A file the record no longer names is
  // still not removed if any other row names it -- one author photo is shared by
  // twenty-one rows, one logo by three.
  if (images.stale.length > 0) await deleteUnreferenced(images.stale);

  invalidate(model);
  if (id !== null) {
    revalidatePath(`/admin/${model.key}/${id}`);
    return { ok: true, notice: "Saved." };
  }

  // Outside the `try`: `redirect` works by throwing, and catching it there would
  // turn a successful save into "Something went wrong".
  if (created !== null) redirect(`/admin/${model.key}/${created}`);
  return { ok: true, notice: "Created." };
}

export async function deleteRecord(key: string, id: number): Promise<SaveResult> {
  const actor = await getStaffUser();
  if (!actor) return { ok: false, error: "You are not permitted to do that." };

  const model = formModelFor(key);
  if (!model) return { ok: false, error: "Unknown record type." };
  if (model.canDelete === false) {
    return { ok: false, error: "Records of this kind are not deleted here." };
  }

  const imageFields = formFields(model).filter((field) => field.kind === "image");
  const orphaned = Object.values(await currentImages(model, imageFields, id));

  await db.delete(model.from).where(eq(model.pk, id));
  if (orphaned.length > 0) await deleteUnreferenced(orphaned);
  invalidate(model);
  // No redirect: the notice is the point, and a redirect thrown from here would
  // leave nothing to show it. The form navigates back to the list itself and
  // hands this string to `notify()`.
  return { ok: true, notice: "Deleted." };
}
