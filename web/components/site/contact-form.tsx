"use client";

import { useRef, useState, useTransition } from "react";

import { resetTurnstile, TurnstileWidget } from "@/components/site/turnstile-widget";
import { submitContact } from "@/lib/actions/contact";
import { notify } from "@/lib/notify";

/**
 * The contact form.
 *
 * The fields are uncontrolled. They carry no state worth tracking on every
 * keystroke, and `required` plus `type="email"` gives the browser's own
 * validation for free -- which also works before hydration.
 *
 * The outcome is a toast rather than a line under the button, which is what
 * replaced `showMessage()` here and the two Django-message blocks elsewhere:
 * one notification surface for the whole site. The wording comes back from the
 * action, so this and the comment views phrase the same event identically.
 *
 * Turnstile renders only when both keys are configured. Django gated the whole
 * verification on `USE_CF_TURNSTILE` for the same reason -- a local run without
 * Cloudflare credentials still has a working form -- and the server mirrors
 * this check, so a widget that fails to load cannot be the thing that lets
 * spam through.
 */
export function ContactForm() {
  const [status, setStatus] = useState<null | string>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-medium flex items-center">
        <svg
          className="w-6 h-6 mr-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        Send me a message
      </h2>
      <p className="text-zinc-400 text-sm mt-2 mb-4">
        Have a thought, a question, or just want to say hello? Leave a note&mdash;I read them all.
      </p>

      <form
        ref={formRef}
        id="contact-form"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus(null);
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await submitContact(data);
            notify(result.message, result.ok ? "success" : "error");
            // Kept alongside the toast: a toast is transient and this is the
            // one form on the site where losing the outcome means retyping a
            // long message to find out whether it went.
            setStatus(result.message);
            if (result.ok) {
              formRef.current?.reset();
              // Turnstile tokens are single-use, so a second send needs a
              // fresh one; without this the next submit fails verification.
              resetTurnstile();
            }
          });
        }}
      >
        <div className="flex flex-grow flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <input className={FIELD} type="text" placeholder="Name*" name="name" required />
            <input className={FIELD} type="email" placeholder="Email*" name="email" required />
          </div>
          <textarea
            className={`${FIELD} resize-vertical`}
            rows={5}
            placeholder="Message*"
            name="message"
            required
          />
          <TurnstileWidget />
          <button
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-400 bg-zinc-800 px-2 py-2 text-base font-medium text-zinc-300 hover:text-zinc-200 hover:bg-zinc-900 transition-all duration-300 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
            type="submit"
            id="submit-btn"
            disabled={pending}
          >
            {pending ? "Sending…" : "Begin the conversation"}
          </button>
          {status && (
            <p className="text-sm text-zinc-400" role="status">
              {status}
            </p>
          )}
        </div>

        <div className="my-5 flex items-center gap-2 text-zinc-400 mt-4">
          <svg
            stroke="currentColor"
            fill="none"
            strokeWidth={2}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            height="1em"
            width="1em"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <div className="text-sm">
            <span className="font-medium">Typical response time:</span> 1&ndash;2 hours (Weekdays,
            GMT+7). I reply with care.
          </div>
        </div>
      </form>
    </div>
  );
}

const FIELD =
  "w-full rounded-md border border-zinc-700 hover:border-zinc-400 px-3 py-2 focus:outline-none focus:border-zinc-400 bg-transparent placeholder-zinc-400 text-zinc-300 hover:text-zinc-200 transition-all duration-300";
