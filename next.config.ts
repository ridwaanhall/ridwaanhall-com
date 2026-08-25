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
  // Opts into `use cache` / `cacheTag` / `cacheLife`. Tag revalidation is
  // cross-instance by construction, which is what makes it usable on
  // serverless: an edit handled by one instance cannot leave another serving a
  // stale copy, so there is no shared version stamp to keep in the database.
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

  /*
   * Security headers, because nothing else sets them.
   *
   * Neither Next nor the platform adds any of these -- a deployment without
   * this block serves the site with no CSP, no HSTS, no frame protection and no
   * referrer policy, and nothing in a build, a type check or a lint says so.
   * `scripts/check-headers.mjs` is what does.
   *
   * `source: "/:path*"` rather than only the document routes: a header set on
   * pages alone leaves every API response and every asset without one.
   */
  async headers() {
    /*
     * The content security policy.
     *
     * Every origin here is one the application actually loads from, and the
     * list is deliberately shorter than a copied policy would be. Widening a
     * CSP is free and silent; narrowing one breaks a page in production.
     *
     * **`'unsafe-inline'` on script-src is deliberate.** next-themes injects a
     * blocking pre-paint script -- it has to be blocking, or the page paints in
     * the wrong theme and flashes -- and the JSON-LD blocks are inline
     * `<script type="application/ld+json">` elements, which CSP governs like
     * any other. A nonce cannot be threaded through a prerendered tree under
     * `cacheComponents`, where the HTML is generated before any request exists
     * to carry one. Hashes would have to be recomputed on every build of a
     * script this repository does not own.
     *
     * `static.cloudflareinsights.com` is listed because Cloudflare injects that
     * script at its proxy, so it appears whether or not the app asks for it.
     */
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      /*
       * No `upgrade-insecure-requests`. A browser ignores it in a report-only
       * policy and says so in the console on every page load -- which
       * `scripts/check-site-console.mjs` correctly refuses to accept. It costs
       * nothing to leave out for now: `Strict-Transport-Security` below already
       * forces HTTPS for this origin and its subdomains, and every origin named
       * in this policy is an https one. Add it back when the policy is promoted
       * to enforcing.
       */
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
      // Next inlines critical CSS as a <style> element on first paint.
      "style-src 'self' 'unsafe-inline'",
      // `next/font` self-hosts the Onest faces under /_next/static/media, so
      // this origin serves them and no font CDN is ever contacted.
      "font-src 'self'",
      [
        "img-src 'self' data:",
        // Uploaded media.
        supabaseHost ? `https://${supabaseHost}` : "",
        // Avatars, which the guestbook and comments render from the provider.
        "https://lh3.googleusercontent.com",
        "https://avatars.githubusercontent.com",
        "https://www.gravatar.com",
      ]
        .filter(Boolean)
        .join(" "),
      "connect-src 'self' https://challenges.cloudflare.com",
      // The Turnstile widget renders in an iframe.
      "frame-src https://challenges.cloudflare.com",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          /*
           * **Report-only, on purpose.** An enforcing policy that is wrong
           * takes the site's own scripts down, and the way to find out whether
           * this one is right is to watch what it reports on real traffic
           * rather than to guess. Promoting it is renaming this header, and it
           * belongs in its own change once the reports are quiet.
           */
          { key: "Content-Security-Policy-Report-Only", value: csp },

          /*
           * Two years, with preload. HSTS is hard to walk back -- a browser
           * that has seen this will refuse plain HTTP for the whole max-age,
           * whatever the site later says -- so it is worth being sure every
           * subdomain is served over TLS before this ships.
           */
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },

          // Stops a browser guessing a type the server did not declare, which
          // is how an uploaded file becomes an executed script.
          { key: "X-Content-Type-Options", value: "nosniff" },

          // `frame-ancestors 'none'` above says the same thing to a modern
          // browser; this is what an older one reads.
          { key: "X-Frame-Options", value: "DENY" },

          // Send the full URL within the site, the origin only when leaving it,
          // and nothing at all when leaving it for plain HTTP.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Keeps a window this site opens out of the same browsing context
          // group, so it cannot reach back through `window.opener`.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },

          /*
           * Deny every powerful feature. This site asks for none of them, and
           * an unset policy is a permitted one -- a third-party frame inherits
           * whatever the top document was allowed.
           */
          {
            key: "Permissions-Policy",
            value: [
              "accelerometer=()", "autoplay=()", "camera=()", "display-capture=()",
              "encrypted-media=()", "fullscreen=()", "geolocation=()", "gyroscope=()",
              "magnetometer=()", "microphone=()", "midi=()", "payment=()",
              "picture-in-picture=()", "publickey-credentials-get=()", "screen-wake-lock=()",
              "sync-xhr=()", "usb=()", "web-share=()",
            ].join(", "),
          },
        ],
      },
    ];
  },

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
