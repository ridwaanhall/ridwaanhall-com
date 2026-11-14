import "server-only";

import { revalidatePath, updateTag } from "next/cache";

import { routesReading, type Tag } from "./tags";

/**
 * Expire cached data after a write, and every per-slug page that read it.
 *
 * The tags alone are not enough: a slug the build did not prerender reads a
 * snapshot taken at build time, which no tag reaches, so a project published
 * in the admin stayed "not out yet" until a redeploy. See `ROUTE_TAGS` in
 * `./tags.ts`.
 *
 * `updateTag`, so only from a server action -- which is every caller.
 */
export function expire(tags: readonly Tag[]) {
  for (const tag of tags) updateTag(tag);
  for (const route of routesReading(tags)) revalidatePath(route, "page");
}
