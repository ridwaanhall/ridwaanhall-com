import { eq, sql, type SQL } from "drizzle-orm";
import { QueryBuilder, type PgColumn, type PgTable } from "drizzle-orm/pg-core";

/**
 * Correlated scalar subqueries, correctly qualified.
 *
 * **Do not write these as a raw `sql` template.** Drizzle renders a column
 * interpolated into `sql` with its *bare* name, not `"table"."column"`, and a
 * correlated subquery is precisely the place where that decides which table a
 * name binds to. Written by hand, the users screen produced
 *
 *     coalesce((select "is_author" from "guestbook_userprofile"
 *               where "user_id" = "id"), false)
 *
 * in which `"id"` binds to `guestbook_userprofile.id` rather than the
 * `auth_user.id` it was meant to correlate with -- so the condition reads
 * `user_id = id` on one table and means nothing. Passing the same thing through
 * the query builder gives
 *
 *     (select "is_author" from "guestbook_userprofile"
 *      where "guestbook_userprofile"."user_id" = "auth_user"."id")
 *
 * which is the intended query. The lookups that happened to work before did so
 * only because the outer column's name did not exist on the inner table, so
 * Postgres resolved it outward by elimination -- luck, not correctness, and it
 * ran out on the first self-referential one.
 *
 * `QueryBuilder` builds SQL without a connection, so this module stays free of
 * `lib/db/client.ts` and of `server-only`, and the check scripts can import the
 * descriptors that use it.
 */
const qb = new QueryBuilder();

/**
 * `(select <value> from <table> where <key> = <outer>)`.
 *
 * `limit(1)` is not decoration: Postgres raises if a scalar subquery returns
 * more than one row, and every use here is a lookup by primary key that cannot
 * -- until someone points one at a column that is not unique.
 */
export function lookup<T>(value: PgColumn, key: PgColumn, outer: PgColumn): SQL<T> {
  return sql<T>`(${qb.select({ value }).from(key.table as PgTable).where(eq(key, outer)).limit(1)})`;
}

/** The same, with a fallback for the rows that have no matching record. */
export function lookupOr<T>(value: PgColumn, key: PgColumn, outer: PgColumn, fallback: T): SQL<T> {
  return sql<T>`coalesce(${lookup<T>(value, key, outer)}, ${fallback})`;
}

/** `(select count(*) from <table> where <key> = <outer>)`. */
export function countWhere(key: PgColumn, outer: PgColumn): SQL<number> {
  return sql<number>`(${qb
    .select({ value: sql<number>`count(*)::int` })
    .from(key.table as PgTable)
    .where(eq(key, outer))})`;
}
