"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Closes a transient overlay -- a menu, a popover, a sheet -- when the route
 * it belongs to is hidden.
 *
 * Under Cache Components a navigation does not unmount the page it leaves:
 * Next hides it in React's `<Activity>` and keeps its state, so a menu that
 * was open when its link was followed is still open when the route comes
 * back. The account menu did exactly that: Admin, then View site, and the
 * dropdown was back on the public page. A pathname comparison during render
 * could not catch it, because a hidden tree renders at low priority and
 * sometimes never saw the pathname change at all -- which is why it only
 * happened sometimes.
 *
 * Activity runs layout-effect cleanups when it hides a tree, so that is where
 * the state is reset (`preserving-ui-state.md` in the Next docs). Layout
 * rather than passive, so it runs before the tree is hidden and the overlay
 * never paints open on the way back.
 */
export function useClosedWhenHidden(close: () => void) {
  const latest = useRef(close);
  useLayoutEffect(() => {
    latest.current = close;
  });
  useLayoutEffect(() => () => latest.current(), []);
}
