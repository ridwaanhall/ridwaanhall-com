"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

import { onPageLoadingStart } from "@/lib/utils/page-loading";

/**
 * The navigation progress bar at the top of every page.
 *
 * Client-side routing removed the browser's own loading indicator without
 * replacing it: a click on a nav item left the old page sitting there with
 * nothing to say anything had happened. `loading.tsx` covers the cases where a
 * skeleton makes sense; this covers all of them, including `/admin`, which
 * declines to prerender and so does a real round trip every single time.
 *
 * **It must be mounted outside `#page-content`.** That element animates a
 * transform, and a transformed ancestor becomes the containing block for its
 * `position: fixed` descendants -- a bar rendered inside it would be pinned to
 * the content column rather than the viewport. The tooltips, the spark canvas,
 * the toast stack and the confirm dialog are all body-level siblings for the
 * same reason.
 *
 * The width is driven from here rather than from a keyframe, which is the
 * exception to how the rest of this site animates. A keyframe can only describe
 * a motion known in advance; how long a navigation takes is not, and the whole
 * point of the bar is to keep saying "still working" until it commits.
 *
 * **Every navigation is reported, the instant ones included.** See
 * `MIN_VISIBLE_MS` below for why that is not the same as showing a flicker.
 */

/**
 * Every navigation is reported, and there is deliberately no threshold here.
 *
 * There was one: 120ms, on the reasoning that a bar flashing on an instant
 * route reads as a glitch rather than as feedback. What that missed is the
 * client Router Cache. It keeps a prerendered route's payload, so the first
 * visit to a listing does a round trip and is reported, while the second
 * commits in single-digit milliseconds and is not -- and a bar that appears on
 * some navigations and not others is, from the reader's side, indistinguishable
 * from one that is broken.
 *
 * The flicker was real, but it comes from *stopping* abruptly rather than from
 * starting. So the bar starts at once and stays for at least this long before
 * it begins to wind down. Even a navigation that commits in a single frame then
 * reads as one deliberate movement instead of a blink.
 */
const MIN_VISIBLE_MS = 280;

const TRICKLE_EVERY_MS = 200;

/**
 * The trickle closes a twelfth of the remaining distance each tick, so it slows
 * as it goes and never arrives. Reaching 100% before the page did would be a
 * lie, and one the next navigation has no room left to tell.
 */
const TRICKLE_FRACTION = 0.12;
const TRICKLE_CEILING = 90;

const START_WIDTH = 20;

/** Matches the width transition in styles/animations.css, so the fill
 *  finishes first. */
const FILL_MS = 400;
const FADE_MS = 500;

/**
 * A navigation that never commits -- a push that threw, a route that failed --
 * would otherwise leave the bar creeping forever.
 */
const MAX_WAIT_MS = 15_000;

