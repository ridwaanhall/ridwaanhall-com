import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

/**
 * How the Cloudflare build assembles the Worker.
 *
 * Each override names one of the bindings declared in `wrangler.jsonc`, and the
 * reasoning for each choice is written there beside the binding it configures.
 *
 * The one thing that is only visible here is what is *absent*:
 * `enableCacheInterception` stays off. It answers a cached route from the
 * incremental cache before Next's router runs, which is a real saving and is
 * also wrong under `cacheComponents` -- a partially prerendered route is a
 * static shell plus a streamed remainder, and serving the shell alone as the
 * whole response drops everything dynamic on the page.
 */
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
});
