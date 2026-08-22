"use client";

import { useEffect } from "react";

/**
 * The click spark burst.
 *
 * Ten thin lines radiate from the cursor, shrinking into their own heads as
 * they travel outward, then fading.
 *
 * Drawn on one canvas overlay rather than as DOM nodes. That matters here
 * specifically because a burst is ten elements, not one: per-click nodes would
 * be ten times worse than a single ripple. The canvas is one element no matter
 * how fast you click, and the loop stops itself once the last burst finishes,
 * so an idle page costs nothing.
 *
 * The canvas is appended to `document.body`, not rendered in place: it is
 * `position: fixed`, and `#page-content` carries a transform, which would
 * become its containing block and confine the sparks to the content column.
 */

/** Lines per burst. */
const SPARKS = 10;
const DURATION = 450;
/** px from the click point; leaves a small void at the cursor. */
const RADIUS_START = 12;
const RADIUS_END = 42;
/** Initial length of each line. */
const TAIL = 10;
const LINE_WIDTH = 2;
/** Hammering the mouse must not pile up work. */
const MAX_BURSTS = 5;
/** Radians, so the star is not perfectly mechanical. */
const ANGLE_JITTER = 0.12;

type Burst = {
  x: number;
  y: number;
  start: number;
  rotation: number;
  jitter: number[];
  color: string;
};

/**
 * Fast departure, gentle settle.
 *
 * Quadratic rather than cubic on purpose. Cubic decelerates so hard that a
 * spark covers 98% of its travel in the first 70% of the duration and then
 * hangs motionless while it fades, which reads as a stall rather than a burst.
 */
function easeOutQuad(t: number): number {
  const inv = 1 - t;
  return 1 - inv * inv;
}

export function ClickSpark() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let bursts: Burst[] = [];
    let frame = 0;

    const resize = () => {
      if (!canvas || !ctx) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      // Draw in CSS pixels; the backing store stays at device resolution so the
      // strokes are crisp on HiDPI screens.
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ensureCanvas = () => {
      if (canvas) return;
      canvas = document.createElement("canvas");
      canvas.className = "click-spark-canvas";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
      ctx = canvas.getContext("2d");
      resize();
    };

    /**
     * Read once per burst rather than per frame. Doing it at burst time is also
     * why no theme-change observer is needed: the next click is simply correct.
     * A burst already in flight keeps its old colour for the remaining ~450ms,
     * which is not perceivable.
     */
    const sparkColor = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--spark-rgb").trim() ||
      "212, 212, 216";

    const draw = (now: number) => {
      frame = 0;
      if (!ctx) return;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      const live: Burst[] = [];
      for (const burst of bursts) {
        const t = Math.max(0, (now - burst.start) / DURATION);
        if (t >= 1) continue;
        live.push(burst);

        const head = RADIUS_START + (RADIUS_END - RADIUS_START) * easeOutQuad(t);
        // The tail closes on the head, so each line contracts as it flies
        // rather than sliding outward at a fixed length.
        //
        // Deliberately linear in t, NOT in the eased value: tying the decay to
        // the easing makes the length collapse exactly as fast as the head
        // decelerates, so the sparks shrink to sub-pixel nubs halfway through
        // and stop reading as lines at all.
        const tail = Math.max(0, head - TAIL * (1 - t));
        // Full strength through the fast part of the flight, then a clean fade
        // that lands exactly when the movement does.
        const alpha = Math.min(1, 2.2 * (1 - t));

        ctx.strokeStyle = `rgba(${burst.color}, ${alpha})`;
        ctx.lineWidth = LINE_WIDTH;
        ctx.lineCap = "round";
        ctx.beginPath();

        for (let i = 0; i < SPARKS; i++) {
          const angle = (i / SPARKS) * Math.PI * 2 + burst.rotation + burst.jitter[i];
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          ctx.moveTo(burst.x + cos * tail, burst.y + sin * tail);
          ctx.lineTo(burst.x + cos * head, burst.y + sin * head);
        }

        ctx.stroke();
      }

      bursts = live;

      // Nothing scheduled when idle: the frame above already cleared the canvas
      // and drew nothing, so stopping here leaves it blank and the page costs
      // nothing until the next click.
      if (bursts.length) frame = requestAnimationFrame(draw);
    };

    const spark = (x: number, y: number) => {
      ensureCanvas();
      bursts.push({
        x,
        y,
        start: performance.now(),
        // Random per burst, so two clicks in the same spot never produce the
        // same star.
        rotation: Math.random() * Math.PI * 2,
        jitter: Array.from({ length: SPARKS }, () => (Math.random() - 0.5) * ANGLE_JITTER),
        color: sparkColor(),
      });
      if (bursts.length > MAX_BURSTS) bursts.shift();
      if (!frame) frame = requestAnimationFrame(draw);
    };

    const teardown = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      bursts = [];
      canvas?.remove();
      canvas = null;
      ctx = null;
    };

    /*
     * `mousedown`, deliberately not `pointerdown`, and this is what makes the
     * effect safe on touch.
     *
     * On a touch device `mousedown` is a *compatibility* event, and the browser
     * only dispatches it once it knows the touch was a tap. If the gesture
     * turns into a scroll or a pinch, the compatibility mouse events are never
     * sent -- so taps spark and scrolling does not, for free.
     *
     * `pointerdown` fires at the very start of every gesture, before the
     * browser knows what it is, so it would throw a burst on each scroll.
     */
    const onMouseDown = (event: MouseEvent) => {
      // Primary button only -- a right-click opening a context menu should not
      // throw sparks. Touch taps report button 0.
      if (event.button !== 0 || reduceMotion.matches) return;
      spark(event.clientX, event.clientY);
    };

    const onResize = () => {
      if (!canvas) return;
      // Resizing the backing store clears it, so drop anything in flight rather
      // than leaving half-drawn bursts behind.
      bursts = [];
      resize();
    };

    // Respond to the OS motion setting changing without needing a reload.
    const onMotionChange = () => {
      if (reduceMotion.matches) teardown();
    };

    document.addEventListener("mousedown", onMouseDown);
    window.addEventListener("resize", onResize);
    reduceMotion.addEventListener("change", onMotionChange);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("resize", onResize);
      reduceMotion.removeEventListener("change", onMotionChange);
      teardown();
    };
  }, []);

  return null;
}
