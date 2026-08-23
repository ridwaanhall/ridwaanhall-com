/**
 * Loaded before any test module, via `--import` in the `test` script.
 *
 * `lib/db/client.ts` throws at import when `STORAGE_POSTGRES_URL` is unset, and
 * a good deal of otherwise-pure code sits downstream of it -- the SEO builders
 * reach it through `lib/data/`, for instance. So a value is set here, before the
 * first module loads, purely so the import graph resolves.
 *
 * **It is deliberately not a real one, and it is set unconditionally.** Node
 * does not read `.env.local` on its own, so nothing here would have found the
 * production database anyway; overwriting the variable regardless means that
 * stays true even if something later decides to load it. A unit test cannot
 * reach the live database by accident.
 *
 * `pg.Pool` connects lazily, so this costs nothing at import. A test that calls
 * a function which actually queries fails at connect with `ECONNREFUSED`, and
 * that failure is the point: it says the test belongs in a `scripts/check-*.mjs`
 * harness, driving the real thing, rather than here.
 */
process.env.STORAGE_POSTGRES_URL = "postgresql://unit:tests@127.0.0.1:1/none";

/*
 * Fixed so that anything reading them renders the same string on every machine
 * and in CI. `NEXT_PUBLIC_BASE_URL` feeds canonical URLs and the sitemap;
 * `SUPABASE_STORAGE_BUCKET` and `STORAGE_SUPABASE_URL` feed the media URLs.
 */
process.env.NEXT_PUBLIC_BASE_URL = "https://ridwaanhall.com";
process.env.STORAGE_SUPABASE_URL = "https://unit-tests.supabase.co";
process.env.SUPABASE_STORAGE_BUCKET = "media";
