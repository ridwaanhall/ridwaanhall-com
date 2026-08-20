/** Extract every CSS class string stored in JSON content columns.
 *  Tailwind cannot see these -- they exist only in the database. */
import { config } from "dotenv";
import postgres from "postgres";
config({ path: ".env.local", quiet: true });
const sql = postgres(process.env.STORAGE_POSTGRES_URL, { prepare: false, max: 1, ssl: "require" });

const classes = new Set();
const walk = (v) => {
  if (Array.isArray(v)) return v.forEach(walk);
  if (v && typeof v === "object") {
    for (const [k, val] of Object.entries(v)) {
      if (k === "class" && typeof val === "string") val.split(/\s+/).filter(Boolean).forEach((c) => classes.add(c));
      else walk(val);
    }
  }
};

for (const { content } of await sql`select content from blog_blogpost`) walk(content);
for (const { description } of await sql`select description from projects_project`) walk(description);
for (const { items } of await sql`select items from legal_legalsection`) walk(items);
for (const { stories } of await sql`select stories from about_profile`) walk(stories);

console.log(`${classes.size} distinct classes stored in the database:\n`);
console.log([...classes].sort().join("\n"));
await sql.end();
