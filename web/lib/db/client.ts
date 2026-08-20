import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as relations from "./relations";
import * as schema from "./schema";

/**
 * Postgres connection to Supabase.
 *
 * Runtime traffic goes through the **pooled** (pgbouncer, transaction-mode)
 * URL. Two settings below are not tuning knobs but correctness requirements
 * under that pooler, and both mirror decisions the Django app had to make:
 *
 * - `prepare: false` -- transaction-mode pooling hands a client a different
 *   server connection per transaction, so a prepared statement created on one
 *   is not there on the next. This is the postgres.js equivalent of Django's
 *   `DISABLE_SERVER_SIDE_CURSORS`.
 * - `max: 5` -- pool size, and it must not be 1.
 *
 *   One socket per serverless invocation looks like the obvious choice, since
 *   an invocation serves a single request. It is wrong, and quietly so:
 *   postgres.js pipelines concurrent queries onto a single connection, and
 *   under pgbouncer's transaction-mode pooling that pipeline deadlocks. Eight
 *   concurrent `select 1`s through a `max: 1` client never return at all,
 *   while the same eight through a `max: 8` client finish in 376ms -- measured
 *   against this database, not inferred.
 *
 *   That matters here because the data layer deliberately issues its queries
 *   with `Promise.all`: getAboutData, getBlogs and getProjects all do. With
 *   `max: 1` every one of them would hang until the platform killed the
 *   function, which the visitor would see as a gateway timeout. Five is well
 *   under what the pooler is there to protect and covers the widest fan-out
 *   any single page performs.
 *
 * There is deliberately **no `connection: { statement_timeout }`** here. It was
 * tried, and the pooler silently discards it: with `statement_timeout` set to
 * 3s, `select pg_sleep(10)` still ran for 10.4s and returned normally. A
 * setting that looks like a safety net but is not is worse than none, so it is
 * left out rather than left in. Bounding a slow query has to happen either at
 * the application level (the `Promise.race` deadline pattern this project
 * already uses for storage uploads and external APIs) or by setting the
 * timeout on the database role in Supabase, where the pooler cannot drop it.
 *
 * Opening a connection to Supabase costs ~190ms (TCP + TLS + auth), so the
 * client is memoised on `globalThis` -- both to survive Next's dev-server hot
 * reloads and to be reused by a warm serverless instance across requests.
 */
const connectionString = process.env.STORAGE_POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "STORAGE_POSTGRES_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

const globalForDb = globalThis as unknown as {
  __sql?: ReturnType<typeof postgres>;
};

const sql =
  globalForDb.__sql ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
    connect_timeout: 15,
    ssl: "require",
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__sql = sql;
}

export const db = drizzle(sql, { schema: { ...schema, ...relations } });

export { schema, sql };
