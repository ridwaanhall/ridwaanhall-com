"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
 */

/**
 * Most routes here are prerendered and prefetched, so a navigation frequently
 * commits within a frame or two. Showing a bar for that reads as a flicker, not
 * as feedback -- so nothing appears at all unless the wait outlasts this.
 */
const REVEAL_DELAY_MS = 120;

const TRICKLE_EVERY_MS = 200;

/**
 * The trickle closes a twelfth of the remaining distance each tick, so it slows
 * as it goes and never arrives. Reaching 100% before the page did would be a
 * lie, and one the next navigation has no room left to tell.
 */
const TRICKLE_FRACTION = 0.12;
const TRICKLE_CEILING = 90;

const START_WIDTH = 20;

/** Matches the width transition in globals.css, so the fill finishes first. */
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

  const [state, setState] = useState<State>("idle");
  const [width, setWidth] = useState(0);

  const timers = useRef<{
    reveal?: ReturnType<typeof setTimeout>;
    trickle?: ReturnType<typeof setInterval>;
    giveUp?: ReturnType<typeof setTimeout>;
    fade?: ReturnType<typeof setTimeout>;
    reset?: ReturnType<typeof setTimeout>;
  }>({});

  /** A navigation is under way. */
  const pending = useRef(false);
  /** It outlasted the reveal delay, so there is something on screen to finish. */
  const revealed = useRef(false);

  const clearTimers = useCallback(() => {
    const t = timers.current;
    if (t.reveal) clearTimeout(t.reveal);
    if (t.trickle) clearInterval(t.trickle);
    if (t.giveUp) clearTimeout(t.giveUp);
    if (t.fade) clearTimeout(t.fade);
    if (t.reset) clearTimeout(t.reset);
    timers.current = {};
  }, []);

  const finish = useCallback(() => {
    if (!pending.current) return;
    pending.current = false;
    clearTimers();

    // Never revealed: the navigation beat the delay, so there is nothing to
    // wind down and nothing was ever painted.
    if (!revealed.current) {
      setState("idle");
      setWidth(0);
      return;
    }
    revealed.current = false;

    // Fill first, fade second. Doing both in one commit would start the fade
    // while the bar was still crossing the screen, so it would never be seen
    // to complete.
    setWidth(100);
    timers.current.fade = setTimeout(() => setState("done"), FILL_MS);
    timers.current.reset = setTimeout(() => {
      setState("idle");
      setWidth(0);
    }, FILL_MS + FADE_MS);
  }, [clearTimers]);

  const start = useCallback(() => {
    // Two clicks before the first commits are one navigation as far as the bar
    // is concerned; restarting would send it backwards.
    if (pending.current) return;
    pending.current = true;
    revealed.current = false;
    clearTimers();

    timers.current.reveal = setTimeout(() => {
      revealed.current = true;
      setState("loading");
      setWidth(START_WIDTH);

      // The bar still appears under reduced motion -- it reports state, it is
      // not decoration -- but it holds still instead of creeping.
      if (prefersReducedMotion()) return;
      timers.current.trickle = setInterval(() => {
        setWidth((w) => w + (TRICKLE_CEILING - w) * TRICKLE_FRACTION);
      }, TRICKLE_EVERY_MS);
    }, REVEAL_DELAY_MS);

    timers.current.giveUp = setTimeout(() => {
      revealed.current = true;
      finish();
    }, MAX_WAIT_MS);
  }, [clearTimers, finish]);

  /* `router.push()` produces no click for the listener below to see. */
  useEffect(() => {
    onPageLoadingStart(start);
    return () => onPageLoadingStart(null);
  }, [start]);

  useEffect(() => {
    /*
      Bubble phase, not capture. By the time a click reaches the document,
      `<Link>` has already decided whether to handle it, and a plain anchor that
      will cause a full page load is still on its way -- both are navigations
      worth reporting, and both are visible from here.
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

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    window.addEventListener("popstate", start);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
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

  return (
    <div
      id="page-loading-bar"
      aria-hidden="true"
      data-state={state}
      style={{ width: `${width}%` }}
      className="fixed top-0 left-0 h-0.5 z-[70] bg-gradient-to-r from-teal-400 via-teal-300 to-teal-500"
    />
  );
}
