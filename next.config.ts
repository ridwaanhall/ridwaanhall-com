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

  // Pin the workspace root. Without this Next infers it from the nearest
  // lockfile, and a stray lockfile anywhere above this directory moves the root
  // out from under Tailwind's automatic source detection -- which then scans a
  // far wider tree than intended. This repo has been bitten by exactly that:
  // prose that merely named a utility kept emitting it, long after the class
  // itself had been deleted from every component.
  turbopack: { root: path.resolve(import.meta.dirname) },

  experimental: {
    serverActions: {
      /*
       * The admin uploads images through a server action, and the default of
       * 1MB rejects most of them. 4MB rather than something generous: Vercel
       * caps a serverless request body at 4.5MB, so a larger limit here would
       * only move the failure from a message this app writes to a gateway error
       * it cannot explain. `lib/admin/form.ts` refuses the same size in words.
       */
      bodySizeLimit: "4mb",
    },
  },

  images: {
    remotePatterns: [
      // Uploaded media, which Supabase serves at
      // {SUPABASE_URL}/storage/v1/object/public/{bucket}/{key}
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

  /*
   * No trailing slash: `/about/` redirects to `/about`.
   *
   * A deliberate call to standardise on the slash-free form, taken while the
   * site was still in development -- the indexed URLs carried the slash.
   *
   * What it costs is one 308 per indexed URL, once: Google follows them and
   * transfers ranking, and every canonical, sitemap entry and JSON-LD `@id` in
   * this codebase emits the slash-free form directly, so a crawler is never
   * sent to a redirect by our own markup. Inbound links to the old shape keep
   * working through the redirect indefinitely.
   */
  trailingSlash: false,

  typedRoutes: true,

  // Inlined as a string literal at build time. The copyright line wants the
  // current year, but *any* clock read inside a prerendered tree is rejected
  // under Cache Components -- including at module scope in a "use client"
  // file, which the server still evaluates while prerendering. Computing it
  // here, in config, happens before prerendering starts.
  env: {
    NEXT_PUBLIC_BUILD_YEAR: String(new Date().getFullYear()),
    // Used as `dateModified` on the pages that track no real modification date
    // of their own. Frozen at build time, not read from the clock per request:
    // a clock read claims the page changed on every request, and is rejected
    // outright inside a prerendered tree.
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
