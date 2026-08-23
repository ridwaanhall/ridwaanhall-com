/**
 * A navigation about to happen, announced to the top loading bar.
 *
 * The bar catches almost everything on its own by listening for clicks on
 * anchors, but `router.push()` produces no click for it to see. Rather than
 * make the bar a context provider that every caller has to sit under -- it is
 * mounted at the top of the root layout precisely so it sits under nothing --
 * the two callers that navigate programmatically say so through this module.
 *
 * One subscriber, not a set: there is exactly one bar, mounted once. A second
 * registration would mean two bars, which is a bug worth letting show rather
 * than quietly supporting.
 */
let subscriber: (() => void) | null = null;

/** Called by the bar on mount, and with `null` on unmount. */
export function onPageLoadingStart(fn: (() => void) | null) {
  subscriber = fn;
}

/** Announce a navigation. A no-op if the bar is not mounted. */
export function startPageLoading() {
  subscriber?.();
}
