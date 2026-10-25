/**
 * The pure half of backup and restore: what order rows go back in, and
 * whether a file is a backup at all. No database here, so the unit suite
 * holds it.
 *
 * Order matters because every foreign key in `app` is checked immediately --
 * none is deferrable (`drizzle/CLAUDE.md`) -- so a child inserted before its
 * parent is an error on that statement, not something a commit sorts out.
 */

export type Edge = { child: string; parent: string };

/**
 * Tables parents-first: every table after each table it references.
 *
 * Kahn's algorithm, taking the ready tables alphabetically, so the same schema
 * always restores in the same order and a failure reproduces. A table that
 * references itself is not a dependency on anything else; its rows are ordered
 * by `parentsFirst` instead. A cycle between two tables would make any order
 * wrong, so it is refused rather than guessed at.
 */
export function insertOrder(tables: string[], edges: Edge[]): string[] {
  const known = new Set(tables);
  const waitingOn = new Map(tables.map((table) => [table, new Set<string>()]));
  for (const { child, parent } of edges) {
    if (child !== parent && known.has(child) && known.has(parent)) waitingOn.get(child)!.add(parent);
  }

  const order: string[] = [];
  while (order.length < tables.length) {
    const ready = [...waitingOn].filter(([, parents]) => parents.size === 0).map(([table]) => table).sort();
    if (ready.length === 0) throw new Error(`These tables reference each other in a cycle: ${[...waitingOn.keys()].sort().join(", ")}`);
    for (const table of ready) {
      order.push(table);
      waitingOn.delete(table);
      for (const parents of waitingOn.values()) parents.delete(table);
    }
  }
  return order;
}

/**
 * One table's rows with every parent before its children, for a table that
 * references itself: a reply after the message it answers, a sub-section
 * after its section. A row whose parent is not in the set is a root.
 */
export function parentsFirst<T extends Record<string, unknown>>(rows: T[], parentKey: string, idKey = "id"): T[] {
  const ids = new Set(rows.map((row) => row[idKey]));
  const placed = new Set<unknown>();
  const order: T[] = [];
  let pending = rows;
  while (pending.length > 0) {
    const next: T[] = [];
    for (const row of pending) {
      const parent = row[parentKey];
      if (parent == null || !ids.has(parent) || placed.has(parent)) {
        order.push(row);
        placed.add(row[idKey]);
      } else {
        next.push(row);
      }
    }
    if (next.length === pending.length) throw new Error(`Rows whose ${parentKey} form a cycle cannot be restored.`);
    pending = next;
  }
  return order;
}

/**
 * What the reader types to restore, so it is never one stray click. Here
 * rather than beside the action: a `"use server"` module may export only
 * functions, and a constant from a client module is not that constant on the
 * server (root `CLAUDE.md`).
 */
export const RESTORE_CONFIRMATION = "RESTORE";

export const BACKUP_FORMAT = "ridwaanhall-com-backup";
export const BACKUP_VERSION = 1;

export type Backup = {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  created_at: string;
  tables: Record<string, Record<string, unknown>[]>;
};

/** The shape of a backup file, or a sentence saying what is wrong with it. */
export function parseBackup(value: unknown): Backup | string {
  if (!value || typeof value !== "object") return "This is not a backup file.";
  const file = value as Partial<Backup>;
  if (file.format !== BACKUP_FORMAT) return "This is not a backup made by this site.";
  if (file.version !== BACKUP_VERSION) return `This backup is format version ${String(file.version)}; this site reads version ${BACKUP_VERSION}.`;
  if (!file.tables || typeof file.tables !== "object" || Array.isArray(file.tables)) return "The backup has no tables.";
  for (const [table, rows] of Object.entries(file.tables)) {
    if (!/^[a-z][a-z0-9_]*$/.test(table)) return `"${table}" is not a table name.`;
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || Array.isArray(row))) {
      return `The rows for ${table} are not a list of records.`;
    }
  }
  return file as Backup;
}

/**
 * What a backup holds that this database does not: a table or a column that
 * does not exist here. Restoring it would silently drop that data, so it is
 * refused. The reverse -- a column here the backup lacks -- is fine: the row
 * takes the column's default, which is what an older backup needs.
 */
export function schemaMismatch(file: Backup, columns: Map<string, Set<string>>): string[] {
  const problems: string[] = [];
  for (const [table, rows] of Object.entries(file.tables)) {
    const here = columns.get(table);
    if (!here) {
      problems.push(`table ${table} does not exist here`);
      continue;
    }
    const keys = new Set(rows.flatMap((row) => Object.keys(row)));
    for (const key of keys) if (!here.has(key)) problems.push(`column ${table}.${key} does not exist here`);
  }
  return problems;
}
