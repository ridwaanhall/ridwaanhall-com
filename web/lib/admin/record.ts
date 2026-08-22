import "server-only";

import { asc, eq } from "drizzle-orm";

import {
  formFields,
  formSelect,
  manyToManyFields,
  referenceFields,
  type AdminFormModel,
  type FormValues,
} from "@/lib/admin/form";
import type { FilterChoice } from "@/lib/admin/list";
import { db } from "@/lib/db/client";

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
  id: number,
): Promise<FormValues | null> {
  if (!Number.isInteger(id) || id <= 0) return null;

  const [row] = await db.select(formSelect(model)).from(model.from).where(eq(model.pk, id)).limit(1);
  if (!row) return null;

  const values = toFormValues(model, row as Record<string, unknown>);

  // A many-to-many has no column on this record, so it is read from the join
  // table rather than from the row.
  for (const field of manyToManyFields(model)) {
    const source = field.manyToMany;
    if (!source) continue;
    const linked = await db
      .select({ id: source.targetFk })
      .from(source.join)
      .where(eq(source.ownerFk, id));
    values[field.name] = linked.map((entry) => String(entry.id));
  }

  return values;
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
      const source = field.reference as NonNullable<typeof field.reference>;
      const rows = await db
        .select({ value: source.value, label: source.label })
        .from(source.table)
        .orderBy(asc(source.label));
      return rows.map((row) => ({ value: String(row.value), label: String(row.label ?? row.value) }));
    }),
  );

  return Object.fromEntries(fields.map(({ key }, index) => [key, loaded[index]]));
}
