/**
 * GSAP, registered once.
 *
 * Imported only from client components. Every plugin the site uses is
 * registered here so no component registers its own, and `useGSAP` is
 * registered with them because it is what scopes a component's tweens to a
 * context that reverts on unmount -- which happens whenever a navigation
 * replaces the page's segment.
 */
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);

/** The one condition every animation on the site is gated on. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

/** The site's ease: quick off the mark, long settle. */
export const EASE = "power3.out";

export { gsap, ScrollTrigger, SplitText, useGSAP };
