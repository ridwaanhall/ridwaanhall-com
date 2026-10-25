import type { ClientBase } from "pg";

import { BACKUP_FORMAT, BACKUP_VERSION, insertOrder, parentsFirst, parseBackup, schemaMismatch, type Backup, type Edge } from "./order";

/**
 * Every row of the `app` schema, out to one JSON file and back in.
 *
 * Written against a bare `pg` client rather than Drizzle, for two reasons: the
 * table list is read from the database at run time, so a table added next
 * month is backed up without anybody remembering to list it; and the same
 * functions serve the admin's buttons and `scripts/backup.mjs`, which has to
 * work against a brand-new database before the application can sign anybody in.
 *
 * Only rows. Uploaded files stay in Supabase Storage, and `media_asset` keeps
 * their keys, so a restored database pointed at the same bucket shows them.
 */

type Schema = {
  tables: string[];
  columns: Map<string, Set<string>>;
  edges: Edge[];
  /** For a table that references itself, the column that does it. */
  selfColumn: Map<string, string>;
};

/** Read from the catalogue every time, never listed: a new table is covered from the moment it exists. */
async function readSchema(client: ClientBase): Promise<Schema> {
  const { rows: tables } = await client.query<{ name: string }>(
    "select tablename as name from pg_tables where schemaname = 'app' order by tablename",
  );
  const { rows: columns } = await client.query<{ table_name: string; column_name: string }>(
    "select table_name, column_name from information_schema.columns where table_schema = 'app'",
  );
  const { rows: keys } = await client.query<{ child: string; parent: string; column_name: string }>(
    `select c.conrelid::regclass::text as child, c.confrelid::regclass::text as parent, a.attname as column_name
     from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
     where c.contype = 'f' and c.connamespace = 'app'::regnamespace`,
  );

  const bare = (name: string) => name.replace(/^app\./, "");
  const byTable = new Map<string, Set<string>>();
  for (const { table_name, column_name } of columns) {
    if (!byTable.has(table_name)) byTable.set(table_name, new Set());
    byTable.get(table_name)!.add(column_name);
  }
  const edges = keys.map((key) => ({ child: bare(key.child), parent: bare(key.parent) }));
  const selfColumn = new Map(
    keys.filter((key) => key.child === key.parent).map((key) => [bare(key.child), key.column_name] as [string, string]),
  );
  return { tables: tables.map((table) => table.name), columns: byTable, edges, selfColumn };
}

/** Double-quoted, for a name that came from the catalogue rather than from a request. */
const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;

/**
 * Every table, read in one snapshot: `repeatable read` means a save landing
 * halfway through cannot leave a child in the file whose parent is not.
 */
export async function exportBackup(client: ClientBase): Promise<Backup> {
  await client.query("begin isolation level repeatable read read only");
  try {
    const schema = await readSchema(client);
    const tables: Backup["tables"] = {};
    for (const table of schema.tables) {
      const { rows } = await client.query<{ rows: Record<string, unknown>[] }>(
        `select coalesce(json_agg(t), '[]'::json) as rows from app.${ident(table)} t`,
      );
      tables[table] = rows[0].rows;
    }
    await client.query("commit");
    return { format: BACKUP_FORMAT, version: BACKUP_VERSION, created_at: new Date().toISOString(), tables };
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

export type RestoreResult = { ok: true; restored: Record<string, number>; applied: boolean } | { ok: false; error: string };

/**
 * Replace every row of `app` with the backup's, in one transaction.
 *
 * All or nothing: every table is emptied and refilled inside the same
 * transaction, so a failure on the fortieth table leaves the database exactly
 * as it was rather than with thirty-nine tables restored. A table the backup
 * does not mention -- one added after it was made -- is left empty.
 *
 * `jsonb_populate_recordset` reads each value back as its column's own type,
 * so a timestamp, a uuid or a jsonb round-trips exactly. Only the columns the
 * backup has are written; any it lacks take their defaults.
 *
 * `dryRun` does every statement and then rolls back: the whole restore is
 * proved against this database without anything changing.
 */
export async function restoreBackup(client: ClientBase, value: unknown, { dryRun = false } = {}): Promise<RestoreResult> {
  const file = parseBackup(value);
  if (typeof file === "string") return { ok: false, error: file };

  await client.query("begin");
  try {
    const schema = await readSchema(client);
    const problems = schemaMismatch(file, schema.columns);
    if (problems.length > 0) {
      await client.query("rollback");
      return { ok: false, error: `This backup does not fit this database: ${problems.slice(0, 5).join("; ")}.` };
    }

    await client.query(`truncate ${schema.tables.map((table) => `app.${ident(table)}`).join(", ")} restart identity cascade`);

    const restored: Record<string, number> = {};
    for (const table of insertOrder(schema.tables, schema.edges)) {
      let rows = file.tables[table] ?? [];
      restored[table] = rows.length;
      if (rows.length === 0) continue;

      const self = schema.selfColumn.get(table);
      if (self) rows = parentsFirst(rows, self);

      const present = [...schema.columns.get(table)!].filter((column) => rows.some((row) => column in row));
      const list = present.map(ident).join(", ");
      await client.query(
        `insert into app.${ident(table)} (${list}) select ${list} from jsonb_populate_recordset(null::app.${ident(table)}, $1::jsonb)`,
        [JSON.stringify(rows)],
      );
    }

    await client.query(dryRun ? "rollback" : "commit");
    return { ok: true, restored, applied: !dryRun };
  } catch (error) {
    await client.query("rollback");
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** A backup's file name: the site and the moment, sortable. */
export const backupFileName = (at = new Date()) => `ridwaanhall-com-${at.toISOString().slice(0, 19).replace(/[:T]/g, "-")}.backup.json`;
