import { config } from "dotenv"; import pg from "pg";
config({ path: ".env.local", quiet: true });
const u = new URL(process.env.STORAGE_POSTGRES_URL); u.searchParams.delete("sslmode");
const pool = new pg.Pool({ connectionString: u.toString(), ssl: { rejectUnauthorized: false }, max: 1 });
const sql = process.argv[2];
const r = await pool.query(sql);
console.log(JSON.stringify(r.rows, null, 1));
await pool.end();
