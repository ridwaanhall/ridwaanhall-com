/**
 * Site-wide notifications.
 *
 *     notify("Message sent.", "success");
 *     notify("Something went wrong.", "error");
 *     notify(node, "info");            // an element, when the text needs a link
 *
 * Replaces the five separate implementations this consolidated: three Django
 * message blocks with their own markup and two hand-rolled JS builders
 * (guestbook showLoginMessage(), contact showMessage()).
 *
 * The markup is NOT built here. templates/components/notifications.html renders
 * one empty <template> per variant from components/_toast.html, and this clones
 * whichever it needs -- so the palette lives in the template alone and this file
 * cannot drift from it. Server-rendered Django messages come from that same
 * partial, which is also why they keep working with JS off.
 *
 * Dismissal is delegated from document, so toasts added at any time are covered
 * without rebinding -- the pattern tooltip.js already uses for the same reason.
 */
(function () {
    "use strict";

    var AUTO_DISMISS_MS = 6000;
    var EXIT_MS = 300; // must match the duration-300 on the toast markup
    var MAX_VISIBLE = 4;

    function reducedMotion() {
        return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    function container() {
        return document.getElementById("notifications");
    }

    function dismiss(toast) {
        if (!toast || toast.dataset.notifyClosing === "true") {
            return;
        }
        // Guard re-entry: the close button and the auto-dismiss timer can both
        // land on the same toast, and two removals would fight over the node.
        toast.dataset.notifyClosing = "true";

        if (reducedMotion()) {
            toast.remove();
            return;
        }
        toast.classList.add("opacity-0", "-translate-y-2");
        setTimeout(function () { toast.remove(); }, EXIT_MS);
    }

    function scheduleDismiss(toast, delay) {
        if (toast.dataset.notifyTimed === "true") {
            return;
        }
        toast.dataset.notifyTimed = "true";

        var remaining = typeof delay === "number" ? delay : AUTO_DISMISS_MS;
        var startedAt = Date.now();
        var timer = setTimeout(function () { dismiss(toast); }, remaining);

        // Hovering or focusing a toast holds it open -- a 6s timer is not long
        // enough to read a long error, and the close button is inside the very
        // element that is about to disappear.
        toast.addEventListener("mouseenter", function () {
            clearTimeout(timer);
            remaining -= Date.now() - startedAt;
        });
        toast.addEventListener("mouseleave", function () {
            startedAt = Date.now();
            timer = setTimeout(function () { dismiss(toast); }, Math.max(remaining, 1200));
        });
        toast.addEventListener("focusin", function () { clearTimeout(timer); });
    }

    /**
     * Show a notification.
     *
     * `content` is a string, or an element when the message needs markup (the
     * guestbook's "sign in to reply" prompt carries a link). Strings go in as
     * textContent -- they routinely include user-supplied names and server
     * error text, neither of which may be parsed as HTML.
     */
    function notify(content, variant) {
        var host = container();
        var template = document.getElementById("notify-toast-" + (variant || "info"));
        if (!host || !template) {
            return null;
        }

        var toast = template.content.firstElementChild.cloneNode(true);
        var slot = toast.querySelector("[data-notify-text]");
        if (content instanceof Node) {
            slot.appendChild(content);
        } else {
            slot.textContent = content;
        }

        if (!reducedMotion()) {
            toast.classList.add("opacity-0", "-translate-y-2");
        }
        host.appendChild(toast);

        // Oldest first, so a burst of errors doesn't push the newest off-screen.
        while (host.children.length > MAX_VISIBLE) {
            host.firstElementChild.remove();
        }

        if (!reducedMotion()) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    toast.classList.remove("opacity-0", "-translate-y-2");
                });
            });
        }

        scheduleDismiss(toast);
        return toast;
    }

    document.addEventListener("click", function (event) {
        var close = event.target.closest("[data-notify-close]");
        if (close) {
            dismiss(close.closest(".notify-toast"));
        }
    });

    // Let other scripts retire a toast they own -- copyToClipboard.js raises
    // tooltip:hide for the same reason rather than reaching into internals.
    document.addEventListener("notify:dismiss", function (event) {
        var toast = event.detail && event.detail.toast;
        if (toast) {
            dismiss(toast);
        }
    });

    document.addEventListener("DOMContentLoaded", function () {
        // Server-rendered Django messages arrive already visible; they only
        // need the same auto-dismiss the client-raised ones get.
        var host = container();
        if (host) {
            Array.prototype.forEach.call(host.children, function (toast) {
                scheduleDismiss(toast);
            });
        }
    });

    window.notify = notify;
})();
