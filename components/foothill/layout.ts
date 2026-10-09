/**
 * The page frame, as class strings.
 *
 * Every page renders `<main className={MAIN}>` with one `<div>` inside it
 * holding its sections, and each section carries `WRAP` itself -- the 1200px
 * column inside the 16 / 32 / 48px gutter -- so a band that bleeds to the
 * edge (the skills rows, the footer's word) can simply leave it off.
 *
 * A skeleton's `aria-hidden` box stands where that `<div>` stands, which is
 * what `scripts/check-skeleton-shape.mjs` measures. The navbar is sticky and
 * in the flow, so neither needs room for it: the page head's own padding is
 * the space above a title.
 *
 * A plain module rather than a component, so a skeleton can use it without
 * pulling any client code into its fallback.
 */

export const MAIN = "fh-main";

/** 1200px of content inside the site's gutter (`--fh-gut`). */
export const WRAP = "wrap";
