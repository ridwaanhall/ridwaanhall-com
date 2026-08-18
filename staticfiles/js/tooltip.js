/*
 * Tooltips that work on touch as well as hover.
 *
 * A native `title` only renders on hover, so on a phone or tablet every one of
 * them is unreachable. This upgrades them into a positioned element shown on
 * hover, on keyboard focus, and on tap.
 *
 * Everything is delegated from the document rather than bound per element, so
 * markup injected later -- guestbook messages, lightbox controls, slider
 * buttons -- is covered with no observers and no re-scanning.
 *
 * Tapping never blocks the trigger: the tooltip is shown from a plain `click`
 * listener with no preventDefault, so a tooltip on a link or a button still
 * navigates or submits on the same tap that reveals it.
 */
(function () {
    "use strict";

    var TAP_VISIBLE_MS = 2000; // how long a tapped tooltip stays up
    var GAP = 8; // px between the trigger and the chip
    var EDGE = 8; // minimum px from the viewport edge

    var tip = null;
    var current = null;
    var hideTimer = 0;
    // Recorded on pointerdown because `click` does not carry pointerType.
    // Hybrid laptops report per-interaction, which is what we want.
    var lastPointerType = "mouse";

    function ensureTip() {
        if (tip) {
            return;
        }
        tip = document.createElement("div");
        tip.className = "app-tooltip";
        tip.setAttribute("role", "tooltip");
        tip.setAttribute("aria-hidden", "true");
        document.body.appendChild(tip);
    }

    /*
     * Move `title` to `data-tooltip` so the browser stops drawing its own
     * tooltip on top of ours.
     *
     * `title` doubles as an accessible name when nothing else labels the
     * element, so removing it can leave a bare icon button anonymous. Where
     * that would happen -- no aria-label, no text -- the text is copied to
     * aria-label first. Migration happens lazily on first interaction, and
     * until then the original `title` is still doing the job, so the element
     * is never nameless.
     */
    function migrate(el) {
        var title = el.getAttribute("title");
        if (title === null) {
            return el.getAttribute("data-tooltip");
        }
        el.removeAttribute("title");
        title = title.trim();
        if (!title) {
            return el.getAttribute("data-tooltip");
        }
        el.setAttribute("data-tooltip", title);
        if (!el.getAttribute("aria-label") && !el.textContent.trim()) {
            el.setAttribute("aria-label", title);
        }
        return title;
    }

    function place(el) {
        var rect = el.getBoundingClientRect();
        var box = tip.getBoundingClientRect();

        // Prefer above; drop below when there is not room.
        var placement = "top";
        var top = rect.top - box.height - GAP;
        if (top < EDGE) {
            placement = "bottom";
            top = rect.bottom + GAP;
        }

        var centre = rect.left + rect.width / 2;
        var left = centre - box.width / 2;
        var max = window.innerWidth - box.width - EDGE;
        if (left > max) {
            left = max;
        }
        if (left < EDGE) {
            left = EDGE;
        }

        tip.style.top = Math.round(top) + "px";
        tip.style.left = Math.round(left) + "px";
        tip.setAttribute("data-placement", placement);
        // Keep the arrow under the trigger even when the chip was clamped.
        tip.style.setProperty("--app-tooltip-arrow", Math.round(centre - left) + "px");
    }

    function show(el) {
        var text = migrate(el);
        if (!text) {
            return;
        }
        ensureTip();
        clearTimeout(hideTimer);
        hideTimer = 0;
        current = el;
        tip.textContent = text;
        tip.setAttribute("aria-hidden", "false");
        // Position before revealing, or the first frame lands in the corner.
        tip.style.opacity = "0";
        tip.removeAttribute("data-visible");
        place(el);
        tip.style.removeProperty("opacity");
        tip.setAttribute("data-visible", "true");
    }

    function hide() {
        if (!tip) {
            return;
        }
        clearTimeout(hideTimer);
        hideTimer = 0;
        current = null;
        tip.removeAttribute("data-visible");
        tip.setAttribute("aria-hidden", "true");
    }

    function trigger(target) {
        return target && target.closest
            ? target.closest("[title], [data-tooltip]")
            : null;
    }

    document.addEventListener(
        "pointerdown",
        function (event) {
            lastPointerType = event.pointerType || "mouse";
        },
        true
    );

    // mouseover/mouseout rather than mouseenter/mouseleave: these bubble, which
    // is what makes one delegated listener possible.
    document.addEventListener("mouseover", function (event) {
        if (lastPointerType === "touch") {
            return; // a tap also emits compatibility mouse events; let click win
        }
        var el = trigger(event.target);
        if (el && el !== current) {
            show(el);
        }
    });

    document.addEventListener("mouseout", function (event) {
        if (current && !trigger(event.relatedTarget)) {
            hide();
        }
    });

    document.addEventListener("focusin", function (event) {
        var el = trigger(event.target);
        if (el) {
            show(el);
        }
    });

    document.addEventListener("focusout", function () {
        hide();
    });

    /*
     * Touch. No preventDefault anywhere here -- the tap continues through to
     * the link or button exactly as it would without a tooltip; the chip simply
     * appears alongside and times itself out.
     */
    document.addEventListener("click", function (event) {
        if (lastPointerType !== "touch" && lastPointerType !== "pen") {
            return;
        }
        var el = trigger(event.target);
        if (!el) {
            hide();
            return;
        }
        show(el);
        hideTimer = setTimeout(hide, TAP_VISIBLE_MS);
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            hide();
        }
    });

    // Escape hatch for code that needs the chip out of the way -- the copy
    // button raises this so its success message is not competing with the
    // "Copy link" label still sitting in the same spot on a touch timer.
    document.addEventListener("tooltip:hide", hide);

    // A tooltip is positioned against a rect that scrolling or resizing
    // invalidates, so drop it rather than leave it stranded.
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
})();
