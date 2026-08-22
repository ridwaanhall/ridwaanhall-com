import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as relations from "./relations";
import * as schema from "./schema";

/**
 * Postgres connection to Supabase, through the transaction-mode pooler.
 *
 * **The driver choice is not incidental.** This started on `postgres.js`, which
 * pipelines concurrent queries onto a single socket. Under pgbouncer's
 * transaction pooling that pipeline stalls, and the stall is permanent -- the
 * connection never recovers, so every later query on it hangs too, including
 * sequential ones. Measured against this database:
 *
 *              postgres.js          node-postgres
 *   max=1,  1        391ms                  275ms
 *   max=1,  4     deadlock                      -
 *   max=1, 20     deadlock                  680ms
 *   max=5, 20     deadlock                  301ms
 *   max=5, 100           -                  687ms
 *
 * The postgres.js failures are not even a clean threshold -- four and five
 * concurrent queries deadlocked while six succeeded -- which is what a race
 * looks like rather than a limit. `node-postgres` queues per client and sends
 * one query at a time, which is exactly the behaviour transaction pooling
 * requires, and it has no pipelining to switch off.
 *
 * This matters because the data layer deliberately fans out with `Promise.all`,
 * and the sitemap fans out further still. On postgres.js that produced a route
 * that hung for five minutes and then wedged every subsequent request.
 *
 * Two further settings are correctness requirements under the pooler:
 *
 * - **No prepared statements.** Transaction pooling hands a client a different
 *   server connection per transaction, so a statement prepared on one is not
 *   there on the next. This is the same constraint Django met with
 *   `DISABLE_SERVER_SIDE_CURSORS`. `node-postgres` only prepares when a query
 *   is given a `name`, and Drizzle does not, so there is nothing to disable.
 * - **TLS is configured here, not in the URL.** `pg` now reads
 *   `sslmode=require` as `verify-full`, which Supabase's pooler certificate
 *   does not satisfy -- it fails with "self-signed certificate in certificate
 *   chain". The parameter is stripped and TLS set explicitly so the intent is
 *   visible rather than hidden in a query string.
 *
 * Opening a connection to Supabase costs ~190ms (TCP + TLS + auth), so the pool
 * is memoised on `globalThis` -- both to survive Next's dev-server hot reloads
 * and to be reused by a warm serverless instance across requests.
 */
const rawConnectionString = process.env.STORAGE_POSTGRES_URL;

if (!rawConnectionString) {
  throw new Error(
    "STORAGE_POSTGRES_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

function connectionString(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return parsed.toString();
}

const globalForDb = globalThis as unknown as { __pool?: Pool };

const pool =
  globalForDb.__pool ??
  new Pool({
    connectionString: connectionString(rawConnectionString),
    // Small enough that concurrent lambdas cannot exhaust the pooler, large
    // enough that one request's fan-out does not serialise end to end.
    max: 5,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__pool = pool;
}

export const db = drizzle(pool, { schema: { ...schema, ...relations } });

export { pool, schema };