type State = "idle" | "loading" | "done";

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PageLoadingBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  /*
   * The bar is written to the DOM directly rather than held in state, and that
   * is the one thing in this component worth understanding before changing it.
   *
   * React deprioritises a normal update while a transition is in flight -- and
   * a client-side navigation *is* that transition, so the update announcing it
   * queues behind the very work it is meant to be reporting. Measured in
   * development, that put the bar on screen 200-380ms after the click, which is
   * indistinguishable from the fixed delay this component used to have and
   * would have quietly reinstated it.
   *
   * Writing to the node inside the click handler paints in the same frame, on
   * every navigation, whatever the scheduler is doing. Nothing else reads these
   * values, so there is no second copy to keep in step -- and the trickle stops
   * re-rendering a subtree five times a second for a number only CSS consumes.
   */
  const bar = useRef<HTMLDivElement>(null);
  const width = useRef(0);

  const paint = useCallback((state: State, next: number) => {
    width.current = next;
    const el = bar.current;
    if (!el) return;
    el.dataset.state = state;
    el.style.width = `${next}%`;
  }, []);

  const timers = useRef<{
    trickle?: ReturnType<typeof setInterval>;
    giveUp?: ReturnType<typeof setTimeout>;
    hold?: ReturnType<typeof setTimeout>;
    fade?: ReturnType<typeof setTimeout>;
    reset?: ReturnType<typeof setTimeout>;
  }>({});

  /** A navigation is under way. */
  const pending = useRef(false);
  /** When it began, so the bar can be held for `MIN_VISIBLE_MS`. */
  const startedAt = useRef(0);

  const clearTimers = useCallback(() => {
    const t = timers.current;
    if (t.trickle) clearInterval(t.trickle);
    if (t.giveUp) clearTimeout(t.giveUp);
    if (t.hold) clearTimeout(t.hold);
    if (t.fade) clearTimeout(t.fade);
    if (t.reset) clearTimeout(t.reset);
    timers.current = {};
  }, []);

  const finish = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    clearTimers();

    const wind = () => {
      // Fill first, fade second. Doing both at once would start the fade while
      // the bar was still crossing the screen, so it would never be seen to
      // complete.
      paint("loading", 100);
      timers.current.fade = setTimeout(() => paint("done", 100), FILL_MS);
      timers.current.reset = setTimeout(() => paint("idle", 0), FILL_MS + FADE_MS);
    };

    // A navigation served from the router cache can commit before the bar has
    // finished its first frame. Winding down from there is the blink the old
    // reveal delay was trying to prevent; waiting out the remainder turns it
    // back into something that can be read.
    const shown = performance.now() - startedAt.current;
    if (shown >= MIN_VISIBLE_MS) wind();
    else timers.current.hold = setTimeout(wind, MIN_VISIBLE_MS - shown);
  }, [clearTimers, paint]);

  const start = useCallback(() => {
    /*
      Two clicks on the same link before it commits are one navigation, and
      restarting for the second would put the bar back to 20% for no reason.
      Two clicks further apart are two navigations, and the second one is the
      one worth reporting.

      `MIN_VISIBLE_MS` separates them, and it also unsticks the case that has no
      good answer otherwise: a navigation that begins and never commits leaves
      `pending` set until `MAX_WAIT_MS`, and every click in the fifteen seconds
      after it would go unreported. Restarting used to be the thing that could
      not be allowed -- it animated the bar backwards -- but the reset through
      `idle` below made that safe, so the guard can be narrow now.
    */
    if (pending.current && performance.now() - startedAt.current < MIN_VISIBLE_MS) return;
    pending.current = true;
    startedAt.current = performance.now();
    clearTimers();

    /*
      Back to nothing, in the same commit that begins the new navigation.

      Without this, a click arriving while the previous bar is still fading
      starts from whatever width it had reached -- 100%, most of the time -- and
      the CSS width transition animates it *backwards* down to 20%, which reads
      as the page un-loading. The `idle` state carries no width transition (see
      styles/animations.css), so this reset is instant and never seen.
    */
    paint("idle", 0);

    /*
      Force the reset to be laid out before growing from it.

      Both writes happen in this one handler, so without this the browser only
      ever sees the final pair and computes the transition from whatever was on
      screen -- 100%, if the previous bar was still fading -- and animates
      backwards to 20%. Reading a layout property in between makes the browser
      resolve the idle state first, so the growth below starts from zero.

      This is also why the bar is not revealed a frame later: a
      `requestAnimationFrame` callback runs after React has begun rendering the
      navigation, and in development that measured 200ms and more -- a delay as
      real as the fixed one this component was built to remove.
    */
    void bar.current?.offsetWidth;
    paint("loading", START_WIDTH);

    // The bar still appears under reduced motion -- it reports state, it is not
    // decoration -- but it holds still instead of creeping.
    if (!prefersReducedMotion()) {
      timers.current.trickle = setInterval(() => {
        paint("loading", width.current + (TRICKLE_CEILING - width.current) * TRICKLE_FRACTION);
      }, TRICKLE_EVERY_MS);
    }

    timers.current.giveUp = setTimeout(finish, MAX_WAIT_MS);
  }, [clearTimers, finish, paint]);

  /* `router.push()` produces no click for the listener below to see. */
  useEffect(() => {
    onPageLoadingStart(start);
    return () => onPageLoadingStart(null);
  }, [start]);

  useEffect(() => {
    /*
      Capture phase, and the reason is the whole point of this component.

      In the bubble phase the click has already passed through `<Link>`, whose
      handler calls `router.push()` synchronously -- route matching, cache
      lookup, and the start of a render. Measured in development that is 200ms
      and more before our listener is reached, so the bar reported the
      navigation a fifth of a second after the click that caused it. Capture
      runs before any of it.

      What capture gives up is knowing whether something further down will
      handle the click itself. Nothing on this site does: every
      `preventDefault` here is on a button or a key event, never an anchor. If
      one ever appears, the bar creeps until `MAX_WAIT_MS` rather than
      misreporting anything, and `check-page-loading.mjs` measures the first
      paint precisely so a return to the bubble phase shows up as a failure
      rather than as a slightly worse feeling.
    */
    function onClick(event: MouseEvent) {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // `mailto:` and `tel:` land here too -- their origin is "null", so the
      // same comparison rejects them along with every external link.
      if (url.origin !== window.location.origin) return;
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      // A bare hash scrolls the page it is already on.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      start();
    }

    /*
      The listing search box is a real GET form with no JavaScript behind it, so
      it navigates by unloading the page. Nothing will call `finish()` for it --
      the document goes away instead -- which is exactly right.
      Server-action forms are POST and are not navigations, so they are skipped.
    */
    function onSubmit(event: Event) {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.method.toLowerCase() !== "get") return;
      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", start);
    };
  }, [start]);

  /*
    The navigation committed. `usePathname()` alone would miss half of them:
    paging through `/blog?page=2` and searching `/projects?q=` change only the
    query, and those are the slowest navigations the site has.
  */
  const settled = `${pathname}?${searchParams}`;
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    finish();
  }, [settled, finish]);

  useEffect(() => clearTimers, [clearTimers]);

  /*
    Rendered once, at rest. Every subsequent change to `data-state` and `width`
    is written to this node by `paint` -- React never re-renders it, so the two
    cannot disagree and there is nothing for hydration to reconcile beyond the
    idle state the server already sent.
  */
  return (
    <div
      ref={bar}
      id="page-loading-bar"
      aria-hidden="true"
      data-state="idle"
      style={{ width: "0%" }}
      className="fixed top-0 left-0 h-0.5 z-[70] bg-gradient-to-r from-teal-400 via-teal-300 to-teal-500"
    />
  );
}
