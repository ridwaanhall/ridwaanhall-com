"use client";

import { useRef, useState, useTransition } from "react";

import { resetTurnstile, TurnstileWidget } from "@/components/site/turnstile-widget";
import { SplitHeading } from "@/components/motion/reveal";
import { BUTTON_PRIMARY, ButtonContent } from "@/components/site/ui";
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
      <SplitHeading as="h2" className="type-section text-zinc-100">
        Send me a message
      </SplitHeading>
      <p className="mt-3 text-[0.9375rem] text-pretty text-zinc-500">
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
            <textarea className={`${FIELD} ${AREA}`} rows={6} placeholder="Message*" name="message" required />
          </label>
          <TurnstileWidget />
          <button className={`${BUTTON_PRIMARY} self-start`} type="submit" id="submit-btn" disabled={pending}>
            <ButtonContent label={pending ? "Sending…" : "Begin the conversation"} arrow="right" />
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

const LABEL = "type-meta mb-2 block text-zinc-400";

/*
 * A field is a control, so it keeps the edge every control on the site has --
 * drawn at the step that clears three to one against the canvas -- and the
 * pill shape the buttons have. The message box takes a large radius instead:
 * a pill around six lines of text would bite into the first and last of them.
 */
const FIELD =
  "h-11 w-full rounded-full border border-zinc-500 bg-transparent px-5 text-zinc-100 placeholder-zinc-500 transition-colors duration-300 hover:border-zinc-300 focus:border-zinc-100 focus:outline-none";

const AREA = "h-auto resize-y rounded-3xl py-3.5 leading-relaxed";
