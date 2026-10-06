/**
 * The class strings two or more admin controls are built from.
 *
 * A plain module both sides import, rather than one component exporting them to
 * the other: `field.tsx` renders `image-field.tsx`, so a constant living in the
 * first and read by the second is an import cycle -- which resolves to
 * `undefined` at module-evaluation time often enough to be a real hazard and
 * never at a moment `tsc` can see.
 */

/**
 * A text-shaped control: input, textarea, and the closed box of a select.
 * Drawn as the public contact form draws its fields -- no fill, a hairline
 * that firms on hover and turns ink with focus, which is the focus mark.
 */
export const CONTROL =
  "w-full rounded-md border border-zinc-800 bg-transparent px-3 py-2 text-[15px] text-zinc-100 placeholder-zinc-500 transition-colors hover:border-zinc-600 focus-visible:border-zinc-100 focus-visible:outline-none";

/** Laid over `CONTROL` when the server sent a message back about this field. */
export const INVALID = "border-red-800 hover:border-red-700";

/**
 * A label that wraps its own control, sized to the two of them and no further.
 *
 * `w-fit` and `self-start` are the whole point of this being one string. A
 * label activates its control from anywhere inside its box, and these labels
 * are laid out as grid or flex items, which are stretched to their cell by
 * default -- so the box was the width of the column and the height of the
 * tallest thing beside it, and every one of those empty pixels toggled a
 * checkbox. "Featured" was 477px wide around 83px of text.
 */
export const BOXED_LABEL = "flex w-fit items-center gap-2 self-start";

/** A screen's title: the site's display face, a step below the public H1. */
export const TITLE =
  "font-display text-[clamp(1.9rem,1.5rem+1.4vw,2.6rem)] leading-[1.02] font-medium tracking-[-0.04em] text-zinc-100";

/** A group's title inside a screen -- an area, a fieldset, an inline table. */
export const SECTION_TITLE = "font-display text-[1.25rem] leading-tight font-medium tracking-[-0.02em] text-zinc-100";

/** The one solid action on a screen -- Save, Create -- as the site draws it. */
export const PRIMARY_BUTTON =
  "cursor-pointer rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-black transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-default disabled:opacity-50";

/** The same action at a list's scale: Add, beside the search and filters. */
export const ADD_BUTTON =
  "inline-flex items-center gap-1.5 rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-black transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/** The quiet action beside it -- Cancel, Back. */
export const QUIET_BUTTON =
  "rounded-full px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/** A small text link that acts on its row: view on site, open, copy. */
export const ROW_LINK =
  "inline-flex items-center gap-1.5 rounded text-xs text-zinc-500 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

/** What the server said went wrong with a save, above the form. */
export const ERROR_NOTE = "rounded-md border border-red-900 bg-red-500/5 px-3 py-2 text-sm text-red-400";

/** The bar Save and Cancel sit in, held to the bottom of the screen. */
export const SAVE_BAR =
  "sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-zinc-800 bg-black px-4 py-3 lg:-mx-6 lg:px-6";

/** A round glyph-only button on a row: move up, move down, remove. */
export const ROW_ICON_BUTTON =
  "flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-900 hover:text-zinc-100 disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";

/** The outlined pill: add a row to an inline or a list, or go back. */
export const PILL_BUTTON =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";
