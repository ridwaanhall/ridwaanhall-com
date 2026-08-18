/*
 * Theme toggle.
 *
 * The theme itself is applied by a blocking inline script in <head> (see
 * base_seo.html) so there is no flash of the wrong palette before this file --
 * which is deferred -- runs. This script only handles interaction:
 * click-to-switch, keeping every toggle instance's aria-pressed accurate, and
 * updating the address-bar color on mobile.
 *
 * Icon visibility is pure CSS off html[data-theme], not JS. See input.css.
 */
(function () {
    "use strict";

    var STORAGE_KEY = "theme";
    var THEME_COLOR = { light: "#ffffff", dark: "#000000" };

    function currentTheme() {
        return document.documentElement.dataset.theme === "light" ? "light" : "dark";
    }

    function syncControls(theme) {
        var toggles = document.querySelectorAll("[data-theme-toggle]");
        for (var i = 0; i < toggles.length; i++) {
            toggles[i].setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        }
    }

    // The visual swap. Every path that changes the theme goes through here, so
    // a change arriving from another tab is as flicker-free as a local click.
    function setTheme(theme) {
        var root = document.documentElement;

        // Swap the whole page in one frame rather than letting every element
        // animate the colour change over its own duration -- see the
        // .theme-switching rule in input.css. Reading offsetHeight forces the
        // new palette to be committed while transitions are still off, so
        // removing the class immediately after cannot start an animation.
        root.classList.add("theme-switching");
        root.dataset.theme = theme;
        void root.offsetHeight;
        root.classList.remove("theme-switching");

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute("content", THEME_COLOR[theme]);
        }

        syncControls(theme);
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
