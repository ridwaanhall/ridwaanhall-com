"use client";

import { useRef, useTransition } from "react";

import { EYEBROW, FIELD, SOLID_BUTTON } from "@/components/foothill/classes";
import { resetTurnstile, TurnstileWidget } from "@/components/site/turnstile-widget";
import { submitContact } from "@/lib/actions/contact";
import { notify } from "@/lib/notify";

/**
 * The message form. Uncontrolled fields, so a browser's autofill and restore
 * work as they do anywhere; the action validates everything again and checks
 * Turnstile, failing closed.
 */
export function ContactForm() {
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      id="contact-form"
      ref={form}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await submitContact(data);
          notify(result.message, result.ok ? "success" : "error");
          if (result.ok) {
            form.current?.reset();
            resetTurnstile();
          }
        });
      }}
      className="space-y-8"
    >
      <div className="grid gap-8 md:grid-cols-2">
        <label className="block">
          <span className={EYEBROW}>Your name</span>
          <input name="name" required maxLength={100} autoComplete="name" className={FIELD} />
        </label>
        <label className="block">
          <span className={EYEBROW}>Email to reply to</span>
          <input name="email" type="email" required maxLength={254} autoComplete="email" className={FIELD} />
        </label>
      </div>
      <label className="block">
        <span className={EYEBROW}>Message</span>
        <textarea name="message" required maxLength={5000} rows={5} className={`${FIELD} resize-y leading-relaxed`} />
      </label>
      <TurnstileWidget />
      <button id="submit-btn" type="submit" disabled={pending} className={SOLID_BUTTON}>
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
