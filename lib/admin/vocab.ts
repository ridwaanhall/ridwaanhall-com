import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import type { ReferenceSource } from "@/lib/admin/form";
import type { RelatedChoices } from "@/lib/admin/list";

/**
 * A lookup table as the options of a dropdown or a filter.
 *
 * Every vocabulary here is the same four columns plus `description`, and every
 * place that offered one wrote `{ table, value: table.id, label: table.label }`
 * by hand -- which left out the two things a dropdown of statuses needs: what
 * each one means, and the order the table says it is read in. This is the one
 * place that states both, so a vocabulary cannot be offered without them.
 *
 * `position` is optional because two of them (`application_source`, `tag`) have
 * none, and are an alphabet rather than a sequence.
 */
type Vocabulary = PgTable & {
  id: PgColumn;
  label: PgColumn;
  description: PgColumn;
  position?: PgColumn;
};

export function vocabularyOptions(table: Vocabulary): ReferenceSource & RelatedChoices {
  return {
    table,
    value: table.id,
    label: table.label,
    hint: table.description,
    ...(table.position ? { order: table.position } : {}),
  };
}
