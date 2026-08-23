"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import { useConfirm } from "@/components/providers/confirm-dialog";
import { Composer, ComposerHint } from "@/components/site/guestbook/composer";
import { Message, type MessageActions, type Viewer } from "@/components/site/guestbook/message";
import {
  PANEL_FOOTER,
  PANEL_FRAME,
  PANEL_HEADER,
} from "@/components/site/guestbook/panel-skeleton";
import { PinnedCard } from "@/components/site/guestbook/pinned-card";
import { PinIcon } from "@/components/site/guestbook/role-badge";
import { SignInCard } from "@/components/site/guestbook/sign-in-card";
import { signOutHere } from "@/lib/actions/auth";
import { deleteMessage, sendMessage, togglePin } from "@/lib/actions/guestbook";
import { MAX_PINNED, type Thread, type ThreadMessage } from "@/lib/data/guestbook-tree";
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
 *
 * **The frame is the point of the layout.** A conversation needs somewhere to
 * end, and this used to have no edges: a caption, then a list with a hard
 * `55vh` cap on it, then a rule with the composer under it, all sitting loose
 * on the page. The scroll region was the only bounded thing on screen and it
 * gave no sign it was scrollable, so a reader arriving mid-thread had no way of
 * knowing there was anything above. It is one card now -- header, feed, footer
 * -- with the height on the card rather than on the list inside it, and a
 * visible scrollbar.
 *
 * The reply tree itself is untouched. `Message` draws the rails, the elbows and
 * the nesting exactly as it did.
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
  /* Pinned messages open by default, but foldable: three of them used to push
     the conversation most of the way off a phone screen. */
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const signedIn = viewer.userId !== null;

  /*
   * Open at the newest message, not the oldest.
   *
   * `buildThread` sorts ascending, so the list reads oldest at the top and the
   * most recent message is the last thing in it -- which is the right order for
   * a conversation and the wrong place for a scrollbar to start. The feed is
   * capped over a 50-message window, so landing at the top opened on messages
   * from years ago and the newest were several screens down.
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

  const unpin = (id: string) => {
    mark(id, true);
    startTransition(async () => {
      report(await togglePin(id));
      mark(id, false);
    });
  };

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
      unpin(message.id);
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

  function submit() {
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
    <div className={PANEL_FRAME}>
      <div className={`${PANEL_HEADER} flex items-center justify-between gap-3`}>
        <p className="text-sm text-zinc-400">
          {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
        </p>

        {thread.pinned.length > 0 && (
          <button
            type="button"
            onClick={() => setPinnedOpen((open) => !open)}
            aria-expanded={pinnedOpen}
            aria-controls="guestbook-pinned"
            className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-amber-400 transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            <PinIcon className="h-3.5 w-3.5" filled />
            <span>
              Pinned {thread.pinned.length}/{MAX_PINNED}
            </span>
            <svg
              className={`h-3 w-3 transition-transform duration-200 ${pinnedOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
            </svg>
          </button>
        )}
      </div>

      {thread.pinned.length > 0 && pinnedOpen && (
        <div
          id="guestbook-pinned"
          className="flex-shrink-0 space-y-1.5 border-b border-zinc-800 bg-zinc-900/40 px-3 py-2.5"
        >
          {thread.pinned.map((pinned) => (
            <PinnedCard
              key={pinned.id}
              pinned={pinned}
              canPin={viewer.canPin}
              busy={busy.has(pinned.id)}
              onUnpin={unpin}
            />
          ))}
        </div>
      )}

      {/*
        The feed. `overscroll-contain` keeps a flick at the top or bottom of the
        thread from scrolling the page behind it, which on a phone is the
        difference between reading a conversation and losing your place in one.
      */}
      <div
        id="guestbook-messages"
        ref={listRef}
        className="custom-scroll flex-1 space-y-5 overflow-y-auto overscroll-contain px-3 py-4"
      >
        {thread.roots.length > 0 ? (
          thread.roots.map((message) => (
            <Message key={message.id} message={message} viewer={viewer} actions={actions} />
          ))
        ) : (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center text-zinc-400">
            <ChatIcon className="mb-4 h-12 w-12 text-zinc-600" />
            {/* A `<p>`, not a heading. This is the first thing in the region and
                the page's own `<h1>` is four levels above it. */}
            <p className="mb-1 text-base font-medium text-zinc-300">
              Nothing here yet
            </p>
            <p className="text-sm">Be the first to leave a message.</p>
          </div>
        )}
      </div>

      <div className={PANEL_FOOTER}>
        {signedIn ? (
          <>
            <Composer
              text={text}
              onText={setText}
              onSubmit={submit}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              pending={pending}
              inputRef={inputRef}
            />

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-zinc-500">
              <span className="min-w-0 truncate">
                Signed in as {signedInAs?.name}
                {signedInAs?.email ? ` (${signedInAs.email})` : ""} ·{" "}
                {/* Confirms first, through the shared dialog, rather than
                    signing out on a stray click. */}
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
                  className="cursor-pointer underline transition-colors hover:text-zinc-300"
                >
                  Sign out
                </button>
              </span>
              <ComposerHint text={text} />
            </div>
          </>
        ) : (
          <SignInCard />
        )}
      </div>
    </div>
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
