"use client";

import { useConfirm } from "@/components/providers/confirm-dialog";

/**
 * Sign out, confirmed through the shared dialog.
 *
 * Top level of `components/` for the same reason `skeleton.tsx` is: the admin's
 * topbar and the site's sidebar both use it, and two copies of a control that
 * ends a session would drift.
 *
 * **It is still a submit button inside a real form.** Its form posts a server
 * action, which is what keeps sign-out a `POST` -- a `GET` that ends a session
 * is reachable by a link prefetch. This intercepts the click, asks, and submits
 * the form itself only if the answer is yes; with JavaScript unavailable the
 * click is never intercepted and the form posts as it always did. Confirmation
 * is the thing that needs JavaScript, not signing out.
 *
 * The form is read from the event before the `await`, because `currentTarget`
 * is only meaningful while the event is being dispatched and is null by the
 * time the dialog resolves.
 *
 * `message` is a prop rather than one sentence for both callers: what signing
 * out costs differs, and "you'll need to sign in again to reach the admin" is
 * wrong on a page that has no admin behind it.
 */
export function SignOutButton({
  className,
  message,
}: {
  className: string;
  message: string;
}) {
  const confirm = useConfirm();

  return (
    <button
      type="submit"
      onClick={async (event) => {
        const form = event.currentTarget.form;
        if (!form) return;
        event.preventDefault();

        const accepted = await confirm({
          title: "Sign out?",
          message,
          label: "Sign out",
        });
        if (accepted) form.requestSubmit();
      }}
      className={className}
    >
      Sign out
    </button>
  );
}
