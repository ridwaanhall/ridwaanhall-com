"use client";

import { toast as sonner } from "sonner";

import { Toast, type ToastVariant } from "@/components/site/toast";

/**
 * Site-wide notifications.
 *
 *     notify("Message sent.", "success");
 *     notify("Something went wrong.", "error");
 *     notify(<>Please <a href="/guestbook">sign in</a> to reply.</>, "info");
 *
 * The markup is not built here -- `<Toast>` is the only definition of it, and
 * this hands sonner a render function so the palette cannot drift from the
 * component the way `notify.js` had to be kept in step with `_toast.html`.
 *
 * A string goes in as a text node and an element as itself. That distinction
 * was explicit in the original because it assigned `textContent` for strings:
 * they routinely carry user names and server error text, neither of which may
 * be parsed as HTML. React never parses either, so the hazard is gone, but
 * passing an element is still how a message gets a link in it.
 */
export function notify(content: React.ReactNode, variant: ToastVariant = "info") {
  return sonner.custom(
    (id) => (
      <Toast variant={variant} onDismiss={() => sonner.dismiss(id)}>
        {content}
      </Toast>
    ),
    // Django's AUTO_DISMISS_MS. Hovering or focusing the stack holds it open,
    // which sonner does for the whole region -- six seconds is not long enough
    // to read a long error, and the close button is inside the very element
    // that is about to disappear.
    { duration: AUTO_DISMISS_MS },
  );
}

/** Retire a toast this caller owns, by the id `notify` returned. */
export function dismissNotification(id: string | number) {
  sonner.dismiss(id);
}

export const AUTO_DISMISS_MS = 6000;
