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

/**
 * Display labels and badge colours.
 *
 * Ported from apps/projects/templatetags/project_tags.py. Every class string is
 * written out in full rather than composed, because Tailwind finds classes by
 * scanning source text -- an interpolated `bg-${hue}-400/90` is invisible to it
 * and the rule is simply never generated, with no error anywhere.
 */
export const PROJECT_STATUS_DISPLAY: Record<string, string> = {
  [PROJECT_STATUS.PLANNING_REQUIREMENTS]: "Planning",
  [PROJECT_STATUS.DESIGN]: "Design",
  [PROJECT_STATUS.DEVELOPMENT_IN_PROGRESS]: "In Development",
  [PROJECT_STATUS.CODE_REVIEW]: "Code Review",
  [PROJECT_STATUS.TESTING_QA]: "Testing",
  [PROJECT_STATUS.DEPLOYMENT_RELEASED]: "Released",
  [PROJECT_STATUS.MAINTENANCE_SUPPORT]: "Maintenance",
  [PROJECT_STATUS.UPDATE_REQUIRED]: "Update Required",
  [PROJECT_STATUS.REOPENED]: "Reopened",
  [PROJECT_STATUS.ON_HOLD]: "On Hold",
  [PROJECT_STATUS.CANCELLED]: "Cancelled",
  [PROJECT_STATUS.COMPLETED]: "Completed",
};

export const PROJECT_STATUS_COLORS: Record<string, string> = {
  [PROJECT_STATUS.PLANNING_REQUIREMENTS]: "bg-purple-400/90 text-purple-950",
  [PROJECT_STATUS.DESIGN]: "bg-violet-400/90 text-violet-950",
  [PROJECT_STATUS.DEVELOPMENT_IN_PROGRESS]: "bg-blue-400/90 text-blue-950",
  [PROJECT_STATUS.CODE_REVIEW]: "bg-amber-400/90 text-amber-950",
  [PROJECT_STATUS.TESTING_QA]: "bg-orange-400/90 text-orange-950",
  [PROJECT_STATUS.DEPLOYMENT_RELEASED]: "bg-cyan-400/90 text-cyan-950",
  [PROJECT_STATUS.MAINTENANCE_SUPPORT]: "bg-sky-400/90 text-sky-950",
  [PROJECT_STATUS.COMPLETED]: "bg-emerald-400/90 text-emerald-950",
  [PROJECT_STATUS.ON_HOLD]: "bg-zinc-400/90 text-zinc-950",
  [PROJECT_STATUS.CANCELLED]: "bg-red-400/90 text-red-950",
  [PROJECT_STATUS.REOPENED]: "bg-yellow-400/90 text-yellow-950",
  [PROJECT_STATUS.UPDATE_REQUIRED]: "bg-rose-400/90 text-rose-950",
};

const FALLBACK_COLOR = "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";

/**
 * The label shown on a project's status badge.
 *
 * Distinct from `projectStatusLabel` above, which title-cases the raw value for
 * the admin ("Development In Progress"). The public badge uses shorter
 * editorial wording ("In Development"), and the two have always differed.
 */
export function projectStatusDisplay(status: string | null | undefined): string {
  if (!status) return "";
  const key = String(status).toLowerCase();
  return (
    PROJECT_STATUS_DISPLAY[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function projectStatusColor(status: string | null | undefined): string {
  if (!status) return FALLBACK_COLOR;
  return PROJECT_STATUS_COLORS[String(status).toLowerCase()] ?? FALLBACK_COLOR;
}
