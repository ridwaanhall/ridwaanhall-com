/**
 * The class strings two or more admin controls are built from.
 *
 * A plain module both sides import, rather than one component exporting them to
 * the other: `field.tsx` renders `image-field.tsx`, so a constant living in the
 * first and read by the second is an import cycle -- which resolves to
 * `undefined` at module-evaluation time often enough to be a real hazard and
 * never at a moment `tsc` can see.
 */

/** A text-shaped control: input, textarea, and the closed box of a select. */
export const CONTROL =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

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
