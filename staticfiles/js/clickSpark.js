/*
 * Click spark burst.
 *
 * Ten thin lines radiate from the cursor, shrinking into their own heads as
 * they travel outward, then fading. Replaces the old expanding-circle ripple.
 *
 * Drawn on one canvas overlay rather than as DOM nodes. That matters here
 * specifically because a burst is ten elements, not one: per-click nodes would
 * have been ten times worse than the effect this replaces. The canvas is a
 * single element no matter how fast you click, and the animation loop stops
 * itself once the last burst finishes, so an idle page costs nothing.
 *
 * Loaded with `defer`, so the document is already parsed when this runs -- no
 * DOMContentLoaded wrapper needed.
 */
(function () {
    "use strict";

    var SPARKS = 10; // lines per burst
    var DURATION = 450; // ms
    var RADIUS_START = 12; // px from the click point; leaves a small void at the cursor
    var RADIUS_END = 42;
    var TAIL = 10; // initial length of each line
    var LINE_WIDTH = 2;
    var MAX_BURSTS = 5; // hammering the mouse must not pile up work
    var ANGLE_JITTER = 0.12; // radians, so the star is not perfectly mechanical

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var coarsePointer = window.matchMedia("(hover: none) and (pointer: coarse)");

    var canvas = null;
    var ctx = null;
    var bursts = [];
    var frame = 0;
    var dpr = 1;

    function enabled() {
        return !reduceMotion.matches && !coarsePointer.matches;
    }

    function resize() {
        if (!canvas) {
            return;
        }
        dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(window.innerWidth * dpr);
        canvas.height = Math.floor(window.innerHeight * dpr);
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
        // Draw in CSS pixels; the backing store stays at device resolution so
        // the strokes are crisp on HiDPI screens.
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function ensureCanvas() {
        if (canvas) {
            return;
        }
        canvas = document.createElement("canvas");
        canvas.className = "click-spark-canvas";
        canvas.setAttribute("aria-hidden", "true");
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");
        resize();
    }

    function sparkColor() {
        // Read once per burst rather than per frame. Doing it at burst time is
        // also why no theme-change observer is needed: the next click is simply
        // correct. A burst already in flight keeps its old colour for the
        // remaining ~450ms, which is not perceivable.
        var value = getComputedStyle(document.documentElement)
            .getPropertyValue("--spark-rgb")
            .trim();
        return value || "212, 212, 216";
    }

    // Fast departure, gentle settle.
    //
    // Quadratic rather than cubic on purpose. Cubic decelerates so hard that a
    // spark covers 98% of its travel in the first 70% of the duration and then
    // hangs motionless while it fades, which reads as a stall rather than a
    // burst.
    function easeOutQuad(t) {
        var inv = 1 - t;
        return 1 - inv * inv;
    }

    function draw(now) {
        frame = 0;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        var live = [];
        for (var b = 0; b < bursts.length; b++) {
            var burst = bursts[b];
            var t = (now - burst.start) / DURATION;
            if (t >= 1) {
                continue;
            }
            if (t < 0) {
                t = 0;
            }
            live.push(burst);

            var head = RADIUS_START + (RADIUS_END - RADIUS_START) * easeOutQuad(t);
            // The tail closes on the head, so each line contracts as it flies
            // rather than sliding outward at a fixed length.
            //
            // Deliberately linear in t, NOT in the eased value: tying the decay
            // to the easing makes the length collapse exactly as fast as the
            // head decelerates, so the sparks shrink to sub-pixel nubs halfway
            // through and stop reading as lines at all.
            var tail = head - TAIL * (1 - t);
            if (tail < 0) {
                tail = 0;
            }
            // Full strength through the fast part of the flight, then a clean
            // fade that lands exactly when the movement does.
            var alpha = Math.min(1, 2.2 * (1 - t));

            ctx.strokeStyle = "rgba(" + burst.color + ", " + alpha + ")";
            ctx.lineWidth = LINE_WIDTH;
            ctx.lineCap = "round";
            ctx.beginPath();

            for (var i = 0; i < SPARKS; i++) {
                var angle = (i / SPARKS) * Math.PI * 2 + burst.rotation + burst.jitter[i];
                var cos = Math.cos(angle);
                var sin = Math.sin(angle);
                ctx.moveTo(burst.x + cos * tail, burst.y + sin * tail);
                ctx.lineTo(burst.x + cos * head, burst.y + sin * head);
            }

            ctx.stroke();
        }

        bursts = live;

        // Nothing scheduled when idle: the frame above already cleared the
        // canvas and drew nothing, so stopping here leaves it blank and the
        // page costs nothing until the next click.
        if (bursts.length) {
            frame = requestAnimationFrame(draw);
        }
    }

    function spark(x, y) {
        ensureCanvas();

        var jitter = new Array(SPARKS);
        for (var i = 0; i < SPARKS; i++) {
            jitter[i] = (Math.random() - 0.5) * ANGLE_JITTER;
        }

        bursts.push({
            x: x,
            y: y,
            start: performance.now(),
            // Random per burst, so two clicks in the same spot never produce
            // the same star.
            rotation: Math.random() * Math.PI * 2,
            jitter: jitter,
            color: sparkColor(),
        });

        if (bursts.length > MAX_BURSTS) {
            bursts.shift();
        }

        if (!frame) {
            frame = requestAnimationFrame(draw);
        }
    }

    function teardown() {
        if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
        }
        bursts = [];
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        canvas = null;
        ctx = null;
    }

    document.addEventListener("mousedown", function (event) {
        // Primary button only -- a right-click opening a context menu should
        // not throw sparks.
        if (event.button !== 0 || !enabled()) {
            return;
        }
        spark(event.clientX, event.clientY);
    });

    window.addEventListener("resize", function () {
        if (!canvas) {
            return;
        }
        // Resizing the backing store clears it, so drop anything in flight
        // rather than leaving half-drawn bursts behind.
        bursts = [];
        resize();
    });

    // Respond to the OS motion setting changing without needing a reload.
    // Safari before 14 only has the deprecated addListener.
    var onMotionChange = function () {
        if (!enabled()) {
            teardown();
        }
    };
    if (reduceMotion.addEventListener) {
        reduceMotion.addEventListener("change", onMotionChange);
    } else if (reduceMotion.addListener) {
        reduceMotion.addListener(onMotionChange);
    }
})();
