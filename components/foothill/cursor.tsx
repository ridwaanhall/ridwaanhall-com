"use client";

import { useRef } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";

const CLICKABLE = "a, button, summary, label, [role='button'], #search-modal li";
const TYPING = "input, textarea, select, [contenteditable='true'], iframe";
/** Larger than this and the disc hides the words it sits on. */
const MAX_SCALE = 6;

/**
 * A disc that trails a fine pointer (`.fh-cursor` in styles/site.css).
 *
 * It inverts what it passes over, grows over anything that can be clicked,
 * gives a little on a press and steps aside wherever a text caret is the
 * better guide. Only for a mouse or a trackpad, and only when motion is
 * welcome: on touch there is no pointer to follow.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = dot.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add(`${MOTION_OK} and (pointer: fine) and (hover: hover)`, () => {
      // Short enough to feel attached to the hand, long enough to read as a
      // glide rather than a second pointer.
      const toX = gsap.quickTo(el, "x", { duration: 0.16, ease: "power3.out" });
      const toY = gsap.quickTo(el, "y", { duration: 0.16, ease: "power3.out" });
      let size = 1;
      let shown = false;
      let x = 0;
      let y = 0;
      // A size is read from computed style, which is not free; the answer for
      // an element does not change while it is pointed at.
      const sizes = new WeakMap<Element, number>();

      const show = (visible: boolean) => {
        if (visible === shown) return;
        shown = visible;
        gsap.to(el, { autoAlpha: visible ? 1 : 0, duration: 0.25, overwrite: "auto" });
      };
      const resize = (scale: number) => {
        if (scale === size) return;
        size = scale;
        gsap.to(el, { scale, duration: 0.3, ease: "power3.out", overwrite: "auto" });
      };

      // Over text the disc takes the size of the letters under it -- a caption
      // gets a small one, a page title a large one -- so it covers about one
      // line of whatever is being read. Clickable things get a little more.
      const scaleFor = (target: Element) => {
        const known = sizes.get(target);
        if (known !== undefined) return known;
        const clickable = target.closest(CLICKABLE);
        const holdsText = Array.from(target.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        const textBox = holdsText ? target : clickable;
        let scale = 1;
        if (textBox) {
          const letters = parseFloat(getComputedStyle(textBox).fontSize) || 16;
          scale = Math.round(Math.min(MAX_SCALE, Math.max(1, (letters * (clickable ? 1.9 : 1.4)) / 14)) * 10) / 10;
        }
        sizes.set(target, scale);
        return scale;
      };
      const settle = (target: Element | null) => {
        if (!target || target.closest(TYPING)) return show(false);
        show(true);
        resize(scaleFor(target));
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return show(false);
        x = event.clientX;
        y = event.clientY;
        // The first move places the disc where the pointer is, rather than
        // gliding in from the corner of the page.
        if (!shown && gsap.getProperty(el, "opacity") === 0) gsap.set(el, { x, y });
        toX(x);
        toY(y);
        settle(event.target as Element | null);
      };
      // Scrolling moves the page under a pointer that stays put, and fires no
      // pointer event: ask again what is under it, once a frame at most.
      let frame = 0;
      const onScroll = () => {
        if (!shown || frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          settle(document.elementFromPoint(x, y));
        });
      };
      const onDown = () => gsap.to(el, { scale: size * 0.75, duration: 0.12, overwrite: "auto" });
      const onUp = () => gsap.to(el, { scale: size, duration: 0.35, ease: "back.out(3)", overwrite: "auto" });
      const onLeave = () => show(false);

      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true, capture: true });
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("blur", onLeave);
      document.documentElement.addEventListener("pointerleave", onLeave);
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("scroll", onScroll, { capture: true });
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("blur", onLeave);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => mm.revert();
  });

  return <div ref={dot} aria-hidden="true" className="fh-cursor" />;
}
