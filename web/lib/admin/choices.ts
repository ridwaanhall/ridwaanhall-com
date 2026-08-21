import { PROJECT_STATUS_DISPLAY, PROJECT_STATUS_SORT_RANK } from "@/lib/data/project-status";

import type { FilterChoice } from "@/lib/admin/list";

/**
 * The fixed vocabularies the admin filters on.
 *
 * A port of `apps/core/choices.py` and the `*_CHOICES` lists on the models. The
 * Python file exists because four places describe the same two things --
 * `Application` and `Experience` each store one value, `OpenToWorkProfile`
 * stores a list of each and `Position` stores one -- and they were only ever
 * kept aligned by hand, so "Fulltime" could drift in beside "Full-time" with
 * nothing to notice. The same reasoning applies here, which is why these are one
 * module rather than inline arrays in each descriptor.
 *
 * The stored value *is* the label in every case: these columns hold
 * "Full-time", not a code. Only `Project.status` and
 * `LegalDocument.document_type` store a key with a separate display name.
 */

const pairs = (values: string[]): FilterChoice[] =>
  values.map((value) => ({ value, label: value }));

export const EMPLOYMENT_TYPE_CHOICES = pairs([
  "Full-time",
  "Part-time",
  "Self-employed",
  "Freelance",
  "Contract",
  "Internship",
  "Apprenticeship",
  "Seasonal",
  "Scholarship",
]);

export const LOCATION_TYPE_CHOICES = pairs(["On-site", "Hybrid", "Remote"]);

/** `Application.STATUS_CHOICES`. */
export const APPLICATION_STATUS_CHOICES = pairs([
  "Applied",
  "In Progress",
  "Withdrawn",
  "Accepted",
  "Rejected",
  "Ghosted",
]);

/** `LegalDocument.DOCUMENT_TYPES`. */
export const LEGAL_DOCUMENT_TYPE_CHOICES: FilterChoice[] = [
  { value: "privacy", label: "Privacy Policy" },
  { value: "terms", label: "Terms & Conditions" },
  { value: "cookies", label: "Cookie Policy" },
  { value: "other", label: "Other" },
];

/**
 * `ProjectStatus`, in lifecycle order rather than alphabetically.
 *
 * Derived from the two maps `lib/data/project-status.ts` already exports, so the
 * filter cannot list a status the project cards would not know how to render,
 * and a status added there appears here with no second edit.
 */
export const PROJECT_STATUS_CHOICES: FilterChoice[] = Object.keys(PROJECT_STATUS_DISPLAY)
  .sort((a, b) => (PROJECT_STATUS_SORT_RANK[a] ?? 99) - (PROJECT_STATUS_SORT_RANK[b] ?? 99))
  .map((value) => ({ value, label: PROJECT_STATUS_DISPLAY[value] }));
