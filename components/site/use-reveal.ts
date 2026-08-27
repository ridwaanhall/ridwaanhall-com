"use client";

import { useEffect, useRef } from "react";

/**
 * Hold an entrance animation until the thing it belongs to is on screen.
 *
 * **It holds rather than starts, and that ordering is the whole design.** The
 * obvious shape -- render nothing, add a class when the element scrolls in --
 * cannot know at first paint whether it is looking at the top of the page, so
 * anything already in view paints finished and then jumps back to its opening
 * frame one tick later. Every bar in the first panel would flick.
 *
 * So the stylesheet starts every entrance at mount, exactly as it used to, and
 * this pauses the ones nobody can see yet. The pause lands a frame late, which
 * costs nothing: a frame late on an element below the fold is a frame of an
 * animation playing where there is no one to see it. Above the fold nothing is
 * ever paused, so nothing can flick.
 *
 * It also means the fallback is the old behaviour rather than a blank panel. A
 * reader whose JavaScript never arrives gets every animation firing at mount,
 * which is what shipped before this file existed.
 *
 * The class goes on through the ref rather than through state: a dashboard
 * draws up to 37 of these, and re-rendering each one to toggle a visual class
 * React does not otherwise own is work for nothing.
 *
 * **One observer per threshold, not one per element.** 37 bars and two
 * calendars is 39 observers reporting into 39 callbacks on the same scroll.
 */
const observers = new Map<number, IntersectionObserver>();
const callbacks = new WeakMap<Element, () => void>();

function observerFor(threshold: number): IntersectionObserver {
  let observer = observers.get(threshold);
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const release = callbacks.get(entry.target);
          // Unobserve first: this answers "yet", so there is nothing left to
          // watch, and a second entry would release an element twice.
          observer!.unobserve(entry.target);
          callbacks.delete(entry.target);
          release?.();
        }
      },
      { threshold },
    );
    observers.set(threshold, observer);
  }
  return observer;
}

/** Paused descendants; see `.reveal-hold` in globals.css. */
const HOLD = "reveal-hold";

export function useReveal<T extends HTMLElement>(
  /** Runs the moment the element is on screen -- at once if it already is. */
  onReveal?: () => void,
  threshold = 0.15,
  /**
   * False leaves the element alone entirely, ref included. A hook cannot be
   * called conditionally, and a caller whose timing is owned by something else
   * would otherwise mark itself as waiting and never be released -- a class
   * that stops nothing here, but would pause any animation put inside it later.
   */
  enabled = true,
) {
  const ref = useRef<T>(null);

  // The callback is read through a ref so a parent re-render does not tear
  // down the observer and start the wait over. Written in an effect rather
  // than during render: a render that React throws away must not be what
  // decides which callback a live observer will fire.
  const latest = useRef(onReveal);
  useEffect(() => {
    latest.current = onReveal;
  });

  useEffect(() => {
    const node = ref.current;
    if (!node || !enabled) return;

    /*
      Rewound, not merely paused.

      The stylesheet starts these at paint, and paint happens long before this
      effect does -- the panel's markup streams in, the browser draws it, and
      React hydrates that boundary some hundreds of milliseconds later. Measured
      here, a bar below the fold was already sitting at `currentTime: 900` of a
      900ms animation by the time the hold arrived: finished, off screen, with
      nothing left to hold back.

      So holding means winding the clock back to zero and stopping it there.
      That is only ever done to something already confirmed off screen, which
      is what makes rewinding a finished animation invisible rather than a jump.

      `subtree` because the element that waits is the row or the grid, while
      the animations belong to the bar and the 371 cells inside it.
    */
    const hold = () => {
      node.classList.add(HOLD);
      for (const animation of node.getAnimations({ subtree: true })) {
        animation.currentTime = 0;
        animation.pause();
      }
    };

    // The class comes off first: `animation-play-state` is a declared style and
    // would otherwise win straight back over `play()`.
    const release = () => {
      node.classList.remove(HOLD);
      for (const animation of node.getAnimations({ subtree: true })) animation.play();
      latest.current?.();
    };

    /*
      Reduced motion releases immediately. Nothing here decides whether
      content is shown -- only whether it animates on the way in -- and the
      stylesheet has already turned the animations themselves off, so holding
      one back would only delay a number that is going to appear at its final
      value anyway.
    */
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      release();
      return;
    }

    const box = node.getBoundingClientRect();
    if (box.top < window.innerHeight && box.bottom > 0) {
      release();
      return;
    }

    hold();
    const observer = observerFor(threshold);
    callbacks.set(node, release);
    observer.observe(node);

    return () => {
      observer.unobserve(node);
      callbacks.delete(node);
      node.classList.remove(HOLD);
    };
  }, [threshold, enabled]);

  return ref;
}
