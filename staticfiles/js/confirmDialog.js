/**
 * Site-wide "are you sure?" dialog.
 *
 * Any control that needs confirming becomes a plain button carrying
 * data-confirm-* attributes; this fills the single dialog in
 * templates/components/confirm_dialog.html and posts its form. One dialog and
 * one handler serve comment deletion, comment sign-out and guestbook sign-out.
 *
 * Show/hide, backdrop dismissal and Escape come from modalDialog.js, the same
 * helper the sidebar search modal uses.
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    var form = document.getElementById("confirm-dialog-form");
    var title = document.getElementById("confirm-dialog-title");
    var message = document.getElementById("confirm-dialog-message");
    var detail = document.getElementById("confirm-dialog-detail");
    var confirmBtn = document.getElementById("confirm-dialog-confirm");
    var cancelBtn = document.getElementById("confirm-dialog-cancel");
    var icon = document.getElementById("confirm-dialog-icon");
    var nextField = document.getElementById("confirm-dialog-next");

    if (!form || !window.ModalDialog) {
        return;
    }

    var dialog = window.ModalDialog.create({
        root: "confirm-dialog",
        backdrop: "confirm-dialog-backdrop",
        panel: "confirm-dialog-content",
        // Focus Cancel, never the confirm button: a stray Enter must not carry
        // out a destructive action the user only meant to look at.
        onShown: function () { if (cancelBtn) { cancelBtn.focus(); } },
    });
    if (!dialog) {
        return;
    }

    var DANGER_BTN = ["border-red-800", "bg-red-950/60", "text-red-200",
                      "hover:border-red-500", "hover:bg-red-900/50"];
    var NEUTRAL_BTN = ["border-zinc-700", "bg-zinc-900", "text-zinc-100", "hover:bg-zinc-800"];
    var DANGER_ICON = ["border-red-900/60", "bg-red-950/40"];
    var NEUTRAL_ICON = ["border-zinc-700", "bg-zinc-900"];

    function applyVariant(variant) {
        var danger = variant === "danger";
        confirmBtn.classList.remove.apply(confirmBtn.classList, danger ? NEUTRAL_BTN : DANGER_BTN);
        confirmBtn.classList.add.apply(confirmBtn.classList, danger ? DANGER_BTN : NEUTRAL_BTN);
        icon.classList.remove.apply(icon.classList, danger ? NEUTRAL_ICON : DANGER_ICON);
        icon.classList.add.apply(icon.classList, danger ? DANGER_ICON : NEUTRAL_ICON);
        icon.querySelector("svg").classList.toggle("text-red-400", danger);
        icon.querySelector("svg").classList.toggle("text-zinc-300", !danger);
    }

    document.querySelectorAll("[data-confirm-action]").forEach(function (btn) {
        btn.addEventListener("click", function () {
            form.setAttribute("action", btn.dataset.confirmAction);

            // textContent throughout: titles and excerpts can carry user text.
            title.textContent = btn.dataset.confirmTitle || "Are you sure?";
            message.textContent = btn.dataset.confirmMessage || "";
            confirmBtn.textContent = btn.dataset.confirmLabel || "Confirm";

            var text = btn.dataset.confirmDetail || "";
            if (text) {
                detail.textContent = text.length > 240 ? text.slice(0, 240) + "…" : text;
                detail.classList.remove("hidden");
            } else {
                detail.textContent = "";
                detail.classList.add("hidden");
            }

            if (nextField) {
                // Let a control override where it lands, e.g. sign-out returning
                // to the page you were reading rather than the account default.
                nextField.value = btn.dataset.confirmNext || window.location.pathname + window.location.search;
            }

            applyVariant(btn.dataset.confirmVariant);
            dialog.show();
        });
    });

    document.querySelectorAll("[data-confirm-dialog-close]").forEach(function (el) {
        el.addEventListener("click", function () { dialog.hide(); });
    });
});
