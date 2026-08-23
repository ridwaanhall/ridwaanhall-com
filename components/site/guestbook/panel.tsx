"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import { useConfirm } from "@/components/providers/confirm-dialog";
import { signInWith, signOutHere } from "@/lib/actions/auth";
import { Message, type MessageActions, type Viewer } from "@/components/site/guestbook/message";
import { PinnedCard } from "@/components/site/guestbook/pinned-card";
import { PinIcon, ReplyIcon } from "@/components/site/guestbook/role-badge";
import { deleteMessage, sendMessage, togglePin } from "@/lib/actions/guestbook";
import { MAX_MESSAGE_LENGTH, MAX_PINNED, type Thread, type ThreadMessage } from "@/lib/data/guestbook-tree";
import { notify } from "@/lib/notify";

/**
 * The guestbook's messages panel.
 *
 * One client component around a server-rendered thread. Every mutation is a
 * server action that revalidates `/guestbook`, so the tree is rebuilt by
 * `getThread()` and `buildThread()` -- the same path the page load takes.
 * Appending one node client-side would mean deciding where it goes, which
 * depends on the depth cap and on whether its parent fell inside the fetched
 * window: a second implementation of the threading, free to disagree with the
 * first.
 *
 * Confirmation goes through the site-wide dialog, and every notice is worded by
 * the action rather than here -- the guestbook and the comments are one feature
 * to a reader and must not phrase the same event differently.
 */
