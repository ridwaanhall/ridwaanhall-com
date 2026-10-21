/**
 * Save every admin form without touching it, and prove nothing moved.
 *
 * An untouched save is the commonest thing anybody does in an admin -- open a
 * record to read it, press Save out of habit -- and it is the one nothing else
 * here exercises: every other harness changes something first, so a save that
 * rewrites a field on its own way through passes all of them. The experience
 * form did exactly that, and the only symptom was a record that read
 * differently after a save nobody made a change in.
 *
 * For each screen with a form, one existing row is opened, its record, every
 * inline row under it, every join row it owns and every image description is
 * read straight from the database, Save is pressed, and the same reads are
 * repeated once the server says it committed. Join-table ids are ignored: the
 * many-to-many write replaces its pairs by design, and a pair is what it means.
 *
 * Whatever did move is put back in the `finally`, column by column from the
 * snapshot, and the restore is then proved by reading it again.
 *
 *   npx tsx --conditions=react-server scripts/check-admin-noop-save.mjs [base] [key…]
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { chromium } = await import("playwright");
const { staffAccountId } = await import("./fixture-ids.mjs");
const { encode } = await import("next-auth/jwt");
const { pool } = await import("../lib/db/client.ts");
const { ADMIN_ENTRIES_BY_KEY, adminPath } = await import("../lib/admin/registry.ts");
const { ADMIN_FORM_MODELS } = await import("../lib/admin/models/index.ts");
const { formFields } = await import("../lib/admin/form.ts");
const { getTableName } = await import("drizzle-orm");

const BASE = process.argv[2]?.startsWith("http") ? process.argv[2] : "http://localhost:3000";
const ONLY = process.argv.slice(2).filter((arg) => !arg.startsWith("http"));
const COOKIE = "authjs.session-token";

const ident = (name) => `"${name.replaceAll('"', '""')}"`;
const table = (pgTable) => `app.${ident(getTableName(pgTable))}`;

/** A row as JSON, so a date, a jsonb and a timestamp all compare as text. */
async function rows(sqlTable, where, params, order) {
  const { rows: found } = await pool.query(
    `select to_jsonb(t) as row from ${sqlTable} t where ${where} order by ${order}`,
    params,
  );
  return found.map((entry) => entry.row);
}

async function snapshot(model, id) {
  const shot = { record: await rows(table(model.from), `${ident(model.pk.name)} = $1`, [id], "1") };
  for (const inline of model.inlines ?? []) {
    shot[`inline:${inline.name}`] = await rows(
      table(inline.table),
      `${ident(inline.parent.name)} = $1`,
      [id],
      ident(inline.pk.name),
    );
  }
  for (const field of formFields(model)) {
    const source = field.manyToMany;
    if (!source) continue;
    const found = await rows(table(source.join), `${ident(source.ownerFk.name)} = $1`, [id], ident(source.targetFk.name));
    shot[`join:${field.name}`] = found;
  }
  return shot;
}

async function alts() {
  const { rows: found } = await pool.query("select id, alt from app.media_asset order by id");
  return new Map(found.map((row) => [row.id, row.alt]));
}

/** Join rows compare without their own key -- the write replaces the pair. */
const withoutId = (row) => Object.fromEntries(Object.entries(row).filter(([column]) => column !== "id"));
const comparable = (key, list) =>
  key.startsWith("join:") ? list.map((row) => JSON.stringify(withoutId(row))).sort() : list.map((row) => JSON.stringify(row));

function differences(before, after) {
  const found = [];
  for (const key of Object.keys(before)) {
    const a = comparable(key, before[key]);
    const b = comparable(key, after[key]);
    if (a.length !== b.length) {
      found.push(`${key}: ${a.length} rows became ${b.length}`);
      continue;
    }
    for (let index = 0; index < a.length; index++) {
      if (a[index] === b[index]) continue;
      const left = JSON.parse(a[index]);
      const right = JSON.parse(b[index]);
      for (const column of Object.keys(left)) {
        if (JSON.stringify(left[column]) !== JSON.stringify(right[column])) {
          found.push(`${key}.${column}: ${JSON.stringify(left[column])?.slice(0, 120)} -> ${JSON.stringify(right[column])?.slice(0, 120)}`);
        }
      }
    }
  }
  return found;
}

