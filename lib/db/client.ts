import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

/**
 * Postgres connection to Supabase.
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
 *   there on the next. `node-postgres` only prepares when a query is given a
 *   `name`, and Drizzle does not, so there is nothing to disable here -- but it
 *   is why server-side cursors are unusable through this connection too.
 * - **TLS is configured here, not in the URL.** `pg` now reads
 *   `sslmode=require` as `verify-full`, which Supabase's pooler certificate
 *   does not satisfy -- it fails with "self-signed certificate in certificate
 *   chain". The parameter is stripped and TLS set explicitly so the intent is
 *   visible rather than hidden in a query string.
 *
 * Opening a connection to Supabase costs ~190ms (TCP + TLS + auth), so the pool
 * is memoised on `globalThis` -- both to survive Next's dev-server hot reloads
 * and to be reused by a warm instance across requests.
 */

/**
 * Where the connection comes from depends on the runtime, and there are exactly
 * two.
 *
 * On Node -- `next dev`, `next build`, and every harness under `scripts/` -- it
 * is `STORAGE_POSTGRES_URL`, the Supabase transaction pooler, reached directly.
 * Nothing about that has changed.
 *
 * On Cloudflare Workers it is the `HYPERDRIVE` binding, and that is not a
 * preference. Workers validate TLS against the public CA bundle with no way to
 * opt out, and the certificate Supabase's pooler presents is the one the note
 * above already records as failing `verify-full` -- so a socket opened from the
 * Worker straight to Supabase cannot complete a handshake at all, whatever the
 * driver does. Hyperdrive terminates that TLS on Cloudflare's own network,
 * where the trust decision is configurable, and hands the Worker a plaintext
 * connection over a loopback socket. It is the only route to this database from
 * a Worker.
 *
 * `navigator.userAgent` is the runtime's own name for itself, which is what
 * makes it safe to read at module scope: no import has to succeed for the
 * branch to be chosen, so the Node path never loads the Cloudflare adapter.
 */
const onWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

const rawConnectionString = process.env.STORAGE_POSTGRES_URL;

/*
 * Still an import-time failure off Workers, and deliberately so: a missing
 * database URL is a misconfigured checkout, and the message naming
 * `.env.example` is worth more at import than at the first query several frames
 * deep. On Workers there is nothing to check here -- the binding does not exist
 * until a request does.
 */
if (!onWorkers && !rawConnectionString) {
  throw new Error(
    "STORAGE_POSTGRES_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

function connectionString(url: string): string {
  const parsed = new URL(url);
  parsed.searchParams.delete("sslmode");
  return parsed.toString();
}

/*
 * The adapter declares `CloudflareEnv` with the bindings it owns and no others,
 * so `HYPERDRIVE` has to be added here. `cloudflare-env.d.ts` is generated with
 * `--include-env=false` on purpose: the interface wrangler would generate is
 * built from whatever sits in the local `.env.local`, which makes the file
 * differ per machine, and it retypes every `process.env` key as a plain
 * `string` -- quietly deleting the `undefined` that half the guards in this
 * codebase are checking for.
 */
declare global {
  interface CloudflareEnv {
    HYPERDRIVE?: Hyperdrive;
  }
}

type PoolOrigin = {
  connectionString: string;
  ssl: false | { rejectUnauthorized: boolean };
};

async function poolOrigin(): Promise<PoolOrigin> {
  if (onWorkers) {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = await getCloudflareContext({ async: true });
    if (!env.HYPERDRIVE) {
      throw new Error(
        "The HYPERDRIVE binding is missing. Every query from a Worker goes through it -- see wrangler.jsonc.",
      );
    }
    // No TLS on this hop: it terminates inside the isolate. The encrypted leg
    // is Hyperdrive's own, from Cloudflare's network to Supabase.
    return { connectionString: env.HYPERDRIVE.connectionString, ssl: false };
  }
  return {
    connectionString: connectionString(rawConnectionString!),
    ssl: { rejectUnauthorized: false },
  };
}

const globalForDb = globalThis as unknown as { __pool?: Promise<Pool> };

function openPool(): Promise<Pool> {
  return (globalForDb.__pool ??= poolOrigin().then(
    (origin) =>
      new Pool({
        ...origin,
        // Small enough that concurrent instances cannot exhaust the pooler,
        // large enough that one request's fan-out does not serialise end to end.
        max: 5,
        idleTimeoutMillis: 20_000,
        connectionTimeoutMillis: 15_000,
      }),
  ));
}

/*
 * The pool is built on first use rather than at import, and this proxy is what
 * keeps that invisible to the twenty modules that import `db`.
 *
 * It has to be deferred because a Worker's bindings do not exist until a
 * request does: `getCloudflareContext` is async, and there is no synchronous
 * way to reach `HYPERDRIVE` from module scope.
 *
 * It has to be a `Pool` rather than a plain object because Drizzle decides
 * whether to pin one connection for a transaction by testing
 * `client instanceof Pool` *and* the prototype's constructor name. A bare
 * target fails both, and every `db.transaction()` in `lib/actions/admin.ts`
 * would then run its statements on separate pooled connections while still
 * type checking, building and -- most of the time -- appearing to work.
 * Proxying an unconnected `Pool` keeps both tests true, and costs an object:
 * `new Pool()` opens nothing, since `pg` connects on first query.
 *
 * `end` deliberately does not open a pool only to close it. The harnesses call
 * it from a `finally`, which is reached whether or not anything queried.
 */
const pool = new Proxy(new Pool(), {
  get(target, property, receiver) {
    if (property === "end") {
      return async () => {
        const opened = globalForDb.__pool;
        if (opened) await (await opened).end();
      };
    }
    if (property === "query" || property === "connect") {
      return (...args: unknown[]) =>
        openPool().then((opened) =>
          (opened[property] as (...rest: unknown[]) => unknown)(...args),
        );
    }
    return Reflect.get(target, property, receiver);
  },
});

/*
 * No `schema` argument. That option exists to power `db.query.<table>`, the
 * relational query builder, and nothing here uses it -- every read is written
 * as an explicit `select`, which is what makes the joins and the ordering
 * visible at the call site. Handing Drizzle a schema it never consults costs a
 * module graph in every server bundle and buys nothing.
 */
export const db = drizzle(pool);

export { pool };
