/**
 * Keys for the rows the harnesses drive, resolved rather than written down.
 *
 * Every one of these used to be a literal: staff was `1`, the non-staff reader
 * was `4`, the experience whose `responsibilities` get round-tripped was `1`.
 * That worked while keys were serial and the harness could count on the order
 * rows were inserted in.
 *
 * Keys are uuids now, and there is nothing stable to write down -- a fresh
 * migration produces a different set. Worse, a stale literal does not fail
 * loudly: `/admin/experience/1` is a well-formed URL that answers "not found",
 * so a harness driving it reads a page that never rendered a form and reports
 * whatever it found there.
 *
 * So each is looked up by something that does not change: a flag, a slug, a
 * name. The lookups are deliberately narrow and each throws if it finds
 * nothing, because a missing fixture is a broken run and not an empty result.
 */
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local", quiet: true });

let pool;

function client() {
  if (!pool) {
    // `pg` reads `sslmode=require` as `verify-full`, which the pooler
    // certificate does not satisfy -- the same reason `lib/db/client.ts`
    // configures TLS in code.
    const url = new URL(process.env.STORAGE_POSTGRES_URL);
    url.searchParams.delete("sslmode");
    pool = new pg.Pool({
      connectionString: url.toString(),
      max: 1,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function one(what, sql, params = []) {
  const { rows } = await client().query(sql, params);
  if (!rows[0]) throw new Error(`No ${what} in the database; the harness has nothing to drive.`);
  return rows[0].id;
}

/**
 * The site owner: the account the admin screens are opened as.
 *
 * **A superuser, said in the query.** It used to ask only for staff and get one
 * by luck of `joined_at` -- which was harmless while every staff account held
 * every grant, and stopped being harmless the moment they were narrowed to the
 * Editor preset. A sweep that opens all thirty-five screens has to be driven by
 * the one role that can open all thirty-five, or half of it reports not-found
 * and calls it a broken screen.
 */
export const staffAccountId = () =>
  one(
    "active superuser account",
    `select id from app.account where is_superuser and is_active order by joined_at limit 1`,
  );

/** A signed-in reader with no staff flag, for proving the gate refuses them. */
export const nonStaffAccountId = () =>
  one("active non-staff account", `select id from app.account where not is_staff and is_active order by joined_at limit 1`);

/** A row of `table` whose `column` equals `value`. */
export const idWhere = (table, column, value) =>
  one(`${table} with ${column} = ${value}`, `select id from app.${table} where "${column}" = $1 limit 1`, [value]);

