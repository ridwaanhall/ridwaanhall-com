"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useState } from "react";

import { SPRING } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";

/** 2πr for the ring's r = 23, so the dash can be the whole circumference. */
const RING = 144.5;

/**
 * The way back to the top: it rises in after the first screen and a half,
 * lifts on hover, and a ring around it fills as the page is read.
 */
export function ScrollTop() {
  const { scrollY, scrollYProgress } = useScroll();
  const [shown, setShown] = useState(false);
  const reduce = useReducedMotion();
  useMotionValueEvent(scrollY, "change", (y) => setShown(y > 600));
  const offset = useTransform(scrollYProgress, [0, 1], [RING, 0]);

  return (
    <AnimatePresence>
      {shown && (
        <motion.button
          key="top"
          type="button"
          className="totop"
          aria-label="Back to the top"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          transition={SPRING}
        >
          <svg className="ring" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r="23" fill="none" stroke="var(--fh-line)" strokeWidth="1" />
            <motion.circle cx="24" cy="24" r="23" fill="none" stroke="var(--fh-ink)" strokeWidth="1.5" strokeDasharray={RING} style={{ strokeDashoffset: offset }} />
          </svg>
          <Icon name="up" size={18} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
