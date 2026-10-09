"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { useEffect } from "react";

/**
 * A small disc that follows a mouse, inverting what it passes over.
 *
 * It grows over anything that can be pressed or explained, and steps aside
 * over pictures -- a screenshot, a cover, the portrait, the heatmap -- where
 * its difference blend would turn the colours inside out. Never on a touch
 * screen, and never for a reader who asks for reduced motion.
 */
export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const scale = useMotionValue(1);
  const sx = useSpring(x, { stiffness: 700, damping: 45, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 700, damping: 45, mass: 0.4 });
  const ss = useSpring(scale, { stiffness: 400, damping: 28 });

  useEffect(() => {
    if (window.matchMedia("(hover: none), (prefers-reduced-motion: reduce)").matches) return;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      x.set(event.clientX);
      y.set(event.clientY);
      const target = event.target as Element | null;
      const picture = target?.closest?.("input, textarea, select, img, video, canvas, iframe, .thumb, .heat, .who .ph, .mini, .cv-page");
      const pressable = target?.closest?.("a, button, label, summary, [role=button], [role=option], [title]");
      scale.set(picture ? 0 : pressable ? 3 : 1);
    };
    const leave = () => scale.set(0);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [x, y, scale]);

  return <motion.div className="cursor" aria-hidden="true" style={{ x: sx, y: sy, scale: ss }} />;
}
