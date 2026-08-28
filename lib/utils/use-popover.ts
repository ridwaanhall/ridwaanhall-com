"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";

/**
 * An anchored panel: a dropdown's list, a date field's calendar, the collapsed
 * admin rail's group menu.
 *
 * **A popover is not a modal, and the difference is the point.** The dialog and
 * the search palette in `lib/utils/use-modal.ts` cover the page: they lock the
 * body, dim what is behind them, and sit in the middle of the viewport. A
 * popover belongs to one control, leaves the page usable, and has to be *put*
 * somewhere -- beside its anchor, on whichever side there is room. So the
 * timing and the Escape handling are reused from that module and only the
 * placement lives here.
 *
 * **Rendered through a portal, at body level.** Not for stacking -- for
 * clipping. The changelist's table wrapper sets `contain: layout`, the record
 * form's fieldsets scroll, and the action bar is `sticky`; a panel rendered
 * inside any of them is cut off at the container's edge. Fighting that with
 * `overflow: visible` would give the table back the 78px sideways scroll that
 * `contain: layout` exists to prevent, so the panel leaves the subtree instead.
 * `confirm-dialog.tsx` moves for the same reason and records it.
 */
export type PopoverPlacement = {
  /** `position: fixed` coordinates, in viewport pixels. */
  top: number;
  left: number;
  /** The anchor's width, so a dropdown can match the control it belongs to. */
  width: number;
  /** Which side it landed on, for the entrance direction. */
  side: "top" | "bottom" | "left" | "right";
};

/**
 * Which way the panel comes out of its anchor.
 *
 * `"vertical"` is a dropdown: under the control, flipping above it when there
 * is no room. `"horizontal"` is a flyout: beside the control, flipping to the
 * other side. The collapsed admin rail's group menu is the second kind -- one
 * that opened *below* a 40px icon in a 4.5rem strip would cover the icons under
 * it, and would be clipped by the window on the last group in the list.
 */
export type PopoverAxis = "vertical" | "horizontal";

/** Space kept between the panel and the edge of the viewport. */
const MARGIN = 8;
/** Space between the panel and its anchor. */
const GAP = 4;

/**
 * Where the panel goes, recomputed whenever that could change.
 *
 * `useLayoutEffect` rather than `useEffect`: the panel is in the DOM at its
 * default position for one frame otherwise, and at 0,0 that is a flash in the
 * top-left corner of the screen before it jumps to its anchor.
 *
 * Scroll listening is `capture: true` so it fires for *any* scrolling ancestor,
 * not only the window -- the sidebar and the record form both scroll, and a
 * panel anchored to a control inside one would otherwise stay where it was
 * while the control moved away underneath it.
 */
