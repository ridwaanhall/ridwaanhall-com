/**
 * The badge colour a project's status renders in.
 *
 * This module used to carry the whole vocabulary -- the twelve names, their
 * display labels and their lifecycle order -- and none of it agreed with the
 * database. `project_status.slug` is hyphenated (`development-in-progress`),
 * every key here was underscored (`development_in_progress`), and
 * `lib/data/content.ts` selects the slug: so every lookup missed. Each badge
 * rendered in the neutral fallback with a mangled title-cased label, and every
 * project sorted as though its status were unknown. Nothing caught it, because
 * the tests compared these maps against each other rather than against a row.
 *
 * The label and the order are the row's now, read straight from
 * `project_status` and editable on the Project status screen. What is left here
 * is the one thing a row cannot carry: a colour is a pair of Tailwind classes,
 * and **classes are never stored in the database** -- Tailwind finds them by
 * scanning source text, so a class that exists only as a column value produces
 * no rule at all. Keying them on the slug is what keeps that decision here
 * while everything editorial lives where it can be edited.
 *
 * The consequence, and it is deliberate: a status this file has no colour for
 * renders in the fallback. That is why the Project status screen offers no
 * create and no delete, and why its slug is read-only -- the set is fixed until
 * somebody adds a pair below.
 */

/** Written out in full per status, never composed. An interpolated
 * `bg-${hue}-400/90` is invisible to Tailwind's scanner and the rule is simply
 * never generated, with no error anywhere. */
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  "planning-requirements": "bg-purple-400/90 text-purple-950",
  design: "bg-violet-400/90 text-violet-950",
  "development-in-progress": "bg-blue-400/90 text-blue-950",
  "code-review": "bg-amber-400/90 text-amber-950",
  "testing-qa": "bg-orange-400/90 text-orange-950",
  "deployment-released": "bg-cyan-400/90 text-cyan-950",
  "maintenance-support": "bg-sky-400/90 text-sky-950",
  completed: "bg-emerald-400/90 text-emerald-950",
  "on-hold": "bg-zinc-400/90 text-zinc-950",
  cancelled: "bg-red-400/90 text-red-950",
  reopened: "bg-yellow-400/90 text-yellow-950",
  "update-required": "bg-rose-400/90 text-rose-950",
};

const FALLBACK_COLOR = "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";

/**
 * Takes the slug, not the label. The slug is the stable identifier; the label
 * beside it is editorial and can be reworded from the admin without any project
 * losing its colour.
 */
export function projectStatusColor(status: string | null | undefined): string {
  if (!status) return FALLBACK_COLOR;
  return PROJECT_STATUS_COLORS[String(status).toLowerCase()] ?? FALLBACK_COLOR;
}
