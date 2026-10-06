/**
 * The page frame, as utility strings.
 *
 * A page's `<main>` and its skeleton's status box both take `MAIN`, and the
 * inner wrapper of each takes `WRAP`, so the two cannot disagree about where
 * the content starts -- `scripts/check-skeleton-shape.mjs` measures exactly
 * that. A plain module rather than a component, so a skeleton can use it
 * without pulling any client code into its fallback.
 */

/** Room for the fixed navbar above, and a long settle below. */
export const MAIN = "pt-28 pb-24 md:pt-36 md:pb-32";

/** 1200px of content inside 16 / 32 / 48px gutters. */
export const WRAP = "mx-auto w-full max-w-[1200px] px-4 md:px-8 xl:px-12";

/** The reading column: posts, project write-ups, legal text. */
export const MEASURE = "max-w-[68ch]";
