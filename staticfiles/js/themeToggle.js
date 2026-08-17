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

    function applyTheme(theme) {
        document.documentElement.dataset.theme = theme;

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.setAttribute("content", THEME_COLOR[theme]);
        }

        // localStorage throws in some privacy modes; a theme that does not
        // persist is a far better outcome than a toggle that does nothing.
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            /* not persisted */
        }

        syncControls(theme);
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
            document.documentElement.dataset.theme = event.newValue;
            var meta = document.querySelector('meta[name="theme-color"]');
            if (meta) {
                meta.setAttribute("content", THEME_COLOR[event.newValue]);
            }
            syncControls(event.newValue);
        }
    });

    syncControls(currentTheme());
})();
