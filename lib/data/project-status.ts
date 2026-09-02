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
 * The label and the order are the row's, read straight from `project_status`.
 * **So is the colour now** -- as a token, in `project_status.color`. What stays
 * here is the one thing a row cannot carry: the classes themselves. A colour is
 * a pair of Tailwind utilities, and **classes are never stored in the
 * database** -- Tailwind finds them by scanning source text, so a class that
 * exists only as a column value produces no rule at all. A *token* is not a
 * class; it is a key, exactly like the slug beside it.
 *
 * That is what changed, and why. Keyed on the slug, this map decided which
 * statuses could exist: a status created in the admin had no entry, so its
 * badge fell back to neutral grey and read as a broken card. The screen
 * therefore refused create and delete. Keyed on a token the row carries, a new
 * status picks its colour from a dropdown like any other field, and the screen
 * offers add and delete like every other vocabulary.
 */

/**
 * Written out in full per token, never composed.
 *
 * An interpolated `bg-${token}-400/90` is invisible to Tailwind's scanner and
 * the rule is simply never generated, with no error anywhere -- which would put
 * this module straight back where it started, with the difference that the
 * database would now be blameless.
 *
 * **Adding a token means two edits, in this order:** a pair here, then the name
 * in `project_status_color_check` in `drizzle/0000_init.sql` and a delta to
 * match. The constraint is deliberately downstream of the stylesheet: a token
 * the database accepts and this map has no pair for is the neutral fallback all
 * over again.
 */
export const PROJECT_STATUS_COLORS: Record<string, string> = {
  purple: "bg-purple-400/90 text-purple-950",
  violet: "bg-violet-400/90 text-violet-950",
  indigo: "bg-indigo-400/90 text-indigo-950",
  blue: "bg-blue-400/90 text-blue-950",
  sky: "bg-sky-400/90 text-sky-950",
  cyan: "bg-cyan-400/90 text-cyan-950",
  teal: "bg-teal-400/90 text-teal-950",
  emerald: "bg-emerald-400/90 text-emerald-950",
  green: "bg-green-400/90 text-green-950",
  lime: "bg-lime-400/90 text-lime-950",
  yellow: "bg-yellow-400/90 text-yellow-950",
  amber: "bg-amber-400/90 text-amber-950",
  orange: "bg-orange-400/90 text-orange-950",
  red: "bg-red-400/90 text-red-950",
  rose: "bg-rose-400/90 text-rose-950",
  pink: "bg-pink-400/90 text-pink-950",
  fuchsia: "bg-fuchsia-400/90 text-fuchsia-950",
  zinc: "bg-zinc-400/90 text-zinc-950",
};

/**
 * The tokens, for the admin's colour dropdown and for the tests.
 *
 * Derived from the map rather than written a second time -- the two-constants
 * mistake this file's own history is a monument to. What it is checked against
 * is the database's constraint, which is a different source entirely.
 */
export const PROJECT_STATUS_COLOR_TOKENS = Object.keys(PROJECT_STATUS_COLORS);

/**
 * The neutral badge, for a status that has none.
 *
 * Still reachable, and still worth having: `project.status_id` is nullable, so
 * a project with no status at all renders this. What no longer reaches it is a
 * status whose colour nobody chose -- the column defaults to `zinc`, which is a
 * deliberate grey rather than an absent one.
 */
const FALLBACK_COLOR = "bg-zinc-500/20 text-zinc-300 border-zinc-500/30";

/**
 * Takes the colour token from the row, not the slug and not the label.
 *
 * The slug was the key until the colour became a column; the label never was
 * and never should be, since it is editorial and reworded from the admin.
 */
export function projectStatusColor(token: string | null | undefined): string {
  if (!token) return FALLBACK_COLOR;
  return PROJECT_STATUS_COLORS[String(token).toLowerCase()] ?? FALLBACK_COLOR;
}
