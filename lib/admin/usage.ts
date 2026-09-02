import { sql, type SQL } from "drizzle-orm";

import { countWhere } from "@/lib/admin/sql";

import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * How many rows point at a record, for the "Used by" column.
 *
 * Every screen that offers one is a lookup table -- a skill, an organization, a
 * place, one of the fourteen vocabularies -- and the question it answers is the
 * one somebody asks before deleting: what breaks. The counts are correlated
 * subqueries rather than joins, and the reason is measured: four joins multiply
 * each other, so an organization with 6 experiences and 1 certification reports
 * 6 certifications, while counting each relation in its own query per row cost
 * 76 sequential round trips to Supabase for 19 rows and timed the page out with
 * a 504. A correlated subquery has neither problem -- one query, and each count
 * sees only its own table.
 *
 * Built with `countWhere` from `lib/admin/sql.ts` and never as a hand-written
 * `sql` template, for the reason that file's header records: Drizzle renders an
 * interpolated column with its bare name, and a correlated subquery is exactly
 * where that binds to the wrong table.
 *
 * No `server-only` and no `db` here, like its neighbour, so the check harnesses
 * and the unit suite can import the descriptors that use it.
 */

/** One foreign key pointing at the record, and what to call the rows behind it. */
export type UsageRelation = {
  column: PgColumn;
  /**
   * Singular. `usageSentence` pluralises with an `s`, so a noun that does not
   * take one -- "education" -- is written as one that does.
   */
  noun: string;
};

const sqlPlus = (a: SQL<number>, b: SQL<number>): SQL<number> => sql<number>`${a} + ${b}`;

/**
 * Every relation counted and summed, as one expression.
 *
 * Summed in SQL rather than in a column's `value`, so the header can sort on it.
 * A "Used by" composed from four counts in TypeScript offers a number the
 * database cannot order by, which for a long time was the compromise the
 * organizations screen made -- the cell said `3 experiences, 1 award` and the
 * heading did nothing. This is what lets a screen have both: the breakdown in
 * the cell, and the total as the sort key.
 *
 * It is an `ORDER BY` expression rather than a selected column: nothing renders
 * the total, so selecting it would run the same counts a second time per row.
 */
export function usageTotal(relations: UsageRelation[], id: PgColumn): SQL<number> {
  return relations.map((relation) => countWhere(relation.column, id)).reduce(sqlPlus);
}

/** The same, for a list of columns that share no nouns -- the vocabularies. */
export function usageTotalOf(columns: PgColumn[], id: PgColumn): SQL<number> {
  return columns.map((column) => countWhere(column, id)).reduce(sqlPlus);
}

/**
 * `3 experiences, 1 award`, and `unused` when nothing points at the record.
 *
 * Relations with no rows are dropped rather than printed as zeros: a cell
 * listing six relations of which one is non-zero is a cell nobody reads, and
 * the whole point is that the cost of a delete should be legible at a glance.
 *
 * `unused` rather than an empty string, because `Cell` renders an empty value
 * as an em dash -- which reads as "not applicable" where the honest answer is
 * "nothing, and you may delete this".
 */
export function usageSentence(parts: [count: unknown, noun: string][]): string {
  return (
    parts
      .filter(([count]) => Number(count) > 0)
      .map(([count, noun]) => `${count} ${Number(count) === 1 ? noun : `${noun}s`}`)
      .join(", ") || "unused"
  );
}
