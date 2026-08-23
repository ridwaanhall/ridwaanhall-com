/**
 * The guestbook panel's frame, and its height, in one place.
 *
 * Both the real panel and its skeleton import these, which is the only reliable
 * way to keep the two the same size. They were not: the skeleton drew a
 * bordered box with an opaque header bar for a panel that had stopped having
 * either, at 405px for something 758px tall -- a picture of a previous design,
 * held for half the space the real one needed, so the page jumped by the
 * difference every time the thread arrived.
 *
 * **A module of its own, with no component in it, and that is the point.** The
 * panel is a client component and the skeleton is not. Keeping these constants
 * in either one makes the other import it, and whichever way round that goes is
 * wrong: `loading.tsx` would pull the panel, the confirm dialog and the server
 * actions into a fallback made of rectangles, or the panel would drag the
 * skeleton into the client bundle for a page that has already finished loading.
 * Strings belong to neither side, so they live between them.
 *
 * The height is a band because the panel scrolls internally -- it has no
 * natural height, and this is where it settles.
 */
export const PANEL_FRAME =
  "flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 " +
  "min-h-[min(78vh,720px)] max-h-[min(85vh,860px)]";

/** The header strip and the composer footer, shared so both states match. */
export const PANEL_HEADER = "flex-shrink-0 border-b border-zinc-800 px-3 py-2.5";
export const PANEL_FOOTER = "flex-shrink-0 border-t border-zinc-800 p-3";