/** Put one table's rows for this record back exactly as they were. */
async function restoreRows(sqlTable, pkName, fkName, ownerId, original) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const ids = original.map((row) => row[pkName]);
    await client.query(
      `delete from ${sqlTable} where ${ident(fkName)} = $1 and not (${ident(pkName)} = any($2::uuid[]))`,
      [ownerId, ids],
    );
    for (const row of original) {
      const columns = Object.keys(row).filter((column) => column !== pkName);
      const assignments = columns.map((column) => `${ident(column)} = r.${ident(column)}`).join(", ");
      const { rowCount } = await client.query(
        `update ${sqlTable} t set ${assignments} from jsonb_populate_record(null::${sqlTable}, $1) r where t.${ident(pkName)} = $2`,
        [row, row[pkName]],
      );
      if (rowCount === 0) {
        await client.query(`insert into ${sqlTable} select * from jsonb_populate_record(null::${sqlTable}, $1)`, [row]);
      }
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

async function restore(model, id, shot) {
  const [record] = shot.record;
  if (record) await restoreRows(table(model.from), model.pk.name, model.pk.name, id, [record]);
  for (const inline of model.inlines ?? []) {
    await restoreRows(table(inline.table), inline.pk.name, inline.parent.name, id, shot[`inline:${inline.name}`]);
  }
  for (const field of formFields(model)) {
    const source = field.manyToMany;
    if (!source) continue;
    const sqlTable = table(source.join);
    await pool.query(`delete from ${sqlTable} where ${ident(source.ownerFk.name)} = $1`, [id]);
    for (const row of shot[`join:${field.name}`]) {
      await pool.query(`insert into ${sqlTable} select * from jsonb_populate_record(null::${sqlTable}, $1)`, [row]);
    }
  }
}

const STAFF_ID = await staffAccountId();
const token = await encode({
  token: { sub: STAFF_ID },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE,
  maxAge: 60 * 30,
});

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addCookies([{ name: COOKIE, value: token, domain: "localhost", path: "/" }]);
const page = await context.newPage();

const failures = [];
const touched = [];
const altsBefore = await alts();

try {
  for (const [key, model] of Object.entries(ADMIN_FORM_MODELS)) {
    if (ONLY.length && !ONLY.includes(key)) continue;
    const entry = ADMIN_ENTRIES_BY_KEY.get(key);
    if (!entry) continue;

    // The owner's own account is skipped: a save there writes their flags, and
    // a harness is the last thing that should risk the only way back in.
    const exclude = getTableName(model.from) === "account" ? `where ${ident(model.pk.name)} <> $1` : "";
    const { rows: picked } = await pool.query(
      `select ${ident(model.pk.name)} as id from ${table(model.from)} ${exclude} order by 1 limit 1`,
      exclude ? [STAFF_ID] : [],
    );
    const id = picked[0]?.id;
    if (!id) {
      console.log(`  skip  ${key}  (no rows)`);
      continue;
    }

    const before = await snapshot(model, id);
    touched.push({ model, id, before });

    const url = entry.singleton ? adminPath(entry) : `${adminPath(entry)}/${id}`;
    await page.goto(`${BASE}${url}`, { waitUntil: "networkidle" });
    const save = page.getByRole("button", { name: /^Save$/ }).first();
    if (!(await save.count())) {
      console.log(`  skip  ${key}  (no Save button at ${url})`);
      continue;
    }
    await save.click();
    const notice = page.getByText(/Saved\.|No changes to save\.|need attention|not permitted|already uses/).first();
    await notice.waitFor({ timeout: 20000 });
    const said = (await notice.textContent())?.trim();

    const after = await snapshot(model, id);
    const diff = differences(before, after);
    if (diff.length === 0 && /Saved|No changes/.test(said ?? "")) {
      console.log(`  ok    ${key}  (${said})`);
    } else {
      failures.push(key);
      console.log(`  FAIL  ${key}  (${said})`);
      for (const line of diff) console.log(`          ${line}`);
    }
    await page.goto("about:blank");
  }

  const altsAfter = await alts();
  const altChanges = [...altsBefore].filter(([id, alt]) => altsAfter.get(id) !== alt);
  if (altChanges.length) {
    failures.push("media_asset.alt");
    console.log(`  FAIL  ${altChanges.length} image descriptions changed`);
  } else {
    console.log("  ok    no image description changed");
  }
} finally {
  await context.close();
  await browser.close();

  let unrestored = 0;
  for (const { model, id, before } of touched) {
    const now = await snapshot(model, id);
    if (differences(before, now).length === 0) continue;
    await restore(model, id, before);
    const proved = await snapshot(model, id);
    if (differences(before, proved).length > 0) {
      unrestored += 1;
      console.log(`  RESTORE FAILED  ${model.key} ${id}`);
    } else {
      console.log(`  restored  ${model.key} ${id}`);
    }
  }
  const altsNow = await alts();
  for (const [id, alt] of altsBefore) {
    if (altsNow.get(id) !== alt) await pool.query("update app.media_asset set alt = $1 where id = $2", [alt, id]);
  }
  await pool.end();
  if (unrestored) process.exitCode = 2;
}

console.log(failures.length ? `\n${failures.length} screen(s) changed data on an untouched save.` : "\nAll clear.");
if (failures.length) process.exitCode = 1;
