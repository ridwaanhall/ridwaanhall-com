"use client";

import { useEffect } from "react";

import { ReplyIcon } from "@/components/site/guestbook/role-badge";
import { MAX_MESSAGE_LENGTH, type ThreadMessage } from "@/lib/data/guestbook-tree";

/**
 * The guestbook's composer: what a signed-in reader writes into.
 *
 * **A `<textarea>`, not an `<input>`.** Messages are stored as typed and
 * `MessageText` renders their line breaks, so a single-line field could not
 * write what the page could already display -- and pasting anything with a
 * newline in it silently lost the shape of it. Enter sends, because this is a
 * conversation and that is what a conversation expects; Shift+Enter is the
 * newline.
 *
 * The height follows the content up to `MAX_HEIGHT_PX` and then scrolls. A
 * textarea cannot size itself in CSS, so this is measured: reset to nothing,
 * read `scrollHeight`, set it. Without the reset the box only ever grows --
 * `scrollHeight` never reports less than the height already set, so deleting a
 * line would leave the space it occupied behind.
 */

/** Roughly five lines, past which the box scrolls instead of growing. */
const MAX_HEIGHT_PX = 132;

/** The counter turns amber with this much room left, not when it runs out. */
const NEARLY_FULL = 60;

export function Composer({
  text,
  onText,
  onSubmit,
  replyTo,
  onCancelReply,
  pending,
  inputRef,
}: {
  text: string;
  onText: (value: string) => void;
  onSubmit: () => void;
  replyTo: ThreadMessage | null;
  onCancelReply: () => void;
  pending: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text, replyTo, inputRef]);

  const empty = text.trim().length === 0;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-2"
    >
      {replyTo && (
        /* Inside the composer rather than above it, so it reads as part of what
           is being written rather than as a notice about it. */
        <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-sm">
          <ReplyIcon className="h-4 w-4 flex-shrink-0 text-zinc-500" />
          <span className="min-w-0 flex-1 truncate text-zinc-500">
            Replying to <span className="font-medium text-zinc-300">{replyTo.fullName}</span>
            <span className="text-zinc-600"> — {replyTo.message}</span>
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            className="flex-shrink-0 rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            aria-label="Cancel reply"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(event) => onText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            /*
              Never while an input method is mid-word. Typing in an IME uses
              Enter to accept the candidate that is being composed, and
              intercepting it there sends a half-finished message and deletes
              the rest.
            */
            if (event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (!empty && !pending) onSubmit();
          }}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Write something…"
          aria-label="Message"
          className="min-h-11 flex-1 resize-none rounded-lg border border-zinc-700 bg-transparent px-3 py-2.5 leading-6 text-zinc-200 placeholder-zinc-500 transition-colors custom-scroll focus:border-zinc-500 focus:outline-none"
        />

        {/* Square, and the same height as an empty field, so the two sit on one
            line rather than the button overhanging. */}
        <button
          type="submit"
          disabled={pending || empty}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:opacity-40"
          aria-label="Send message"
        >
          <svg
            className="h-5 w-5"
            stroke="currentColor"
            fill="none"
            strokeWidth={2}
            viewBox="0 0 24 24"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </form>
  );
}

/**
 * The character count, and the hint for how to send.
 *
 * Split out so the panel can put it on the same line as the signed-in caption
 * instead of stacking a third row under the field. It appears only once there
 * is something to count -- an empty composer showing "0/500" is a warning about
 * nothing.
 */
export function ComposerHint({ text }: { text: string }) {
  const left = MAX_MESSAGE_LENGTH - text.length;
  if (text.length === 0) return null;

  return (
    <span className={left <= NEARLY_FULL ? "text-amber-400" : "text-zinc-500"}>
      {text.length}/{MAX_MESSAGE_LENGTH}
    </span>
  );
}
