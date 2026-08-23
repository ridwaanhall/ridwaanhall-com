"use client";

import { useEffect, useState } from "react";

/**
 * Mount and reveal timing for a modal that animates in and out.
 *
 * Shared by the search palette and the confirm dialog, so the two cannot drift
 * into different timing.
 *
 * `mounted` keeps the modal in the tree for the length of its exit; `shown` is
 * what the transition classes read. Both entry points are adjustments *during
 * render* rather than effects: opening has to put the modal in the tree on this
 * render, and closing has to start the exit on this one, and setting either
 * from an effect body would be a cascading render that React 19's lint
 * rejects. What genuinely belongs in an effect is the *timing* -- the frame
 * needed to paint the closed state before there is anything to transition
 * from, and the wait for the exit to finish -- so only those are here.
 *
 * `exitMs` must match the `duration-*` on the markup.
 */
export function useModalTransition(isOpen: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(isOpen);
  const [shown, setShown] = useState(false);

  if (isOpen && !mounted) setMounted(true);
  if (!isOpen && shown) setShown(false);

  useEffect(() => {
    if (isOpen) {
      const frame = requestAnimationFrame(() => setShown(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = window.setTimeout(() => setMounted(false), exitMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, exitMs]);

  return { mounted, shown };
}

/**
 * Hold the page still while a modal is over it, as it was before.
 *
 * The previous value is captured and restored rather than assuming `""`, so
 * two modals open at once (a toast-raising action behind the confirm dialog,
 * say) unwind in the right order.
 */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/** Close on Escape, from `document` so it works whatever has focus. */
export function useEscape(active: boolean, onEscape: () => void) {
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onEscape();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active, onEscape]);
}
