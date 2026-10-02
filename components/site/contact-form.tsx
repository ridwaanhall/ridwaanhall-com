"use client";

import { useRef, useState, useTransition } from "react";

import { resetTurnstile, TurnstileWidget } from "@/components/site/turnstile-widget";
import { BUTTON_PRIMARY } from "@/components/site/ui";
import { submitContact } from "@/lib/actions/contact";
import { notify } from "@/lib/notify";

/**
 * The contact form.
 *
 * The fields are uncontrolled. They carry no state worth tracking on every
 * keystroke, and `required` plus `type="email"` gives the browser's own
 * validation for free -- which also works before hydration.
 *
 * The outcome is a toast rather than a line under the button: one notification
 * surface for the whole site. The wording comes back from the action, so this
 * and the comment views phrase the same event identically.
 *
 * Turnstile renders only when both keys are configured, so a checkout without
 * Cloudflare credentials still has a working form. The server mirrors this
 * check, so a widget that fails to load cannot be the thing that lets spam
 * through.
 */
export function ContactForm() {
  const [status, setStatus] = useState<null | string>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      <h2 className="text-xl font-medium tracking-tight text-zinc-100">Send me a message</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Have a thought, a question, or just want to say hello? Leave a note&mdash;I read them all.
      </p>

      <form
        ref={formRef}
        id="contact-form"
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus(null);
          const data = new FormData(event.currentTarget);
          startTransition(async () => {
            const result = await submitContact(data);
            notify(result.message, result.ok ? "success" : "error");
            setStatus(result.message);
            if (result.ok) {
              formRef.current?.reset();
              resetTurnstile();
            }
          });
        }}
      >
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-5 sm:flex-row">
            <label className="flex-1">
              <span className={LABEL}>Name</span>
              <input className={FIELD} type="text" placeholder="Name*" name="name" required />
            </label>
            <label className="flex-1">
              <span className={LABEL}>Email</span>
              <input className={FIELD} type="email" placeholder="Email*" name="email" required />
            </label>
          </div>
          <label>
            <span className={LABEL}>Message</span>
            <textarea className={`${FIELD} resize-y`} rows={6} placeholder="Message*" name="message" required />
          </label>
          <TurnstileWidget />
          <button className={`${BUTTON_PRIMARY} cursor-pointer self-start`} type="submit" id="submit-btn" disabled={pending}>
            {pending ? "Sending…" : "Begin the conversation"}
          </button>
          {status && (
            <p className="text-sm text-zinc-400" role="status">
              {status}
            </p>
          )}
        </div>

        <p className="mt-8 text-sm text-zinc-500">
          <span className="text-zinc-300">Typical response time:</span> 1&ndash;2 hours (Weekdays,
          GMT+7). I reply with care.
        </p>
      </form>
    </div>
  );
}

const LABEL = "mb-2 block text-sm text-zinc-400";

const FIELD =
  "w-full rounded-lg border border-zinc-800 bg-transparent px-3.5 py-2.5 text-zinc-100 placeholder-zinc-600 transition-colors hover:border-zinc-700 focus:border-zinc-500 focus:outline-none";
