/**
 * Shared behaviour for the site's centred modal dialogs.
 *
 * Extracted from the sidebar search modal, which was the only one until the
 * comment delete confirmation needed the same thing. Both now call this rather
 * than carrying their own copy of the show/hide dance.
 *
 * The markup contract matches what the search modal already used, so its
 * classes are unchanged:
 *
 *   <div id="…-modal" class="fixed inset-0 z-50 backdrop-blur-none hidden
 *                             transition-all duration-300 ease-out" aria-hidden="true">
 *     <div id="…-backdrop" class="flex min-h-full items-center justify-center p-4">
 *       <div id="…-content" class="… transform scale-95 opacity-0
 *                                  transition-all duration-300 ease-out"> … </div>
 *
 * Opening swaps backdrop-blur-none → backdrop-blur-md and the panel's
 * scale-95/opacity-0 → scale-100/opacity-100 one tick later, so the transition
 * has a frame to run in; closing reverses it and only applies `hidden` once the
 * 300ms transition has finished.
 */
window.ModalDialog = (function () {
    "use strict";

    var SHOW_DELAY = 10;    // let the browser paint before transitioning
    var FOCUS_DELAY = 150;
    var HIDE_DURATION = 300; // must match the duration-300 on the markup

    function create(options) {
        var root = document.getElementById(options.root);
        var backdrop = options.backdrop ? document.getElementById(options.backdrop) : null;
        var panel = document.getElementById(options.panel);
        if (!root || !panel) {
            return null; // dialog isn't on this page
        }

        var lastFocused = null;

        function isOpen() {
            return !root.classList.contains("hidden");
        }

        function show() {
            lastFocused = document.activeElement;
            document.body.style.overflow = "hidden";
            root.classList.remove("hidden");
            root.setAttribute("aria-hidden", "false");

            setTimeout(function () {
                root.classList.remove("backdrop-blur-none");
                root.classList.add("backdrop-blur-md");
                panel.classList.remove("scale-95", "opacity-0");
                panel.classList.add("scale-100", "opacity-100");
            }, SHOW_DELAY);

            setTimeout(function () {
                if (typeof options.onShown === "function") {
                    options.onShown();
                }
            }, FOCUS_DELAY);
        }

        function hide() {
            root.classList.remove("backdrop-blur-md");
            root.classList.add("backdrop-blur-none");
            panel.classList.remove("scale-100", "opacity-100");
            panel.classList.add("scale-95", "opacity-0");

            setTimeout(function () {
                root.classList.add("hidden");
                root.setAttribute("aria-hidden", "true");
                document.body.style.overflow = "";
                if (typeof options.onHidden === "function") {
                    options.onHidden();
                }
                if (lastFocused && typeof lastFocused.focus === "function") {
                    lastFocused.focus();
                }
                lastFocused = null;
            }, HIDE_DURATION);
        }

        root.addEventListener("click", function (event) {
            if (event.target === root || event.target === backdrop) {
                hide();
            }
        });
        panel.addEventListener("click", function (event) {
            event.stopPropagation();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && isOpen()) {
                hide();
            }
        });

        return { show: show, hide: hide, isOpen: isOpen, root: root, panel: panel };
    }

    return { create: create };
})();
