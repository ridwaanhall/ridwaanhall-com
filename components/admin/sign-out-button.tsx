"use client";

import { useConfirm } from "@/components/providers/confirm-dialog";

/**
 * The admin's sign-out, confirmed through the shared dialog.
 *
 * **It is still a submit button inside a real form.** The topbar's form posts a
 * server action, which is what keeps sign-out a `POST` -- a `GET` that ends a
 * session is reachable by a link prefetch. This intercepts the click, asks, and
 * submits the form itself only if the answer is yes; with JavaScript
 * unavailable the click is never intercepted and the form posts as it always
 * did. Confirmation is the thing that needs JavaScript, not signing out.
 *
 * The form is read from the event before the `await`, because `currentTarget`
 * is only meaningful while the event is being dispatched and is null by the
 * time the dialog resolves.
 */
export function AdminSignOutButton() {
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
          message: "You'll need to sign in again to reach the admin.",
          label: "Sign out",
        });
        if (accepted) form.requestSubmit();
      }}
      className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      Sign out
    </button>
  );
}
