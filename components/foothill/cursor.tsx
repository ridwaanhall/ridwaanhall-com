"use client";

import { useRef } from "react";

import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";

const CLICKABLE = "a, button, summary, label, [role='button'], #search-modal li";
const TYPING = "input, textarea, select, [contenteditable='true']";

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
      const toX = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
      const toY = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });
      let size = 1;
      const resize = (scale: number, opacity = 1) => {
        if (scale === size) return;
        size = scale;
        gsap.to(el, { scale, autoAlpha: opacity, duration: 0.35, ease: "power3.out", overwrite: "auto" });
      };

      const onMove = (event: PointerEvent) => {
        toX(event.clientX);
        toY(event.clientY);
        if (gsap.getProperty(el, "opacity") === 0 && size !== 0) gsap.to(el, { autoAlpha: 1, duration: 0.3 });
      };
      // Over text the disc takes the size of the letters under it -- a caption
      // gets a small one, a page title a large one -- so it covers about one
      // line of whatever is being read. Clickable things get a little more.
      const onOver = (event: PointerEvent) => {
        const target = event.target as Element | null;
        if (!target || target.closest(TYPING)) return resize(0, 0);
        const clickable = target.closest(CLICKABLE);
        const holdsText = Array.from(target.childNodes).some(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
        );
        const textBox = holdsText ? target : clickable;
        if (!textBox) return resize(1);
        const letters = parseFloat(getComputedStyle(textBox).fontSize) || 16;
        const scale = (letters * (clickable ? 1.9 : 1.4)) / 14;
        resize(Math.round(Math.min(10, Math.max(1, scale)) * 10) / 10);
      };
      const onDown = () => gsap.to(el, { scale: size * 0.75, duration: 0.15, overwrite: "auto" });
      const onUp = () => gsap.to(el, { scale: size, duration: 0.4, ease: "back.out(3)", overwrite: "auto" });
      const onLeave = () => gsap.to(el, { autoAlpha: 0, duration: 0.3 });

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver);
      window.addEventListener("pointerdown", onDown);
      window.addEventListener("pointerup", onUp);
      document.documentElement.addEventListener("pointerleave", onLeave);
      return () => {
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        window.removeEventListener("pointerdown", onDown);
        window.removeEventListener("pointerup", onUp);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    });
    return () => mm.revert();
  });

  return <div ref={dot} aria-hidden="true" className="fh-cursor" />;
}
