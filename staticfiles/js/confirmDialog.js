/**
 * Site-wide "are you sure?" dialog.
 *
 * Any control that needs confirming becomes a plain button carrying
 * data-confirm-* attributes; this fills the single dialog in
 * templates/components/confirm_dialog.html. One dialog and one handler serve
 * comment deletion, comment sign-out, guestbook sign-out and guestbook message
 * deletion.
 *
 * Two ways to confirm, because not every action is a form post:
 *
 *   data-confirm-action="/some/url/"   posts the dialog's form to that URL
 *   data-confirm-event="ns:name"       dispatches that CustomEvent on document,
 *                                      with detail.trigger set to the button
 *
 * The event mode exists for actions carried out over fetch -- the guestbook
 * deletes a message via AJAX and updates the thread in place, so navigating
 * away to a form POST would throw away the page state it just maintained.
 *
 * Triggers are matched by delegation from document rather than bound once at
 * DOMContentLoaded: the guestbook inserts messages (and their delete buttons)
 * after load, and a one-shot querySelectorAll would leave those dead. Same
 * reason tooltip.js delegates.
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

    // The control that opened the dialog, so the confirm knows what it is for.
    var trigger = null;

    var dialog = window.ModalDialog.create({
        root: "confirm-dialog",
        backdrop: "confirm-dialog-backdrop",
        panel: "confirm-dialog-content",
        // Focus Cancel, never the confirm button: a stray Enter must not carry
        // out a destructive action the user only meant to look at.
        onShown: function () { if (cancelBtn) { cancelBtn.focus(); } },
        // Escape and backdrop dismissal bypass the cancel button, so the
        // pending trigger is cleared here rather than on that click alone.
        onHidden: function () { trigger = null; },
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

    document.addEventListener("click", function (event) {
        var btn = event.target.closest("[data-confirm-action], [data-confirm-event]");
        if (!btn) {
            return;
        }
        trigger = btn;

        // In event mode there is no URL to post to; clear any action a previous
        // form-mode trigger left behind so a stray submit cannot reuse it.
        form.setAttribute("action", btn.dataset.confirmAction || "");

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

    form.addEventListener("submit", function (event) {
        if (!trigger || !trigger.dataset.confirmEvent) {
            return; // form mode: let the POST go through as normal
        }
        event.preventDefault();

        var accepted = trigger;
        trigger = null;
        dialog.hide();
        document.dispatchEvent(new CustomEvent(accepted.dataset.confirmEvent, {
            detail: { trigger: accepted },
        }));
    });

    document.addEventListener("click", function (event) {
        if (event.target.closest("[data-confirm-dialog-close]")) {
            trigger = null;
            dialog.hide();
        }
    });
});
