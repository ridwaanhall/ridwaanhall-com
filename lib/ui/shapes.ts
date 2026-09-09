/**
 * The shapes a page and its skeleton both spend.
 *
 * **Why a plain module of whole strings.** Two rules decide where a shared
 * visual value lives here. A *size* belongs in `@theme` in `app/globals.css`,
 * where it becomes a utility. A *combination of classes that two files have to
 * agree about* belongs here, because Tailwind scans `.ts` and sees a literal
 * string, and because a plain module is not a client module -- a constant
 * exported from one of those arrives at a server importer as a reference
 * object rather than the string, which is the trap `lib/admin/rail.ts` exists
 * to record. Only what a utility genuinely cannot express -- a descendant
 * selector into injected HTML, a mask, a pseudo-element -- belongs in
 * `styles/components.css`.
 *
 * **What this file is really for.** Every skeleton on this site is a hand-built
 * copy of a shape defined somewhere else, and nothing recomputes them: the
 * listing card's height was written out in three files, and one of the two card
 * types it claimed to describe had no fixed height at all. The guestbook was
 * the only area that shared its measurements through a module, and this is that
 * pattern generalised. A number here is read by the component *and* by the
 * thing that stands in for it, so the two cannot drift apart while both still
 * look correct.
 *
 * Nothing here is composed from a variable. Every value is a whole literal,
 * because Tailwind emits only what it can see written out.
 */

/**
 * The page gutter, on the one element that also carries the cap.
 *
 * There were two of these -- a roomier one and a tighter one -- assigned to
 * pages by no rule anybody could state: `/blog` had one and `/projects`, the
 * structurally identical listing beside it, had the other. They differ only
 * below `sm`. One gutter means a route cannot pick the wrong one, and it is the
 * same string the navbar and the footer carry, which is what keeps all three
 * left edges on one line.
 */
export const PAGE_GUTTER = "px-4 py-6 md:px-6 lg:px-8";

/* ---------------------------------------------------------------------------
   Surfaces

   Three, where there were thirty-seven. The count is not the point, though --
   what matters is that **not everything is a surface**. A document is set with
   rules and rhythm and no box at all: the legal pages, the OpenHire sections
   and an article body are read, not handled. A box around each of them is the
   shape a design falls into when every piece of content is treated as an
   object, and fifteen identical bordered panels down one page is what that
   looks like. Reach for a surface when the thing inside it is a *thing* -- a
   post, a project, a reading, a panel of live data.
   --------------------------------------------------------------------------- */

/** The resting surface. Everything that is an object and does nothing. */
export const SURFACE = "rounded-xl border border-zinc-800 bg-zinc-900/40";

/** One step forward: a composer, a menu, something laid over the page. */
export const SURFACE_RAISED = "rounded-xl border border-zinc-700 bg-zinc-900/60";

/**
 * A surface you can click. The edge lifts on hover and nothing else moves --
 * a card that also grows or lights up is two answers to one pointer.
 */
export const SURFACE_INTERACTIVE =
  "rounded-xl border border-zinc-800 bg-zinc-900/40 transition-colors duration-300 hover:border-zinc-700";

/** The padding a surface takes when it holds prose rather than a figure. */
export const SURFACE_PAD = "p-4 sm:p-5";

/* ---------------------------------------------------------------------------
   The rail

   The second column, and the answer to what the extra width is for. When the
   sidebar became a navbar the content column went from about 904px to 1216px,
   and spending all of it on line length makes long-form text harder to read
   rather than easier. So the width goes into a rail, and the rail *widens* with
   the page while the reading column stays close to its measure.
   --------------------------------------------------------------------------- */

/**
 * `minmax(0,1fr)` rather than `1fr`: a grid item's automatic minimum size is
 * its content, so a wide `<pre>` or a table in an article would otherwise push
 * the track past the container instead of scrolling inside it. The content cell
 * carries `min-w-0` for the same reason, and both are required -- neither alone
 * is enough.
 */
export const RAIL_GRID =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_20rem] xl:gap-12";

/**
 * `lg:self-start` is not optional. A grid item is stretched to its row by
 * default, and a sticky element that is already as tall as its container has
 * nowhere to stick -- it simply never moves, with nothing in the styles looking
 * wrong. `top-20` clears the navbar's 4rem and one step.
 *
 * Nothing between this and the document may take `overflow-hidden`, which also
 * disables sticky silently.
 */
export const RAIL_ASIDE =
  "lg:col-start-2 lg:row-start-1 lg:self-start lg:sticky lg:top-20 " +
  "lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:overscroll-contain custom-scroll";

/** The reading column. Written second, placed first. */
export const RAIL_MAIN = "min-w-0 lg:col-start-1 lg:row-start-1";

/* ---------------------------------------------------------------------------
   Grid ladders

   Read by the page and by the skeleton that stands in front of it. They used to
   be transcribed into `SKELETON_GRIDS` by hand, under a comment admitting the
   two "line up only when both are written the same way".
   --------------------------------------------------------------------------- */

/**
 * Blog and project listings.
 *
 * Two across, and it stops there. Three would fit the raw width, but these
 * listings carry a rail now, and two cards at about 400px read better than
 * three at 260 -- a card whose image is wider than its text is tall stops
 * looking like a card. It is also what makes `LISTING_CARD_H` honest for both
 * card types at once.
 */
export const LISTING_GRID = "grid grid-cols-1 sm:grid-cols-2 gap-4";

/** Four readings across on a wide screen, two on a phone. */
export const STAT_GRID_4 = "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4";

/**
 * Six readings in one band from `xl`.
 *
 * WakaTime renders six and was capped at two across at every width, so a
 * six-value summary took three rows and read as three unrelated pairs.
 */
export const STAT_GRID_6 = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4";

/** The three-panel breakdown rows: languages, categories, editors. */
export const BREAKDOWN_GRID = "grid gap-4 lg:grid-cols-3";

/* ---------------------------------------------------------------------------
   Heights

   Each of these is spent twice -- once by the thing, once by the rectangle that
   holds its place. That is the whole reason they are here rather than inline.
   --------------------------------------------------------------------------- */

/** A listing card. Both card types honour it, which they did not before. */
export const LISTING_CARD_H = 340;

/** One reading: a label above a figure. */
export const STAT_CARD_H = 76;

/** A single-line form control at its resting padding. */
export const FIELD_H = 46;

/** The message box on the contact form. */
export const TEXTAREA_H = 126;

/** The spam widget's own iframe, which sizes itself and cannot be asked. */
export const TURNSTILE_H = 65;

/** A submit button. */
export const BUTTON_H = 44;

/** The image gallery on a detail page. A class, because it is responsive. */
export const GALLERY_H = "h-60 sm:h-72 md:h-96";
