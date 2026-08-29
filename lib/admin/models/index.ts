import {
  applicationForm,
  applicationList,
  awardForm,
  awardList,
  certificationForm,
  certificationList,
  educationForm,
  educationList,
  experienceForm,
  experienceList,
  locationForm,
  locationList,
  organizationForm,
  organizationList,
  profileForm,
  skillForm,
  skillList,
} from "@/lib/admin/models/about";
import { blogPostForm, blogPostList } from "@/lib/admin/models/blog";
import { commentForm, commentList } from "@/lib/admin/models/comments";
import {
  chatMessageForm,
  chatMessageList,
  userProfileForm,
  userProfileList,
} from "@/lib/admin/models/guestbook";
import {
  legalDocumentForm,
  legalDocumentList,
  legalSectionForm,
  legalSectionList,
} from "@/lib/admin/models/legal";
import {
  hiringProfileForm,
  jobOpeningForm,
  jobOpeningList,
  openToWorkProfileForm,
} from "@/lib/admin/models/openhire";
import { projectForm, projectList } from "@/lib/admin/models/projects";
import {
  applicationSourceForm,
  applicationSourceList,
  applicationStatusForm,
  applicationStatusList,
  availabilityForm,
  availabilityList,
  categoryForm,
  categoryList,
  contactPreferenceForm,
  contactPreferenceList,
  employmentTypeForm,
  employmentTypeList,
  experienceLevelForm,
  experienceLevelList,
  legalDocumentTypeForm,
  legalDocumentTypeList,
  noticePeriodForm,
  noticePeriodList,
  openToWorkStatusForm,
  openToWorkStatusList,
  projectStatusForm,
  projectStatusList,
  tagForm,
  tagList,
  workAuthorizationForm,
  workAuthorizationList,
  workModeForm,
  workModeList,
} from "@/lib/admin/models/settings";
import { userForm, userList } from "@/lib/admin/models/users";

import type { AdminFormModel } from "@/lib/admin/form";
import type { AdminListModel } from "@/lib/admin/list";

/**
 * The changelist descriptors, keyed the way the registry and the URLs are.
 *
 * One module per area of the site, because descriptors from the same area
 * share their helpers -- four of the `about` lists resolve the same foreign
 * key, and both guestbook lists resolve a username.
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
  locationList,
  // blog
  blogPostList,
  // projects
  projectList,
  // openhire
  jobOpeningList,
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
  // settings -- the vocabularies every dropdown above is drawn from
  categoryList,
  tagList,
  applicationStatusList,
  applicationSourceList,
  employmentTypeList,
  workModeList,
  projectStatusList,
  legalDocumentTypeList,
  openToWorkStatusList,
  availabilityList,
  experienceLevelList,
  noticePeriodList,
  workAuthorizationList,
  contactPreferenceList,
];

export const ADMIN_LIST_MODELS: Record<string, AdminListModel<never>> = Object.fromEntries(
  MODELS.map((model) => [model.key, model]),
);

export function listModelFor(key: string) {
  return ADMIN_LIST_MODELS[key] ?? null;
}

/**
 * The form descriptors, for the screens whose editing is built.
 *
 * Separate from the changelists rather than folded into them: a list exists for
 * every model, and a form arrives per model as the fields it needs are built.
 * A key with a list but no form gets the read-only record view, which says so.
 */
const FORMS: AdminFormModel[] = [
  // about
  profileForm,
  experienceForm,
  educationForm,
  certificationForm,
  awardForm,
  skillForm,
  applicationForm,
  organizationForm,
  locationForm,
  // blog
  blogPostForm,
  // projects
  projectForm,
  // openhire
  hiringProfileForm,
  jobOpeningForm,
  openToWorkProfileForm,
  // legal
  legalDocumentForm,
  legalSectionForm,
  // guestbook
  chatMessageForm,
  userProfileForm,
  // comments
  commentForm,
  // users
  userForm,
  // settings
  categoryForm,
  tagForm,
  applicationStatusForm,
  applicationSourceForm,
  employmentTypeForm,
  workModeForm,
  projectStatusForm,
  legalDocumentTypeForm,
  openToWorkStatusForm,
  availabilityForm,
  experienceLevelForm,
  noticePeriodForm,
  workAuthorizationForm,
  contactPreferenceForm,
];

export const ADMIN_FORM_MODELS: Record<string, AdminFormModel> = Object.fromEntries(
  FORMS.map((model) => [model.key, model]),
);

export function formModelFor(key: string): AdminFormModel | null {
  return ADMIN_FORM_MODELS[key] ?? null;
}
