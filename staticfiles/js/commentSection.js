/**
 * Comment section behaviour: reply targeting and message dismissal.
 *
 * Progressive enhancement only -- without JS the reply control is simply absent
 * and the comment form still posts normally.
 *
 * Deleting a comment is handled by confirmDialog.js via the site-wide
 * confirmation dialog, so none of that lives here.
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

    // ---- message dismissal ------------------------------------------------
    document.querySelectorAll("#comment-messages .close-message-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
            btn.closest(".message-alert").remove();
        });
    });
});
