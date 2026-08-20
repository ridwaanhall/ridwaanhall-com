import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js loads .env.local itself at runtime; drizzle-kit runs outside Next,
// so it needs to be told. Introspection and DDL both go through the *direct*
// (non-pooling) connection -- neither works reliably behind pgbouncer's
// transaction-mode pooling, which is the same reason Django reached for
// STORAGE_POSTGRES_URL_NON_POOLING for `migrate` and `loaddata`.
config({ path: ".env.local", quiet: true });

const url = process.env.STORAGE_POSTGRES_URL_NON_POOLING;
if (!url) {
  throw new Error("STORAGE_POSTGRES_URL_NON_POOLING is not set (see .env.example)");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
  // Only the application schema. Supabase's own schemas (auth, storage,
  // realtime, vault, ...) are managed by Supabase and must not be introspected
  // into our schema file.
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
