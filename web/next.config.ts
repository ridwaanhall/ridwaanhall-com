import path from "node:path";

import type { NextConfig } from "next";

/**
 * The Supabase project host is needed at build time for `next/image`'s remote
 * allow-list, which does not accept a wildcard for the whole of supabase.co.
 * Derived from the same env var the storage client uses so the two can never
 * disagree.
 */
const supabaseHost = process.env.STORAGE_SUPABASE_URL
  ? new URL(process.env.STORAGE_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Opts into `use cache` / `cacheTag` / `cacheLife`. The content cache this
  // replaces (apps/core/cache.py) had to invent a shared version stamp in
  // Postgres to stay correct across Vercel instances; tag revalidation is
  // cross-instance by construction, so that table goes away at cutover.
  cacheComponents: true,

  // Pin the workspace root to web/. Without this Next infers it from the
  // nearest lockfile and picks the repo root, because the Django tree keeps
  // its own package-lock.json for the Tailwind CLI. That would put the entire
  // Django codebase inside Tailwind's automatic source detection -- and this
  // repo has already been bitten by exactly that: prose in templates and in
  // CLAUDE.md kept emitting `shadow`, `shadow-xl` and `shadow-black/60` long
  // after every one of those classes had been deleted.
  turbopack: { root: path.resolve(import.meta.dirname) },

  images: {
    remotePatterns: [
      // Uploaded media. Django's SupabaseStorage.url() returns exactly this
      // shape: {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}
      ...(supabaseHost
        ? ([
            {
              protocol: "https" as const,
              hostname: supabaseHost,
              pathname: "/storage/v1/object/public/**",
            },
          ])
        : []),
      // OAuth avatars, stored as absolute URLs in socialaccount extra_data.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      { protocol: "https", hostname: "www.gravatar.com" },
    ],
    // The site's largest rendered image is the project/blog gallery at roughly
    // full content width (1152px inside max-w-6xl); the rest are cards and
    // avatars. Trimming the default ladder keeps the optimizer from generating
    // sizes nothing ever requests.
    deviceSizes: [375, 640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Django's URLs all carry a trailing slash (APPEND_SLASH = True) and are
  // indexed that way. Keeping it avoids a site-wide set of redirects and
  // canonical churn.
  trailingSlash: true,

  typedRoutes: true,
};

export default nextConfig;