export function GuestbookPanel({
  thread,
  viewer,
  signedInAs,
}: {
  thread: Thread;
  viewer: Viewer;
  /** Name and masked email for the "Signed in as" line. */
  signedInAs: { name: string; email: string } | null;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const signedIn = viewer.userId !== null;

  /*
   * Open at the newest message, not the oldest.
   *
   * `buildThread` sorts ascending, so the list reads oldest at the top and the
   * most recent message is the last thing in it -- which is the right order for
   * a conversation and the wrong place for a scrollbar to start. The panel is
   * capped at 55vh over a 50-message window, so landing at the top opened on
   * messages from years ago and the newest were several screens down.
   *
   * `useLayoutEffect` rather than `useEffect`: this runs before the browser
   * paints, so the panel is simply already at the bottom. An effect after paint
   * shows the top for a frame and then jumps, which reads as a glitch.
   * `scrollTo` without `behavior` is instant for the same reason -- there is
   * nothing to animate away from when the position was never seen.
   */
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, []);

  /*
   * And follow the thread down as it grows.
   *
   * Sending revalidates the page, so a new message arrives as a re-render with
   * one more row rather than through this component's own state. Keyed on the
   * count, this puts the panel back at the bottom when that happens -- and does
   * nothing while someone is reading further up, because the count has not
   * changed.
   */
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [thread.messageCount]);

  const mark = (id: string, on: boolean) =>
    setBusy((current) => {
      const next = new Set(current);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const report = (result: { ok: true; notice: string } | { ok: false; error: string }) =>
    result.ok ? notify(result.notice, "success") : notify(result.error, "error");

  const actions: MessageActions = {
    busy,
    onReply(message) {
      if (!signedIn) {
        // An element rather than a string, because the message carries a link
        // -- the one case `notify` takes a node for.
        notify(
          <>
            Please sign in below to reply to{" "}
            <span className="font-medium">{message.fullName}</span>.
          </>,
          "info",
        );
        return;
      }
      setReplyTo(message);
      inputRef.current?.focus();
    },
    onPin(message) {
      mark(message.id, true);
      startTransition(async () => {
        report(await togglePin(message.id));
        mark(message.id, false);
      });
    },
    async onDelete(message) {
      const accepted = await confirm({
        title: "Delete this message?",
        message: "This can't be undone. Any replies go with it.",
        label: "Delete",
        variant: "danger",
        detail: message.message,
      });
      if (!accepted) return;
      mark(message.id, true);
      startTransition(async () => {
        report(await deleteMessage(message.id));
        mark(message.id, false);
        if (replyTo?.id === message.id) setReplyTo(null);
      });
    },
  };

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;

    const data = new FormData();
    data.set("message", value);
    if (replyTo) data.set("reply_to", String(replyTo.id));

    startTransition(async () => {
      const result = await sendMessage(data);
      report(result);
      if (result.ok) {
        setText("");
        setReplyTo(null);
      }
    });
  }

  return (
    <div className="flex flex-col">
      {/*
        The count, as a caption under the page's own description rather than a
        filled badge in a grey header bar. The bar said "Guestbook Messages"
        directly beneath a heading that said "Guestbook", and the panel's outer
        border drew a box around a thing that is already the whole page.
      */}
      <p className="mb-3 flex-shrink-0 text-sm text-zinc-400">
        {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
      </p>

      {thread.pinned.length > 0 && (
        /* No fill and no rule under it: the pinned cards carry their own
           background, so the strip around them was a second surface holding
           surfaces. `px-3` keeps them on the same left edge as the messages
           below; the caption above already supplies the gap. */
        <div className="px-3 pb-3 space-y-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400 mb-1">
            <PinIcon className="w-3.5 h-3.5" filled />
            <span>
              Pinned Messages ({thread.pinned.length}/{MAX_PINNED})
            </span>
          </div>
          <div className="space-y-1.5">
            {thread.pinned.map((pinned) => (
              <PinnedCard
                key={pinned.id}
                pinned={pinned}
                canPin={viewer.canPin}
                busy={busy.has(pinned.id)}
                onUnpin={(id) => {
                  mark(id, true);
                  startTransition(async () => {
                    report(await togglePin(id));
                    mark(id, false);
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        id="guestbook-messages"
        ref={listRef}
        className="overflow-y-auto py-4 space-y-4 flex-1 scrollbar-hide"
        style={{ minHeight: "min(45vh, 600px)", maxHeight: "min(55vh, 800px)" }}
      >
        {thread.roots.length > 0 ? (
          thread.roots.map((message) => (
            <div className="px-3" key={message.id}>
              <Message message={message} viewer={viewer} actions={actions} />
            </div>
          ))
        ) : (
          <div className="text-center text-zinc-400 py-16">
            <ChatIcon className="w-16 h-16 mx-auto mb-4 text-zinc-400" />
            <h5 className="text-lg font-medium mb-2">Welcome to my Guestbook!</h5>
            <p className="mb-4">No messages yet. Be the first to leave a message!</p>
          </div>
        )}
      </div>

      <div className="border-t border-zinc-700 p-3 flex-shrink-0">
        {signedIn ? (
          <>
            {replyTo && (
              <div className="mb-3">
                <div className="border border-zinc-500 rounded-lg p-3 flex justify-between items-center">
                  <div className="flex items-center text-zinc-400 text-sm min-w-0">
                    <ReplyIcon className="w-4 h-4 mr-2 text-zinc-400 flex-shrink-0" />
                    <span className="text-zinc-500">Replying to</span>
                    <strong className="text-zinc-300 mx-1">{replyTo.fullName}</strong>
                    <span className="text-zinc-500">:</span>
                    <span className="ml-1 truncate max-w-32 sm:max-w-48">{replyTo.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="p-1 rounded border border-transparent hover:border-zinc-600/50 transition-colors"
                    aria-label="Cancel reply"
                  >
                    <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={submit} className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="flex-1 px-4 py-3 border border-zinc-600 rounded-lg placeholder-zinc-400 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 bg-transparent"
                placeholder="Type your message..."
                maxLength={MAX_MESSAGE_LENGTH}
                required
                aria-label="Message"
              />
              <button
                type="submit"
                disabled={pending}
                className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:opacity-50"
                aria-label="Send message"
              >
                <svg stroke="currentColor" fill="none" strokeWidth={2} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height={22} width={22} aria-hidden="true">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>

            <div className="mt-3 text-sm text-zinc-400">
              <span>
                Signed in as {signedInAs?.name}
                {signedInAs?.email ? ` (${signedInAs.email})` : ""} •{" "}
              </span>
              {/* Confirms first, through the shared dialog, rather than signing
                  out on a stray click. */}
              <button
                type="button"
                onClick={async () => {
                  const accepted = await confirm({
                    title: "Sign out?",
                    message: "You'll need to sign in again to post or pin messages.",
                    label: "Sign out",
                  });
                  if (accepted) await signOutHere("/guestbook");
                }}
                className="text-zinc-400 hover:text-zinc-300 cursor-pointer underline transition-colors"
              >
                Sign Out
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <span className="text-zinc-400 mb-4 flex items-center justify-center">
              <span>
                Sign in to begin. Rest assured, your information is secure. See my{" "}
                <a href="/privacy-policy" className="text-indigo-400 hover:text-indigo-300 underline">
                  privacy
                </a>{" "}
                for more.
              </span>
            </span>
            <div className="flex flex-row gap-2 justify-center">
              <ProviderButton provider="google" label="Sign in with Google">
                <GoogleMark />
              </ProviderButton>
              <ProviderButton provider="github" label="Sign in with GitHub">
                <GitHubMark />
              </ProviderButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderButton({
  provider,
  label,
  children,
}: {
  provider: "google" | "github";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => signInWith(provider, "/guestbook")}
      className="inline-flex items-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors duration-200 text-sm gap-1 justify-center cursor-pointer"
    >
      {children}
      {label}
    </button>
  );
}

function ChatIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" height={18} width={18} aria-hidden="true">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg height={18} width={18} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
