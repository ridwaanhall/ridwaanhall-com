import "server-only";

import { getTableName, sql } from "drizzle-orm";

import { ADMIN_FORM_MODELS } from "@/lib/admin/models";
import { ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { db } from "@/lib/db/client";

/**
 * What is standing in the way of a delete, named.
 *
 * A delete refused by Postgres used to read "Something still refers to this
 * record, so it cannot be deleted yet." -- true, and no help at all: the person
 * reading it has to guess which of the other screens holds the row, and there
 * is no reason they should have to. This turns the same failure into "3
 * certifications and 1 experience still refer to this record", which says where
 * to go.
 *
 * **This is not a way around the constraint, and no role changes that.** A
 * superuser answers yes to every question this application asks; a foreign key
 * is not one of them. `ON DELETE RESTRICT` is what keeps an organization that
 * five certifications still name from being deleted out from under them, and
 * the honest fix is to deal with those five -- which is what this message is
 * for.
 *
 * **Read from the catalogue, not from a list in this file.** The alternative is
 * a `blockedBy` array on each descriptor, which is a transcription of the
 * schema that nothing keeps in step: add a foreign key and the message goes
 * quietly back to saying nothing. `pg_constraint` cannot drift from the
 * constraints, because it *is* them.
 *
 * It runs only after a delete has already failed, so its two queries are paid
 * for on the error path and never on a successful delete.
 */

/** One relation in the way, and how much of it. */
export type Blocker = {
  /** The referring table's SQL name. */
  table: string;
  /** What that table is called on the screen that shows it, if it has one. */
  label: string;
  count: number;
};

type ConstraintRow = { src_table: string; src_column: string };

/**
 * The foreign keys that would refuse a delete of rows in `table`.
 *
 * `confdeltype` is the referential action as one character. `r` is `RESTRICT`
 * and `a` is `NO ACTION` -- both refuse, and the difference between them is
 * only *when* the check runs, which matters to a transaction and not to this
 * sentence. `c` (cascade), `n` (set null) and `d` (set default) all resolve
 * themselves and are never in the way.
 *
 * Single-column keys only. This schema has no composite foreign key, and a
 * count over one would need a join rather than an equality -- skipping is the
 * honest answer to a shape this cannot describe, and the fallback message is
 * still true.
 */
async function referringColumns(table: string): Promise<ConstraintRow[]> {
  const result = await db.execute<ConstraintRow>(sql`
    select src.relname as src_table, att.attname as src_column
    from pg_constraint con
    join pg_class src on src.oid = con.conrelid
    join pg_class tgt on tgt.oid = con.confrelid
    join pg_namespace tgt_ns on tgt_ns.oid = tgt.relnamespace
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = con.conkey[1]
    where con.contype = 'f'
      and con.confdeltype in ('r', 'a')
      and array_length(con.conkey, 1) = 1
      and tgt_ns.nspname = 'app'
      and tgt.relname = ${table}
  `);
  return result.rows;
}

/**
 * The screen's word for a table, for a message a person reads.
 *
 * Resolved through the form descriptors, because the registry is keyed by
 * screen and this question arrives with a table. A table with no screen is a
 * join table or an inline's child, and its own name with the underscores taken
 * out is the most useful thing left to print.
 */
function tableLabel(table: string, plural: boolean): string {
  for (const [key, model] of Object.entries(ADMIN_FORM_MODELS)) {
    if (getTableName(model.from) !== table) continue;
    const entry = ADMIN_ENTRIES_BY_KEY.get(key);
    if (entry) return (plural ? entry.labelPlural : entry.label).toLowerCase();
  }
  return table.replace(/_/g, " ");
}

/**
 * Every relation that currently holds a reference to this row.
 *
 * Counted per referring *column*, so a table naming the row through two
 * different columns is reported twice -- which is right, because clearing one
 * of them would not be enough.
 */
export async function findBlockers(table: string, id: string): Promise<Blocker[]> {
  const columns = await referringColumns(table);
  if (columns.length === 0) return [];

  const counted = await Promise.all(
    columns.map(async (row) => {
      /*
       * `sql.raw` for the identifiers, and only for them. Both come out of
       * `pg_catalog` -- they are the names Postgres itself holds for tables and
       * columns that exist -- so there is no request data anywhere in this
       * statement. The id stays a bound parameter, as it must.
       */
      const result = await db.execute<{ total: number }>(sql`
        select count(*)::int as total
        from ${sql.raw(`"app"."${row.src_table}"`)}
        where ${sql.raw(`"${row.src_column}"`)} = ${id}
      `);
      const count = Number(result.rows[0]?.total ?? 0);
      return { table: row.src_table, label: tableLabel(row.src_table, count !== 1), count };
    }),
  );

  return counted.filter((blocker) => blocker.count > 0).sort((a, b) => b.count - a.count);
}

/** "3 certifications", "1 experience" -- the count and the noun agreeing. */
const phrase = (blocker: Blocker) => `${blocker.count} ${blocker.label}`;

/** The generic sentence, for when nothing more specific can be established. */
const VAGUE = "Something still refers to this record, so it cannot be deleted yet.";

/**
 * The sentence the form shows when a delete is refused.
 *
 * **Fail-soft, always.** Introspection can fail for reasons that have nothing
 * to do with the delete -- a permission on `pg_catalog`, a connection lost
 * between the two statements -- and the caller is already handling one failure.
 * A second one thrown from here would turn a refused delete into a 500, which
 * is strictly less useful than the sentence this replaced. So anything that
 * goes wrong falls back to it.
 *
 * An empty result falls back too, and that case is real rather than defensive:
 * a `DELETE` can also be refused by a trigger, or by a race in which the last
 * referring row was removed between the failure and this query. Claiming
 * nothing is in the way, on the screen that has just refused, would be worse
 * than saying less.
 */
export async function blockedDeleteMessage(table: string, id: string): Promise<string> {
  let blockers: Blocker[] = [];
  try {
    blockers = await findBlockers(table, id);
  } catch {
    return VAGUE;
  }

  const last = blockers.at(-1);
  if (!last) return VAGUE;

  const named =
    blockers.length === 1
      ? phrase(last)
      : `${blockers.slice(0, -1).map(phrase).join(", ")} and ${phrase(last)}`;

  // "1 experience still refers", "3 certifications still refer". One row of one
  // thing is the only singular case, and it is the common one.
  const verb = blockers.length === 1 && last.count === 1 ? "refers" : "refer";

  return `${named} still ${verb} to this record, so it cannot be deleted yet. Remove or repoint them first.`;
}
