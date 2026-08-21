import {
  applicationList,
  awardList,
  certificationList,
  educationList,
  experienceList,
  organizationList,
  skillList,
} from "@/lib/admin/models/about";
import { blogPostList } from "@/lib/admin/models/blog";
import { commentList } from "@/lib/admin/models/comments";
import { chatMessageList, userProfileList } from "@/lib/admin/models/guestbook";
import { legalDocumentList, legalSectionList } from "@/lib/admin/models/legal";
import { projectList } from "@/lib/admin/models/projects";
import { userList } from "@/lib/admin/models/users";

import type { AdminListModel } from "@/lib/admin/list";

/**
 * The changelist descriptors, keyed the way the registry and the URLs are.
 *
 * One module per Django app, mirroring `apps/<app>/admin.py` one to one, since
 * that is what is being ported and descriptors from the same app share their
 * helpers -- four of the `about` lists resolve the same foreign key, and both
 * guestbook lists resolve a username.
 *
 * A model appears here once its list is built. The registry's `ready` flag and
 * this map have to agree, which `scripts/check-admin.mjs` asserts -- a `ready`
 * entry with no descriptor is a link to a 404, and a descriptor with no `ready`
 * entry is a screen nothing reaches.
 *
 * The value type is `AdminListModel<never>` rather than `AdminListModel<any>`,
 * and that is a real distinction and not pedantry. Every function the type
 * carries takes a row -- `value`, `rowId` -- so it is contravariant in `Row`,
 * which makes `never` the honest supertype: each descriptor stays checked
 * against its own row shape where it is defined, and nothing here has to opt
 * out of type checking to hold them all in one map.
 */
const MODELS: AdminListModel<never>[] = [
  // about
  experienceList,
  educationList,
  certificationList,
  awardList,
  skillList,
  applicationList,
  organizationList,
  // blog
  blogPostList,
  // projects
  projectList,
  // legal
  legalDocumentList,
  legalSectionList,
  // guestbook
  chatMessageList,
  userProfileList,
  // comments
  commentList,
  // users
  userList,
];

export const ADMIN_LIST_MODELS: Record<string, AdminListModel<never>> = Object.fromEntries(
  MODELS.map((model) => [model.key, model]),
);

export function listModelFor(key: string) {
  return ADMIN_LIST_MODELS[key] ?? null;
}
