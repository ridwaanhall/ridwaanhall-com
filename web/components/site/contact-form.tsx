"use client";

import { useState } from "react";

/**
 * The contact form.
 *
 * Submission is phase 2 -- the POST endpoint, Turnstile verification and the
 * two emails are not built yet -- so the button reports that rather than
 * silently doing nothing. Rendering the form now keeps the page complete and
 * lets its layout be verified against the live site; wiring it up is a change
 * to this one component.
 *
 * The fields are uncontrolled. They carry no state worth tracking on every
 * keystroke, and `required` plus `type="email"` gives the browser's own
 * validation for free -- which also works before hydration.
 */
export function ContactForm() {
  const [status, setStatus] = useState<null | string>(null);

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
        id="contact-form"
        method="post"
        onSubmit={(event) => {
          event.preventDefault();
          setStatus("Sending messages is not wired up yet — please use one of the links above.");
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
          <button
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-400 bg-zinc-800 px-2 py-2 text-base font-medium text-zinc-300 hover:text-zinc-200 hover:bg-zinc-900 transition-all duration-300 justify-center"
            type="submit"
            id="submit-btn"
          >
            Begin the conversation
          </button>
          {status && (
            <p className="text-sm text-amber-400" role="status">
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
