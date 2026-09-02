import { and, eq, sql, type SQL } from "drizzle-orm";
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

/**
 * Every value of `value` for the matching rows, joined into one string.
 *
 * `lookup` above takes the first row and is wrong wherever a record can have
 * more than one -- an account's sign-in providers are the case here. One
 * account holds one identity today, because a second provider offering an
 * address an account already uses is refused rather than linked, so `lookup`
 * would have looked correct indefinitely and then quietly dropped a provider
 * the day that changed.
 *
 * Sorted, so the string is stable: without `order by` the same account can
 * render "google, github" and "github, google" on consecutive requests, which
 * reads as data changing under the reader and makes the column unsortable in
 * any meaningful sense.
 *
 * Through the query builder like its neighbours, and for the same reason -- a
 * column interpolated into a raw `sql` template renders with its bare name, and
 * a correlated subquery is exactly where that binds to the wrong table.
 */
export function joined(value: PgColumn, key: PgColumn, outer: PgColumn): SQL<string> {
  return sql<string>`coalesce((${qb
    .select({ value: sql`string_agg(distinct ${value}, ', ' order by ${value})` })
    .from(key.table as PgTable)
    .where(eq(key, outer))}), '')`;
}

/** `(select count(*) from <table> where <key> = <outer>)`. */
export function countWhere(key: PgColumn, outer: PgColumn): SQL<number> {
  return sql<number>`(${qb
    .select({ value: sql<number>`count(*)::int` })
    .from(key.table as PgTable)
    .where(eq(key, outer))})`;
}

/**
 * The same, narrowed by something else on the inner table.
 *
 * This is the one that was missing, and its absence cost a screen. The access
 * list counts the rows of `admin_access` where `can_view` is true, which
 * `countWhere` alone cannot express -- so it was written out by hand as a raw
 * `sql` template, and the correlation went exactly where the header of this
 * file says it goes. `${account.id}` rendered as the bare name `"id"`,
 * `admin_access` has an `id` column of its own, and the condition became
 * `account_id = admin_access.id`: a comparison of two unrelated keys that
 * matches nothing. Every staff account's Screens column read 0 while the
 * database held thirty-four grants for each of them, and the header on that
 * column sorted by the same constant.
 *
 * `and()` rather than a second argument to `where`, so the extra condition is
 * the caller's to write with real columns and goes through the query builder
 * with the rest of it.
 */
export function countWhereAnd(key: PgColumn, outer: PgColumn, extra: SQL): SQL<number> {
  return sql<number>`(${qb
    .select({ value: sql<number>`count(*)::int` })
    .from(key.table as PgTable)
    .where(and(eq(key, outer), extra))})`;
}
