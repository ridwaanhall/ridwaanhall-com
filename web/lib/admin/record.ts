import "server-only";

import { eq } from "drizzle-orm";

import { formFields, formSelect, type AdminFormModel, type FormValues } from "@/lib/admin/form";
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

  return toFormValues(model, row as Record<string, unknown>);
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
