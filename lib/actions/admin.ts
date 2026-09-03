"use server";

import { eq, getTableColumns, getTableName, inArray, sql } from "drizzle-orm";
import type { Route } from "next";
import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import {
  cascadeTargets,
  formFields,
  formFieldsFor,
  manyToManyFields,
  richTextFields,
  parseFormValues,
  type AdminFormModel,
  type FormField,
  type FormValues,
} from "@/lib/admin/form";
import { inlineImageKeys, saveInlines } from "@/lib/admin/inlines";
import { formModelFor } from "@/lib/admin/models";
import { blockedDeleteMessage } from "@/lib/admin/blockers";
import { seedDefaultGrants } from "@/lib/auth/grants";
import { adminPath, ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { permits } from "@/lib/auth/permissions";
import { getStaffUser } from "@/lib/auth/staff";
import { MODEL_TAGS } from "@/lib/data/tags";
import { db } from "@/lib/db/client";
import { applyImageFields, imageFields } from "@/lib/admin/images";
import { keyForMediaId, mediaIdForKey, setImageAlts } from "@/lib/admin/media";
import { deleteUnreferenced } from "@/lib/storage/cleanup";
import { REMOTE_FETCH_BUDGET_MS } from "@/lib/storage/fetch-image";
import { sanitizeRichText } from "@/lib/utils/sanitize";
import { isUuid } from "@/lib/utils/uuid";

/**
 * Saving and deleting from the admin.
 *
 * **Every entry point re-checks staff and permission itself.** A server action
 * is a POST endpoint with a generated id, not a function call from the page
 * that rendered the form -- it does not inherit `app/admin/layout.tsx`'s
 * screen, and neither does it inherit the page's `requireStaff()` or its
 * `requirePermission()`. Anyone who can reach the action id can invoke it, so
 * `getStaffUser()` is the first line of both and `permits()` is the second.
 *
 * The permission is asked with the model in hand, never as `can()` alone: a
 * grant may not widen what a descriptor refuses, and the flags it refuses with
 * are `boolean | "superuser"` -- a truthy string that reads as *allowed* to
 * anything testing `!== false`. `permits` is the one place that resolves them.
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
 * Postgres names the constraint, not the column (`skill_slug_key`). Looking for
 * a field's column name inside that is a heuristic, and deliberately a soft one:
 * a miss falls back to a form-level message rather than blaming the wrong
 * input.
 */
function uniqueField(model: AdminFormModel, error: unknown): string | null {
  const constraint = String(driverError(error)?.constraint ?? "");
  const field = formFields(model).find((candidate) =>
    constraint.includes(candidate.column.name),
  );
  return field?.name ?? null;
}

/**
 * The URL a model's screen lives at.
 *
 * `revalidatePath` and `redirect` both name the path the browser is on or is
 * about to be on, and a vocabulary that is a tab on a Settings page is two
 * segments rather than one. Composing `/admin/<key>` here would revalidate a
 * path that no longer answers and, worse, send a freshly created row to a 404
 * -- a save that worked, reading as one that failed.
 */
function adminBase(model: AdminFormModel): string {
  const entry = ADMIN_ENTRIES_BY_KEY.get(model.key);
  // Unreachable for a model that has a screen; `descriptors.test.ts` asserts
  // the registry and the descriptors name the same set. The flat path is the
  // honest fallback rather than a throw inside a save that already succeeded.
  return entry ? adminPath(entry) : `/admin/${model.key}`;
}

/**
 * `updateTag`, not `revalidateTag`.
 *
 * Both expire a tag; only `updateTag` does it *immediately*, and it is the one
 * meant for a server action -- Next's own words are "read-your-own-writes",
 * which is exactly the case here. `revalidateTag` takes a `cacheLife` profile
 * and lets a stale copy be served until it expires, so a save would appear to
 * do nothing until the window passed -- which is precisely the wrong answer
 * for the person who just pressed Save.
 *
 * Per model, never global. Saving a skill must not throw away the projects,
 * blog and legal caches, each of which costs a fresh set of round trips to
 * Supabase to rebuild.
 */
function invalidate(model: AdminFormModel) {
  for (const tag of MODEL_TAGS[getTableName(model.from)] ?? []) updateTag(tag);
  revalidatePath(adminBase(model));
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
function toColumns(
  model: AdminFormModel,
  values: FormValues,
  /** `null` when creating -- see `formFieldsFor`. */
  id: string | null,
): Record<string, unknown> {
  const columns = Object.entries(getTableColumns(model.from));
  const row: Record<string, unknown> = {};

  for (const field of formFieldsFor(model, id)) {
    if (field.readOnly) continue;
    // Written to a join table by `saveManyToMany`, never as a column here --
    // its `column` names this record's primary key, which is the last thing
    // that should be overwritten with a list of skill ids.
    if (field.kind === "many-to-many") continue;
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

/** What the record currently stores for each image field. */
async function currentImages(
  model: AdminFormModel,
  fields: FormField[],
  id: string | null,
): Promise<Record<string, string>> {
  if (id === null || fields.length === 0) return {};
  const shape = Object.fromEntries(fields.map((field) => [field.name, field.column]));
  const [row] = await db.select(shape).from(model.from).where(eq(model.pk, id)).limit(1);
  if (!row) return {};

  /*
   * The column holds an asset id; the image control compares storage keys. The
   * translation happens here so `applyImageFields` keeps working on the strings
   * it was written for -- see `lib/admin/media.ts`.
   */
  const entries = await Promise.all(
    Object.entries(row).map(async ([name, value]) => {
      const stored = typeof value === "string" ? value : "";
      return [name, stored ? await keyForMediaId(stored) : ""] as const;
    }),
  );
  return Object.fromEntries(entries);
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
  id: string | null,
  _previous: SaveResult | null,
  data: FormData,
): Promise<SaveResult> {
  const actor = await getStaffUser();
  if (!actor) return { ok: false, error: "You are not permitted to do that." };

  const model = formModelFor(key);
  if (!model) return { ok: false, error: "Unknown record type." };
  /*
   * Creating and changing are two permissions, so they are two questions. The
   * wording splits with them: "not created here" is about the model and is the
   * same sentence for everybody, while a refused permission is about this
   * account and must not describe the screen it is refusing -- somebody who
   * cannot open Users should not learn from an error message that Users has an
   * add form.
   */
  const action = id === null ? "add" : "change";
  if (!permits(actor, key, action, model)) {
    if (action === "add" && model.canCreate === false) {
      return { ok: false, error: "Records of this kind are not created here." };
    }
    return { ok: false, error: "You are not permitted to do that." };
  }
  /*
   * The id rides in the form, so it is input. A non-uuid reaching a query
   * against a uuid column raises `22P02` and throws out of the action instead
   * of returning a result the form can show.
   */
  if (id !== null && id !== "" && !isUuid(id)) {
    return { ok: false, error: "That record no longer exists." };
  }

  const parsed = parseFormValues(model, data, id);
  if (!parsed.ok) {
    return { ok: false, error: "Some fields need attention.", fieldErrors: parsed.errors };
  }
  /*
   * One deadline for every image this save has to fetch, opened before the
   * first of them and shared with the inline rows below.
   *
   * A record can carry several image fields and each inline row carries its
   * own, so a budget that applied per fetch would bound one call and say
   * nothing about the save -- which is exactly the shape that turned a
   * struggling upload into a live gateway error once already. Past the
   * deadline a link fails with a sentence the reader can act on, while
   * everything already stored stays stored.
   */
  const deadline = Date.now() + REMOTE_FETCH_BUDGET_MS;

  const pictures = imageFields(formFieldsFor(model, id));
  const images = await applyImageFields(
    pictures,
    data,
    await currentImages(model, pictures, id),
    "",
    { deadline },
  );
  if (!images.ok) {
    return { ok: false, error: "Some fields need attention.", fieldErrors: images.errors };
  }

  /*
   * Sanitised here rather than in the parser, which is reachable from a client
   * component and would drag `sanitize-html` into the browser bundle.
   *
   * This is the same allow-list the page renders through, so the editor cannot
   * store something the reader would never see. It is not a guard against the
   * one person who can reach this form -- it is a guard against the next
   * writer: a paste from Word carrying a `<script>`, an import from another
   * system, an editor that stops escaping something it used to.
   */
  for (const field of richTextFields(model)) {
    const raw = parsed.values[field.name];
    if (typeof raw === "string") parsed.values[field.name] = sanitizeRichText(raw);
  }

  const values = { ...parsed.values, ...images.values };
  const problem = await model.validate?.(values, {
    id,
    actorId: actor.id,
    actorIsSuperuser: actor.isSuperuser,
    exists: async (table, column, value) => {
      if (!isUuid(value)) return false;
      const [row] = await db
        .select({ present: sql`1` })
        .from(table)
        .where(eq(column, value))
        .limit(1);
      return row !== undefined;
    },
  });
  if (problem) return { ok: false, error: problem };

  /*
   * An image field's value is a storage key coming out of the upload control
   * and an asset id going into the column. Converting here, once, keeps both
   * halves unaware of the other.
   */
  for (const field of imageFields(formFieldsFor(model, id))) {
    /*
     * Only a field that was actually edited. `applyImageFields` returns a value
     * for an upload and for a clear, and nothing at all for an untouched one --
     * an empty file input means "not edited", never "make it empty". Converting
     * unconditionally put the name into `values` with `null` behind it, and
     * `toColumns` writes whatever it finds there: saving any other field on the
     * record blanked the image.
     */
    if (!(field.name in values)) continue;
    const key = values[field.name];
    values[field.name] = typeof key === "string" && key ? await mediaIdForKey(key) : null;
  }

  const row = toColumns(model, values, id);
  // Columns the form does not carry that the database still demands. Only on
  // insert: an update must not reset a creation timestamp or a view counter.
  if (id === null && model.insertDefaults) Object.assign(row, model.insertDefaults());
  let created: string | null = null;

  try {
    if (id === null) {
      const [inserted] = await db.insert(model.from).values(row).returning({ id: model.pk });
      created = inserted ? String(inserted.id) : null;
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

  /*
   * Child rows go after the parent, and for a create they have no choice: an
   * inline row carries the parent's id, which does not exist until the insert
   * returns. A failure here leaves the parent saved and its children not, which
   * is why the fields are validated before anything is written -- what can
   * still fail at this point is the database, not the input.
   */
  const parentId = id ?? created;

  // A many-to-many lives in a join table, not in a column, so it is written
  // after the record exists -- and on a create it cannot be written before.
  for (const field of manyToManyFields(model)) {
    const source = field.manyToMany;
    const chosen = values[field.name];
    if (!source || !Array.isArray(chosen) || parentId === null) continue;
    await saveManyToMany(source, parentId, chosen.map(String));
  }

  const staleFromInlines: string[] = [];
  const alts = { ...images.alts };
  if (model.inlines?.length && parentId !== null) {
    const inlined = await saveInlines(model.inlines, data, parentId, { deadline });
    if (!inlined.ok) {
      return { ok: false, error: "Some fields need attention.", fieldErrors: inlined.errors };
    }
    staleFromInlines.push(...inlined.stale);
    Object.assign(alts, inlined.alts);
  }

  /*
   * The descriptions, after the rows and before the cleanup.
   *
   * After, because a file uploaded on this save has no `media_asset` row until
   * `mediaIdForKey` made one, and there is nothing to describe before that.
   * Before the cleanup, because that is what removes an asset the record has
   * stopped naming -- describing a row that is about to be deleted is wasted,
   * and describing one after it is gone silently updates nothing.
   */
  await setImageAlts(alts);

  // Only now that the write has landed. A file the record no longer names is
  // still not removed if any other row names it -- one author photo is shared by
  // twenty-one rows, one logo by three.
  const stale = [...images.stale, ...staleFromInlines];
  if (stale.length > 0) await deleteUnreferenced(stale);

  /*
   * Last, because everything it can see has to be committed: the row, its join
   * tables and its inlines. It cannot refuse the save -- there is nothing left
   * to refuse by here -- so a rule that can say no belongs in `validate`.
   *
   * What it needs is handed in rather than imported by the descriptor, for the
   * reason `ValidationContext.exists` exists: `lib/admin/models/` is read by the
   * check harnesses, and a descriptor reaching for the database would open a
   * connection every time one of them asked a form for its shape.
   */
  if (model.afterSave && parentId !== null) {
    await model.afterSave(values, {
      id: parentId,
      created: id === null,
      seedDefaultGrants,
    });
  }

  invalidate(model);
  const base = adminBase(model);
  if (id !== null) {
    revalidatePath(`${base}/${id}`);
    return { ok: true, notice: "Saved." };
  }

  // Outside the `try`: `redirect` works by throwing, and catching it there would
  // turn a successful save into "Something went wrong". The cast is because
  // `base` is composed from registry data rather than written as a literal, so
  // it does not narrow to a typed route on its own.
  if (created !== null) redirect(`${base}/${created}` as Route);
  return { ok: true, notice: "Created." };
}

/**
 * Replace the rows of a join table for one record.
 *
 * Deleting and re-inserting rather than diffing: the table carries nothing but
 * the two keys, so a row has no identity worth preserving and no order to keep
 * -- which is exactly the difference between this and
 * `Profile.skills_highlight`, whose sequence became the JSON-LD `knowsAbout`
 * array and therefore needed a through model.
 */
async function saveManyToMany(
  source: NonNullable<FormField["manyToMany"]>,
  ownerId: string,
  targetIds: string[],
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(source.join).where(eq(source.ownerFk, ownerId));
    if (targetIds.length === 0) return;

    const columns = Object.entries(getTableColumns(source.join));
    const ownerKey = columns.find(([, column]) => column === source.ownerFk)?.[0];
    const targetKey = columns.find(([, column]) => column === source.targetFk)?.[0];
    if (!ownerKey || !targetKey) return;

    await tx
      .insert(source.join)
      .values([...new Set(targetIds)].map((id) => ({ [ownerKey]: ownerId, [targetKey]: id })));
  });
}

/** Postgres foreign-key violation, so "still in use" reads as a message. */
const FOREIGN_KEY_VIOLATION = "23503";

/**
 * Clear a record's children, then the record.
 *
 * One transaction, children first. **No foreign key here is deferrable**, so
 * each statement is checked as it runs rather than at commit -- which is what
 * makes the order inside this transaction load-bearing, and what makes a
 * violation land on the statement that caused it instead of on the commit.
 *
 * What is *not* cleared is a reference this record does not own: an organization
 * an experience still names stays undeletable, which is what the `RESTRICT` on
 * that foreign key is for. It surfaces as a foreign-key violation, caught below
 * and turned into a sentence naming what is in the way. **No role changes
 * that** -- a superuser is a permission this application grants, and a foreign
 * key is not a permission this application is asked about.
 */
async function deleteWithChildren(model: AdminFormModel, id: string): Promise<void> {
  const targets = cascadeTargets(model);

  await db.transaction(async (tx) => {
    for (const target of targets) {
      if (target.selfReference) {
        // `reply_to` and `parent_id` are unbounded, so the branch is walked
        // rather than assumed to be one level deep.
        await tx.execute(sql`
          with recursive branch as (
            select ${target.pk} as id from ${target.table} where ${target.fk} = ${id}
            union all
            select child.id
            from ${target.table} as child
            join branch on child.${sql.raw(`"${target.fk.name}"`)} = branch.id
          )
          delete from ${target.table} where ${target.pk} in (select id from branch)
        `);
        continue;
      }

      const children = await tx
        .select({ id: target.pk })
        .from(target.table)
        .where(eq(target.fk, id));
      if (children.length > 0) {
        // Ids stay strings. They were coerced with `Number` when keys were
        // serial, and a uuid through that is `NaN`.
        await tx.delete(target.table).where(inArray(target.pk, children.map((row) => String(row.id))));
      }
    }

    await tx.delete(model.from).where(eq(model.pk, id));
  });
}

export async function deleteRecord(key: string, id: string): Promise<SaveResult> {
  const actor = await getStaffUser();
  if (!actor) return { ok: false, error: "You are not permitted to do that." };

  const model = formModelFor(key);
  if (!model) return { ok: false, error: "Unknown record type." };
  if (!permits(actor, key, "delete", model)) {
    // `false` is a property of the model and says so; `"superuser"` and a
    // missing grant are both properties of this account, and neither is
    // described any further than "not permitted".
    if (model.canDelete === false) {
      return { ok: false, error: "Records of this kind are not deleted here." };
    }
    return { ok: false, error: "You are not permitted to do that." };
  }
  if (!isUuid(id)) return { ok: false, error: "That record no longer exists." };

  const orphaned = [
    ...Object.values(await currentImages(model, imageFields(formFieldsFor(model, id)), id)),
    ...(await inlineImageKeys(model, id)),
  ];

  try {
    await deleteWithChildren(model, id);
  } catch (error) {
    if (driverError(error)?.code === FOREIGN_KEY_VIOLATION) {
      /*
       * Named rather than gestured at. No role gets past this -- a foreign key
       * is not one of the questions this application answers -- so the useful
       * thing is to say which rows are in the way and how many. See
       * `lib/admin/blockers.ts`, which falls back to this sentence if the
       * catalogue cannot be read.
       */
      return { ok: false, error: await blockedDeleteMessage(getTableName(model.from), id) };
    }
    throw error;
  }

  if (orphaned.length > 0) await deleteUnreferenced(orphaned);
  invalidate(model);
  // No redirect: the notice is the point, and a redirect thrown from here would
  // leave nothing to show it. The form navigates back to the list itself and
  // hands this string to `notify()`.
  return { ok: true, notice: "Deleted." };
}
