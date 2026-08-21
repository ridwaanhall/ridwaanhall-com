import { blogPostList } from "@/lib/admin/models/blog-post";

import type { AdminListModel } from "@/lib/admin/list";

/**
 * The changelist descriptors, keyed the way the registry and the URLs are.
 *
 * A model appears here once its list is built. The registry's `ready` flag and
 * this map have to agree, which `scripts/check-admin.mjs` asserts -- a `ready`
 * entry with no descriptor is a link to a 500, and a descriptor with no `ready`
 * entry is a screen nothing reaches.
 *
 * The value type is `AdminListModel<never>` rather than `AdminListModel<any>`,
 * and that is a real distinction and not pedantry. Every function the type
 * carries takes a row -- `value`, `rowId` -- so it is contravariant in `Row`,
 * which makes `never` the honest supertype: each descriptor stays checked
 * against its own row shape where it is defined, and nothing here has to opt
 * out of type checking to hold them all in one map.
 */
export const ADMIN_LIST_MODELS: Record<string, AdminListModel<never>> = {
  [blogPostList.key]: blogPostList,
};

export function listModelFor(key: string) {
  return ADMIN_LIST_MODELS[key] ?? null;
}
