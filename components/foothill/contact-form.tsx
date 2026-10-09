"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";

import { ActionButton, EASE } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import { resetTurnstile, TurnstileWidget } from "@/components/site/turnstile-widget";
import { submitContact } from "@/lib/actions/contact";
import { notify } from "@/lib/notify";

type Field = "name" | "email" | "message";
const FIELDS: Field[] = ["name", "email", "message"];

/** What is wrong with a field, in a sentence; "" when nothing is. */
function check(field: Field, raw: string): string {
  const value = raw.trim();
  if (field === "name") return value ? "" : "Add your name, so the reply can use it.";
  if (field === "email")
    return !value ? "Add an email address to reply to." : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? "" : "That address looks incomplete, for example you@example.com.";
  return value.length >= 10 ? "" : value ? "A little more, please: at least 10 characters." : "Write a message.";
}

/**
 * The message form.
 *
 * Each field says what is wrong with it under itself once the reader has left
 * it; Send checks all three and moves focus to the first problem. The line
 * under a field is always there, empty until needed, so an error appearing
 * never pushes Send out from under a click. The fields stay uncontrolled, so a
 * browser's autofill and restore work as they do anywhere, and the action
 * validates everything again and checks Turnstile, failing closed.
 */
export function ContactForm() {
  const form = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<{ name: string; email: string } | null>(null);

  // Leaving the page clears what the last visit complained about. A visited
  // route stays mounted, hidden, so coming back to Contact would otherwise
  // greet the reader with the errors from an attempt they had abandoned.
  // What they typed is kept; only the verdicts on it go. Effects are torn
  // down when the route is hidden, which is the moment to forget.
  useEffect(
    () => () => {
      setErrors({});
      setNote("");
    },
    [],
  );

  const onBlur = (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.target.name as Field;
    setErrors((current) => ({ ...current, [field]: check(field, event.target.value) }));
  };
  const onInput = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = event.currentTarget.name as Field;
    if (errors[field]) setErrors((current) => ({ ...current, [field]: check(field, event.currentTarget.value) }));
  };
  const props = (field: Field) => ({
    name: field,
    onBlur,
    onInput,
    "aria-invalid": errors[field] ? ("true" as const) : ("false" as const),
    "aria-describedby": errors[field] ? `error-${field}` : undefined,
  });

  const errorLine = (field: Field) => (
    <span className="ferr-slot">
      <AnimatePresence initial={false}>
        {errors[field] && (
          <motion.span
            key={errors[field]}
            id={`error-${field}`}
            className="ferr"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <Icon name="x" size={12} />
            {errors[field]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const el = event.currentTarget;
    const data = new FormData(el);
    const next = Object.fromEntries(FIELDS.map((field) => [field, check(field, String(data.get(field) ?? ""))])) as Record<Field, string>;
    setErrors(next);
    const bad = FIELDS.find((field) => next[field]);
    if (bad) {
      setNote("Check the highlighted field.");
      el.querySelector<HTMLElement>(`[name="${bad}"]`)?.focus();
      return;
    }
    setNote("");
    startTransition(async () => {
      const result = await submitContact(data);
      if (result.ok) {
        setSent({ name: String(data.get("name")).trim().split(/\s+/)[0], email: String(data.get("email")).trim() });
        notify("Message sent", "success");
        resetTurnstile();
      } else {
        setNote(result.message);
        notify(result.message, "error");
      }
    });
  };

  return (
    // `initial={false}`: the form the server painted is not hidden and shown again.
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <motion.div
          key="sent"
          className="sent"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          role="status"
        >
          <span className="empty-ic">
            <Icon name="check" className="draw" />
          </span>
          <h2 className="t2">Sent. Thank you, {sent.name}.</h2>
          <p className="lead" style={{ maxWidth: "46ch" }}>
            A copy is on its way to {sent.email}. Replies usually come within 1 to 2 hours on weekdays, GMT+7.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <ActionButton ghost icon="pen" onClick={() => setSent(null)}>
              Write another
            </ActionButton>
            <Link className="btn ghost" href="/projects">
              <Icon name="grid" />
              See the work meanwhile
            </Link>
          </div>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          id="contact-form"
          ref={form}
          noValidate
          onSubmit={submit}
          className="contact-form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="contact-pair">
            <label className="f" htmlFor="contact-name">
              Your name
              <input className="input" id="contact-name" {...props("name")} maxLength={100} autoComplete="name" placeholder="Jane Doe" />
              {errorLine("name")}
            </label>
            <label className="f" htmlFor="contact-email">
              Email to reply to
              <input className="input" id="contact-email" type="email" {...props("email")} maxLength={254} autoComplete="email" placeholder="you@example.com" />
              {errorLine("email")}
            </label>
          </div>
          <label className="f" htmlFor="contact-message">
            Message
            <textarea className="input" id="contact-message" {...props("message")} maxLength={5000} placeholder="What are you working on, and how can I help?" />
            {errorLine("message")}
          </label>
          <div className="turnstile-slot">
            <TurnstileWidget />
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <ActionButton id="submit-btn" type="submit" icon="send" disabled={pending}>
              {pending ? "Sending…" : "Send message"}
            </ActionButton>
            <AnimatePresence>
              {note && (
                <motion.span key={note} className="meta" role="status" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
                  {note}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
