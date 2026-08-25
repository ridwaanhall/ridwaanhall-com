import "server-only";

import { eq } from "drizzle-orm";

import {
  formFields,
  formSelect,
  manyToManyFields,
  referenceFields,
  type AdminFormModel,
  type FormValues,
} from "@/lib/admin/form";
import { labelledRows, type FilterChoice } from "@/lib/admin/list";
import { db } from "@/lib/db/client";
import { imageFields } from "@/lib/admin/images";
import { keyForMediaId } from "@/lib/admin/media";
import { isUuid } from "@/lib/utils/uuid";

/**
 * Load one record in the shape its form expects, or `null` if there is none.
 *
 * The select shape comes from the descriptor, so a form can only ever read the
 * columns it declares -- the same rule the save path applies to writing. Values
 * are flattened to primitives here rather than in the component, because the
 * form is a client component and a Drizzle row can carry `Date`s and `bigint`s
 * that will not cross the boundary.
 */
export async function loadFormValues(
  model: AdminFormModel,
  id: string,
): Promise<FormValues | null> {
  /*
   * An empty id means "the one row", which is how the singleton screens ask.
   * There is no id to hard-code against a uuid, so the screen asks for the row
   * and the model is what says there is only ever one.
   */
  /*
   * A key that is not a uuid is "no such record", not an error. Postgres does
   * not agree -- comparing a uuid column to `1` raises `22P02 invalid input
   * syntax`, which surfaces as a 500 rather than the not-found screen -- so
   * the shape is checked here before the value reaches a query.
   */
  if (id && !isUuid(id)) return null;

  const [row] = id
    ? await db.select(formSelect(model)).from(model.from).where(eq(model.pk, id)).limit(1)
    : await db.select(formSelect(model)).from(model.from).limit(1);
  if (!row) return null;

  // Whichever row that turned out to be is the one the inlines and the save
  // path have to target.
  const rowId = String((row as Record<string, unknown>)[model.pk.name] ?? id);

  const values = toFormValues(model, row as Record<string, unknown>);

  // The column stores an asset id; the image control shows a storage key. See
  // `lib/admin/media.ts` for why the seam is here rather than in either half.
  for (const field of imageFields(formFields(model))) {
    const stored = values[field.name];
    values[field.name] = typeof stored === "string" ? await keyForMediaId(stored) : "";
  }

  // A many-to-many has no column on this record, so it is read from the join
  // table rather than from the row.
  for (const field of manyToManyFields(model)) {
    const source = field.manyToMany;
    if (!source) continue;
    const linked = await db
      .select({ id: source.targetFk })
      .from(source.join)
      .where(eq(source.ownerFk, rowId));
    values[field.name] = linked.map((entry) => String(entry.id));
  }

  return values;
}

/**
 * The key of the row behind a singleton screen.
 *
 * A uuid gives nothing to hard-code, and the empty string is not a key either
 * -- it reaches a child's foreign key as `profile_id = ''`, which Postgres
 * rejects as malformed rather than matching nothing. So the row is looked up.
 *
 * So the row is asked for its own id, once, and everything downstream is given
 * a real one. `limit(1)` with no `where` is the whole query because the model
 * guarantees there is exactly one row.
 */
export async function singletonId(model: AdminFormModel): Promise<string | null> {
  const [row] = await db.select({ id: model.pk }).from(model.from).limit(1);
  return row ? String(row.id) : null;
}

/** The values a create form starts with: empty, and unchecked. */
export function blankFormValues(model: AdminFormModel): FormValues {
  const values: FormValues = {};
  for (const field of formFields(model)) {
    values[field.name] = field.kind === "checkbox" ? false : null;
  }
  return values;
}

function toFormValues(model: AdminFormModel, row: Record<string, unknown>): FormValues {
  const values: FormValues = {};

  for (const field of formFields(model)) {
    const raw = row[field.name];
    if (raw === null || raw === undefined) {
      values[field.name] = field.kind === "checkbox" ? false : null;
      continue;
    }
    if (field.kind === "checkbox") {
      values[field.name] = Boolean(raw);
    } else if (Array.isArray(raw)) {
      // A `jsonb` list, which the driver already hands back as an array. Only
      // strings survive: every one of these columns is a list of text, and a
      // stray number would be written straight back on the next save.
      values[field.name] = raw.filter((entry): entry is string => typeof entry === "string");
    } else if (field.kind === "key-value" && typeof raw === "object") {
      values[field.name] = Object.fromEntries(
        Object.entries(raw as Record<string, unknown>).map(([key, entry]) => [key, String(entry)]),
      );
    } else if (typeof raw === "number" || typeof raw === "string") {
      values[field.name] = raw;
    } else if (raw instanceof Date) {
      values[field.name] = raw.toISOString();
    } else {
      // `bigint`, and anything a column type gains later. Stringifying keeps the
      // value visible rather than dropping it silently, which is what a `null`
      // here would do.
      values[field.name] = String(raw);
    }
  }

  return values;
}

/**
 * The rows each `reference` field offers.
 *
 * One query per field, run when the form is rendered -- the same shape the
 * changelist uses for its foreign-key filters. These are small by construction
 * (19 organizations, 2 legal documents); a model that referenced something large
 * would want a search box rather than a longer select, and that is the point at
 * which to build one.
 */
export async function loadReferenceOptions(
  model: AdminFormModel,
): Promise<Record<string, FilterChoice[]>> {
  const fields = [
    ...referenceFields(model),
    ...manyToManyFields(model).map((field) => ({
      key: field.name,
      // The options live on the many-to-many descriptor rather than on
      // `reference`, so they are unwrapped to the same shape here.
      field: { ...field, reference: field.manyToMany?.options },
    })),
  ];
  if (fields.length === 0) return {};

  const loaded = await Promise.all(
    fields.map(async ({ field }) => {
      // Present by construction: the list was filtered on it.
      const declared = field.reference as NonNullable<typeof field.reference>;
      /*
       * A field may name several tables -- `comment.target_id` is a blog post
       * or a project. Each source is loaded on its own and the results are
       * concatenated in declaration order, so the groups appear in the order
       * the descriptor lists them rather than in whatever order the queries
       * happened to finish.
       */
      const sources = Array.isArray(declared) ? declared : [declared];
      const perSource = await Promise.all(
        sources.map(async (source) => {
          // Loaded and labelled by the same function the changelist's
          // foreign-key filters use, so a label composed from several columns
          // works in both and neither can be blank in one and not the other.
          const rows = await labelledRows(source.table, source.value, source.label);
          return rows.map((row) => ({
            ...row,
            // Only where there is more than one: a lone source needs no
            // heading, and an `<optgroup>` around the whole list is a box
            // drawn round everything.
            ...(sources.length > 1 ? { group: source.groupLabel ?? "" } : {}),
          }));
        }),
      );
      return perSource.flat();
    }),
  );

  return Object.fromEntries(fields.map(({ key }, index) => [key, loaded[index]]));
}
