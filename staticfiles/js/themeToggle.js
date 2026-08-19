/*
 * Theme toggle.
 *
 * The theme itself is applied by a blocking inline script in <head> (see
 * base_seo.html) so there is no flash of the wrong palette before this file --
 * which is deferred -- runs. This script only handles interaction:
 * click-to-switch, animating the swap, keeping every toggle instance's
 * aria-pressed accurate, and updating the address-bar color on mobile.
 *
 * Icon visibility is pure CSS off html[data-theme], not JS. See input.css.
 *
 * ANIMATING THE SWAP
 * ------------------
 * Flipping `data-theme` restyles nearly every element at once, and each then
 * animates over whatever duration it declares -- 200ms on <body>, 700ms on
 * #page-content, 300ms on 148 others. Animating them individually is what
 * produces a cascade, so all three paths below change the page as one unit:
 *
 *   1. View Transitions API: the browser crossfades between two snapshots of
 *      the whole document, so the per-element durations are out of the
 *      picture entirely. Every switch takes this path the same way, whether
 *      it came from a click or from another tab.
 *   2. Without that API: every element is forced onto one shared colour
 *      transition, so they at least move in lockstep.
 *   3. prefers-reduced-motion: committed with transitions off, instantly.
 *
 * An earlier version wiped the new theme in from the clicked button as a
 * growing circle. It was dropped: at a resized viewport a different toggle
 * instance (mobile navbar vs. desktop rail) is the visible one, so the wipe
 * did not reliably start from the button that was actually pressed, and the
 * 450ms circle read as heavier than the plain crossfade.
 *
 * The matching CSS is at the bottom of static/css/input.css.
 */
(function () {
    "use strict";

    var STORAGE_KEY = "theme";
    var THEME_COLOR = { light: "#ffffff", dark: "#000000" };
    // Keep in step with --theme-transition-duration in input.css.
    var FADE_MS = 320;
    var MODE_CLASSES = ["theme-switching", "theme-crossfade", "theme-fading"];

    var root = document.documentElement;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var supportsViewTransitions = typeof document.startViewTransition === "function";
    var fadeTimer = null;
    // Every switch takes a ticket. A switch that lands while an earlier one is
    // still running supersedes it, and the earlier one must then not clean up
    // classes the newer one is relying on.
    var seq = 0;

    function currentTheme() {
        return root.dataset.theme === "light" ? "light" : "dark";
    }

    function syncControls(theme) {
        var toggles = document.querySelectorAll("[data-theme-toggle]");
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        }
    }

    // The actual swap. Everything else in this file exists to decide how it
    // should be dressed.
    function commit(theme) {
        root.dataset.theme = theme;

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute("content", THEME_COLOR[theme]);
        }

        syncControls(theme);
    }

    function endMode(ticket) {
        if (ticket !== seq) {
            return;
        }
        root.classList.remove.apply(root.classList, MODE_CLASSES);
    }

    function beginMode(modes) {
        root.classList.remove.apply(root.classList, MODE_CLASSES);
        root.classList.add.apply(root.classList, modes);
    }

    // No animation: the swap is committed with every transition suppressed, so
    // not one element can start one. Reading offsetHeight forces the new
    // palette to be committed while they are still off, which is what makes
    // removing the class on the next line safe.
    function swapInstantly(theme) {
        root.classList.add("theme-switching");
        commit(theme);
        void root.offsetHeight;
        root.classList.remove("theme-switching");
    }

    // Fallback path. `.theme-fading` has to be committed *before* the palette
    // changes, or the unified transition is not yet in effect when the colours
    // move and nothing animates at all.
    function swapWithFade(theme, ticket) {
        beginMode(["theme-fading"]);
        void root.offsetHeight;
        commit(theme);

        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(function () {
            endMode(ticket);
        }, FADE_MS + 60);
    }

    function swapWithViewTransition(theme, ticket) {
        // `theme-switching` rides along so the live DOM under the snapshots is
        // not animating too -- its cascade would otherwise surface the instant
        // the transition ends and the real page is revealed.
        beginMode(["theme-switching", "theme-crossfade"]);

        var transition = document.startViewTransition(function () {
            commit(theme);
        });

        function done() {
            endMode(ticket);
        }
        // A superseded transition rejects `finished`; either way the classes
        // have to come off.
        transition.finished.then(done, done);
    }

    // The visual swap. Every path that changes the theme goes through here, so
    // a change arriving from another tab is as considered as a local click.
    function setTheme(theme) {
        if (theme === currentTheme()) {
            commit(theme);
            return;
        }

        var ticket = ++seq;

        if (reduceMotion.matches) {
            swapInstantly(theme);
        } else if (supportsViewTransitions) {
            swapWithViewTransition(theme, ticket);
        } else {
            swapWithFade(theme, ticket);
        }
    }

    function applyTheme(theme) {
        setTheme(theme);

        // localStorage throws in some privacy modes; a theme that does not
        // persist is a far better outcome than a toggle that does nothing.
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            /* not persisted */
        }
    }

    document.addEventListener("click", function (event) {
        var toggle = event.target.closest("[data-theme-toggle]");
        if (!toggle) {
            return;
        }

        applyTheme(currentTheme() === "light" ? "dark" : "light");
    });

    // Another tab switched theme -- follow it, but do not write back.
    window.addEventListener("storage", function (event) {
        if (event.key !== STORAGE_KEY || !event.newValue) {
            return;
        }
        if (event.newValue === "light" || event.newValue === "dark") {
            // setTheme, not applyTheme -- following another tab must not write
            // back to storage.
            setTheme(event.newValue);
        }
    });

    syncControls(currentTheme());
})();
