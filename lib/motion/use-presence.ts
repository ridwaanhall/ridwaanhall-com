import { useEffect, useRef, useState } from "react";

import { gsap, MOTION_OK } from "@/lib/motion/gsap";

type Build = (timeline: gsap.core.Timeline, el: HTMLElement) => void;

/**
 * Keep something on the page while it leaves, not only while it is open.
 *
 * `open` is what the reader asked for; the returned `shown` trails it by the
 * length of the exit, so a menu, a panel or a dialog folds away the way it
 * arrived instead of vanishing. Render the element while `shown`, and hide or
 * unmount it once `shown` is false.
 *
 * Under reduced motion both timelines are jumped to their end, so the element
 * still arrives and leaves through the same code -- only without travel. The
 * first render plays nothing: something open from the start was painted open.
 */
export function usePresence(
  open: boolean,
  ref: React.RefObject<HTMLElement | null>,
  { enter, exit }: { enter?: Build; exit: Build },
): boolean {
  const [shown, setShown] = useState(open);
  const [was, setWas] = useState(open);
  const first = useRef(true);

  // Opening shows it at once; closing waits for the exit to finish. Adjusted
  // during render so an opening never paints a frame of the closed state.
  if (open !== was) {
    setWas(open);
    if (open) setShown(true);
  }

  useEffect(() => {
    const el = ref.current;
    if (first.current) {
      first.current = false;
      return;
    }
    if (!el) return;
    const instant = !window.matchMedia(MOTION_OK).matches;
    if (open) {
      if (!enter) return;
      const timeline = gsap.timeline();
      enter(timeline, el);
      if (instant) timeline.progress(1);
      return () => {
        timeline.kill();
      };
    }
    if (!shown) return;
    const timeline = gsap.timeline({ onComplete: () => setShown(false) });
    exit(timeline, el);
    if (instant) timeline.progress(1);
    return () => {
      timeline.kill();
    };
    // `enter` and `exit` are rebuilt every render; only the state matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shown]);

  return shown;
}
