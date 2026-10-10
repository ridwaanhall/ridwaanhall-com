# The database connection

Guidance for working in `lib/db/`. The root `CLAUDE.md` covers everything that applies everywhere.

@../../drizzle/CLAUDE.md

## Other things worth knowing here

- **`node-postgres`, never `postgres.js`.** postgres.js pipelines concurrent
  queries onto one socket, which stalls permanently under Supabase's
  transaction-mode pooler — and not at a clean threshold. See the measurements
  in `lib/db/client.ts`.
- **TLS is configured in code, not in the connection URL.** `pg` reads
  `sslmode=require` as `verify-full`, which Supabase's pooler certificate does
  not satisfy.
