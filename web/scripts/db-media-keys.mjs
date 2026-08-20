import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local", quiet: true });
const sql = postgres(process.env.STORAGE_POSTGRES_URL, { prepare: false, max: 1, ssl: "require" });
const keys = new Set();
for (const t of [
  sql`select image as k from blog_blogimage`,
  sql`select image as k from projects_projectimage`,
  sql`select logo as k from about_organization where logo <> ''`,
  sql`select image as k from about_profile where image <> ''`,
  sql`select author_image as k from blog_blogpost where author_image <> ''`,
]) for (const { k } of await t) if (k) keys.add(k);
const special = [...keys].filter((k) => /[^A-Za-z0-9_.~\-\/]/.test(k));
console.log(`${keys.size} distinct keys; ${special.length} contain characters that need percent-encoding`);
special.slice(0, 15).forEach((k) => console.log("  ", JSON.stringify(k)));
console.log("\nsample:", [...keys].slice(0, 3));
await sql.end();
