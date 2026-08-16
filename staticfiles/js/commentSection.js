/**
 * Comment section behaviour: reply targeting and the delete confirmation.
 *
 * Progressive enhancement only -- without JS the reply control is simply absent
 * and the comment form still posts normally.
 *
 * The confirmation dialog is driven by modalDialog.js, the same helper the
 * sidebar search modal uses, so there is one implementation of the show/hide
 * animation, backdrop dismissal and Escape handling rather than two.
 */
document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // ---- reply targeting -------------------------------------------------
    var replyField = document.getElementById("comment-reply-to");
    var indicator = document.getElementById("comment-reply-indicator");
    var replyUser = document.getElementById("comment-reply-user");
    var cancelReply = document.getElementById("comment-cancel-reply");
    var form = document.getElementById("comment-form");

    if (replyField && form) {
        document.querySelectorAll(".comment-reply-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                replyField.value = btn.dataset.commentId;
                // textContent, never innerHTML: the display name is user-controlled.
                replyUser.textContent = btn.dataset.commentUser || "";
                indicator.classList.remove("hidden");
                indicator.classList.add("flex");
                var box = form.querySelector("textarea");
                if (box) { box.focus(); }
                form.scrollIntoView({ behavior: "smooth", block: "center" });
            });
        });

        if (cancelReply) {
            cancelReply.addEventListener("click", function () {
                replyField.value = "";
                indicator.classList.add("hidden");
                indicator.classList.remove("flex");
            });
        }
    }

    // ---- delete confirmation ---------------------------------------------
    var deleteForm = document.getElementById("comment-delete-form");
    var excerpt = document.getElementById("comment-delete-excerpt");
    var cancelBtn = document.getElementById("comment-delete-cancel");

    var dialog = window.ModalDialog && window.ModalDialog.create({
        root: "comment-delete-modal",
        backdrop: "comment-delete-backdrop",
        panel: "comment-delete-content",
        // Focus Cancel rather than Delete: a stray Enter must not destroy anything.
        onShown: function () { if (cancelBtn) { cancelBtn.focus(); } },
    });

    if (dialog && deleteForm) {
        document.querySelectorAll(".comment-delete-btn").forEach(function (btn) {
            btn.addEventListener("click", function () {
                deleteForm.setAttribute("action", btn.dataset.deleteUrl);
                var text = btn.dataset.excerpt || "";
                excerpt.textContent = text.length > 240 ? text.slice(0, 240) + "…" : text;
                dialog.show();
            });
        });

        document.querySelectorAll("[data-comment-modal-close]").forEach(function (el) {
            el.addEventListener("click", function () { dialog.hide(); });
        });
    }

    // ---- message dismissal ------------------------------------------------
    document.querySelectorAll("#comment-messages .close-message-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            btn.closest(".message-alert").remove();
        });
    });
});
