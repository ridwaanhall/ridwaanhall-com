"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Hands the public site's scroll-in motion from CSS to GSAP.
 *
 * Before the bundle runs, `html.motion` hides what `Reveal` and
 * `SplitHeading` are about to animate, with a three-second failsafe that
 * shows everything if they never do (`styles/site.css`). Setting
 * `motion-live` here cancels that failsafe: from now on each component owns
 * its own element.
 *
 * It also re-measures every trigger once the page has finished arriving.
 * Streamed sections and late images move everything below them, and a
 * trigger measured before that fires in the wrong place.
 *
 * Keyed with the pathname by the shell, so it runs once per page.
 */
export function PageMotion({ children }: { children: React.ReactNode }) {
  useGSAP(() => {
    document.documentElement.classList.add("motion-live");
    const refresh = () => ScrollTrigger.refresh();
    const timer = window.setTimeout(refresh, 400);
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", refresh);
    };
  });

  return <>{children}</>;
}
