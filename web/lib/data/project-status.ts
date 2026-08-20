/**
 * Project lifecycle statuses.
 *
 * A direct port of apps/projects/types/project.py -- the one part of that
 * module that survived the earlier data-layer migration, because it is pure
 * lifecycle logic with no database dependency.
 */

export const PROJECT_STATUS = {
  PLANNING_REQUIREMENTS: "planning_requirements",
  DESIGN: "design",
  DEVELOPMENT_IN_PROGRESS: "development_in_progress",
  CODE_REVIEW: "code_review",
  TESTING_QA: "testing_qa",
  DEPLOYMENT_RELEASED: "deployment_released",
  MAINTENANCE_SUPPORT: "maintenance_support",
  COMPLETED: "completed",
  ON_HOLD: "on_hold",
  CANCELLED: "cancelled",
  REOPENED: "reopened",
  UPDATE_REQUIRED: "update_required",
} as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];

/** Main lifecycle first, then branch/transitional states, then terminal ones. */
const SORT_ORDER: ProjectStatus[] = [
  PROJECT_STATUS.PLANNING_REQUIREMENTS,
  PROJECT_STATUS.DESIGN,
  PROJECT_STATUS.DEVELOPMENT_IN_PROGRESS,
  PROJECT_STATUS.CODE_REVIEW,
  PROJECT_STATUS.TESTING_QA,
  PROJECT_STATUS.DEPLOYMENT_RELEASED,
  PROJECT_STATUS.MAINTENANCE_SUPPORT,
  PROJECT_STATUS.UPDATE_REQUIRED,
  PROJECT_STATUS.REOPENED,
  PROJECT_STATUS.ON_HOLD,
  PROJECT_STATUS.CANCELLED,
  PROJECT_STATUS.COMPLETED,
];

export const PROJECT_STATUS_SORT_RANK: Record<string, number> = Object.fromEntries(
  SORT_ORDER.map((status, index) => [status, index]),
);

/** Unknown statuses sort after every known one, as in the Python original. */
export function projectStatusRank(status: string | null | undefined): number {
  const normalized = String(status ?? "").toLowerCase();
  return PROJECT_STATUS_SORT_RANK[normalized] ?? SORT_ORDER.length;
}

/** "development_in_progress" -> "Development In Progress" (the admin's label). */
export function projectStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