export function usePopoverPosition(
  open: boolean,
  anchor: React.RefObject<HTMLElement | null>,
  panel: React.RefObject<HTMLElement | null>,
  axis: PopoverAxis = "vertical",
): PopoverPlacement | null {
  const [placement, setPlacement] = useState<PopoverPlacement | null>(null);

  /*
   * The effect only *subscribes*; every measurement happens in a callback.
   *
   * That is the shape the rule against setState-in-an-effect asks for, and here
   * it is also the correct design rather than a way around it. A
   * `ResizeObserver` fires once as soon as it starts observing, which is the
   * first measurement -- taken after the panel is in the DOM, so its height is
   * a real height and not a guess. It then fires again whenever the panel's own
   * size changes, which is exactly what typing in the filter box does: the list
   * shrinks from eighty-four rows to three, and a panel that had flipped above
   * its anchor to fit would otherwise stay flipped and float in mid-air.
   *
   * `measure` is declared inside rather than memoised outside: its only inputs
   * are two refs, which are not reactive values, so a `useCallback` over them
   * is memoisation the React compiler cannot verify and refuses to keep.
   */
  useLayoutEffect(() => {
    const anchorEl = anchor.current;
    const panelEl = panel.current;
    if (!open || !anchorEl || !panelEl) return;

    const measure = () => {
      const rect = anchorEl.getBoundingClientRect();
      const panelHeight = panelEl.offsetHeight;
      const panelWidth = panelEl.offsetWidth || rect.width;

      if (axis === "horizontal") {
        const toRight = window.innerWidth - rect.right - GAP - MARGIN;
        const toLeft = rect.left - GAP - MARGIN;
        // The same rule as the vertical branch, turned ninety degrees: the far
        // side only wins when the near one cannot hold the panel *and* has less
        // room. The rail sits against the left edge, so this is nearly always
        // right -- the branch is what keeps a narrow window from putting the
        // menu off-screen rather than a case anyone meets daily.
        const side: "left" | "right" = panelWidth > toRight && toLeft > toRight ? "left" : "right";

        setPlacement({
          // Aligned with the top of its icon, then clamped into the window, so
          // the last group in a short rail opens upward instead of off the
          // bottom of the screen.
          top: Math.min(
            Math.max(MARGIN, rect.top),
            Math.max(MARGIN, window.innerHeight - panelHeight - MARGIN),
          ),
          left: side === "right" ? rect.right + GAP : rect.left - GAP - panelWidth,
          width: rect.width,
          side,
        });
        return;
      }

      const below = window.innerHeight - rect.bottom - GAP - MARGIN;
      const above = rect.top - GAP - MARGIN;
      /*
       * Below unless it does not fit and there is more room above. Not "flip
       * whenever it overflows": a panel taller than either side would then flip
       * to the side with less room, and a list scrolls anyway -- what matters
       * is that it opens where the eye already is.
       */
      const side: "top" | "bottom" = panelHeight > below && above > below ? "top" : "bottom";

      const left = Math.min(
        Math.max(MARGIN, rect.left),
        Math.max(MARGIN, window.innerWidth - panelWidth - MARGIN),
      );

      setPlacement({
        top: side === "bottom" ? rect.bottom + GAP : rect.top - GAP - panelHeight,
        left,
        width: rect.width,
        side,
      });
    };

    const observer = new ResizeObserver(measure);
    observer.observe(panelEl);
    window.addEventListener("scroll", measure, true);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", measure, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, anchor, panel, axis]);

  /*
   * The last measurement is kept rather than cleared on close, and the caller
   * is simply told `null` while the panel is shut.
   *
   * Clearing it would be a `setState` in an effect, which React 19 flags as a
   * cascading render -- and it would buy nothing: nothing reads a closed
   * panel's position, and the layout effect above re-measures before the next
   * paint anyway, so a reopen cannot show the stale value.
   */
  return open ? placement : null;
}

/**
 * Close when the pointer goes down anywhere else.
 *
 * `pointerdown`, not `click`. A click fires after the button it started on has
 * already handled it, so a second control opened in the same gesture would be
 * closed again by the outside handler of the first. Down is also when someone
 * has decided to leave.
 *
 * The anchor is excluded so its own toggle is not fighting this: pressing the
 * trigger of an open panel should close it once, not close it here and reopen
 * it on the click.
 */
export function useOutsidePointer(
  active: boolean,
  onOutside: () => void,
  ...within: React.RefObject<HTMLElement | null>[]
) {
  useEffect(() => {
    if (!active) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (within.some((ref) => ref.current?.contains(target))) return;
      onOutside();
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, onOutside, ...within]);
}

/** Never changes after hydration, so there is nothing to subscribe to. */
const subscribeNever = () => () => {};

/**
 * `true` once the component has hydrated.
 *
 * Every enhanced control needs this, and none of them may ask `typeof window`
 * instead: that answers differently on the server and on the first client
 * render, which is precisely a hydration mismatch.
 *
 * `useSyncExternalStore` with a server snapshot of `false` and a client
 * snapshot of `true` is the same pattern `rich-text-editor.tsx` and
 * `theme-toggle.tsx` already use here, and for the same reason: a `setState` in
 * an effect does the job but costs a cascading render, which React 19 flags.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false,
  );
}
