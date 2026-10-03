"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";

import { Avatar, SignInPrompt } from "@/components/foothill/comments";
import { SOLID_BUTTON, TEXT_BUTTON } from "@/components/foothill/classes";
import { useConfirm } from "@/components/providers/confirm-dialog";
import { signOutHere } from "@/lib/actions/auth";
import { deleteMessage, sendMessage, togglePin } from "@/lib/actions/guestbook";
import { ROLE_LABEL } from "@/lib/auth/roles";
import {
  MAX_MESSAGE_LENGTH,
  MAX_PINNED,
  MIN_MESSAGE_LENGTH,
  type Thread,
  type ThreadMessage,
} from "@/lib/data/guestbook-tree";
import { notify } from "@/lib/notify";
import { shortDate } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

export type Viewer = { userId: string | null; canPost: boolean; canPin: boolean; canDelete: boolean };

type Result = { ok: true; notice: string } | { ok: false; error: string };

/**
 * The guestbook: pinned notes, the conversation, and the line to write on.
 *
 * Oldest first, opened scrolled to the newest, like any conversation. Every
 * action is a server action that re-checks the account -- a hidden button is
 * a courtesy, not the rule. The ids and data attributes on the regions and
 * messages are what the harnesses find them by.
 */
export function Guestbook({
  thread,
  viewer,
  signedInAs,
}: {
  thread: Thread;
  viewer: Viewer;
  signedInAs: { name: string; email: string } | null;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ThreadMessage | null>(null);
  const [text, setText] = useState("");
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const input = useRef<HTMLTextAreaElement>(null);
  const feed = useRef<HTMLDivElement>(null);
  const signedIn = viewer.userId !== null;
  const canPost = signedIn && viewer.canPost;

  useLayoutEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, []);

  useEffect(() => {
    feed.current?.scrollTo({ top: feed.current.scrollHeight, behavior: "smooth" });
  }, [thread.messageCount]);

  const report = (result: Result) => notify(result.ok ? result.notice : result.error, result.ok ? "success" : "error");

  const run = (id: string, action: () => Promise<Result>) => {
    setBusy(id);
    startTransition(async () => {
      report(await action());
      setBusy(null);
    });
  };

  const remove = async (message: ThreadMessage) => {
    const accepted = await confirm({
      title: "Delete this message?",
      message: "This can't be undone. Any replies go with it.",
      label: "Delete",
      variant: "danger",
      detail: message.message,
    });
    if (!accepted) return;
    if (replyTo?.id === message.id) setReplyTo(null);
    run(message.id, () => deleteMessage(message.id));
  };

  const reply = (message: ThreadMessage) => {
    setReplyTo(message);
    input.current?.focus();
  };

  const submit = () => {
    const value = text.trim();
    if (value.length < MIN_MESSAGE_LENGTH) return;
    const data = new FormData();
    data.set("message", value);
    if (replyTo) data.set("reply_to", replyTo.id);
    startTransition(async () => {
      const result = await sendMessage(data);
      report(result);
      if (result.ok) {
        setText("");
        setReplyTo(null);
      }
    });
  };

  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
        <p className="fh-mono text-[12px] text-mute tabular-nums">
          {thread.messageCount} message{thread.messageCount === 1 ? "" : "s"}
        </p>
        {thread.pinned.length > 0 && (
          <button
            type="button"
            onClick={() => setPinnedOpen((open) => !open)}
            aria-expanded={pinnedOpen}
            aria-controls="guestbook-pinned"
            className={TEXT_BUTTON}
          >
            Pinned {thread.pinned.length}/{MAX_PINNED}
            <span aria-hidden="true" className={cn("transition-transform", pinnedOpen && "rotate-180")}>
              ↓
            </span>
          </button>
        )}
      </div>

      {thread.pinned.length > 0 && (
        <div id="guestbook-pinned" hidden={!pinnedOpen} className="border-b border-line bg-raise/60 px-5 py-4">
          <ul className="space-y-3">
            {thread.pinned.map((pinned) => (
              <li key={pinned.id} className="flex items-start gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sulfur-mark" />
                <p className="min-w-0 flex-1 text-[15px] leading-relaxed text-ink">
                  <span className="font-medium">{pinned.fullName}</span>
                  <span className="text-mute"> — </span>
                  {pinned.message}
                </p>
                {viewer.canPin && (
                  <button
                    type="button"
                    onClick={() => run(pinned.id, () => togglePin(pinned.id))}
                    disabled={busy === pinned.id}
                    className={TEXT_BUTTON}
                  >
                    Unpin
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div
        id="guestbook-messages"
        ref={feed}
        className="max-h-[min(68vh,720px)] overflow-y-auto overscroll-contain px-5 py-2"
      >
        {thread.roots.length > 0 ? (
          thread.roots.map((message) => (
            <Entry
              key={message.id}
              message={message}
              viewer={viewer}
              busy={busy}
              onReply={canPost ? reply : null}
              onPin={(m) => run(m.id, () => togglePin(m.id))}
              onDelete={remove}
            />
          ))
        ) : (
          <p className="fh-serif py-16 text-center text-[20px] text-mute italic">
            Nothing here yet. The first line is yours.
          </p>
        )}
      </div>

      <div className="border-t border-line px-5 py-4">
        {!signedIn ? (
          <SignInPrompt redirectTo="/guestbook" />
        ) : !canPost ? (
          <p className="text-[15px] text-mute">Posting to the guestbook is turned off for this account.</p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {replyTo && (
              <p className="mb-2 flex items-center gap-3 text-[14px] text-mute">
                <span className="truncate">
                  Replying to <span className="text-ink">{replyTo.fullName}</span>
                </span>
                <button type="button" onClick={() => setReplyTo(null)} className={TEXT_BUTTON}>
                  Cancel
                </button>
              </p>
            )}
            <div className="flex items-end gap-3">
              <label htmlFor="guestbook-input" className="sr-only">
                Your message
              </label>
              <textarea
                id="guestbook-input"
                ref={input}
                value={text}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder="Say hello, ask something, or report an API that is down"
                className="max-h-40 min-h-11 flex-1 resize-none [field-sizing:content] border-0 border-b border-line bg-transparent py-2.5 text-[16px] leading-relaxed text-ink outline-none placeholder:text-mute focus:border-ink"
              />
              <button
                type="submit"
                disabled={pending || text.trim().length < MIN_MESSAGE_LENGTH}
                className={SOLID_BUTTON}
              >
                {pending ? "Sending…" : "Send"}
              </button>
            </div>
            <p className="fh-mono mt-2 flex justify-between gap-4 text-[11px] text-mute">
              <span>Enter to send · Shift+Enter for a new line</span>
              <span className="tabular-nums">
                {text.length}/{MAX_MESSAGE_LENGTH}
              </span>
            </p>
          </form>
        )}
        {signedInAs && (
          <form
            action={async () => {
              const accepted = await confirm({
                title: "Sign out?",
                message: "You'll be signed out on this device and stay on the guestbook.",
                label: "Sign out",
              });
              if (accepted) await signOutHere("/guestbook");
            }}
            className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line pt-3 text-[13px] text-mute"
          >
            <span>
              Signed in as <span className="text-ink">{signedInAs.name}</span> ({signedInAs.email})
            </span>
            <button type="submit" className="cursor-pointer text-ink hover:underline">
              Sign out
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Entry({
  message,
  viewer,
  busy,
  onReply,
  onPin,
  onDelete,
}: {
  message: ThreadMessage;
  viewer: Viewer;
  busy: string | null;
  onReply: ((message: ThreadMessage) => void) | null;
  onPin: (message: ThreadMessage) => void;
  onDelete: (message: ThreadMessage) => void;
}) {
  return (
    <div
      data-message-id={message.id}
      data-depth={message.depth}
      className={cn(message.depth === 0 ? "border-b border-line py-5 last:border-b-0" : "mt-4 border-l border-line pl-4")}
    >
      <article className={cn("flex gap-3", busy === message.id && "opacity-50")}>
        <Avatar src={message.profileImage} name={message.fullName} size={message.depth ? 24 : 30} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <span className="text-[15px] font-medium text-ink">{message.fullName}</span>
            {message.role !== "public" && (
              <span className="fh-mono text-[10px] tracking-[0.12em] text-sulfur uppercase">{ROLE_LABEL[message.role]}</span>
            )}
            {message.isPinned && <span className="fh-mono text-[10px] tracking-[0.12em] text-mute uppercase">Pinned</span>}
            <time dateTime={message.timestamp} className="fh-mono text-[11px] text-mute">
              {shortDate(message.timestamp)}
            </time>
          </p>
          {message.showReplyTo && message.replyTo && (
            <p className="mt-1 truncate text-[13px] text-mute">
              ↳ {message.replyTo.fullName}: {message.replyTo.message}
            </p>
          )}
          <p className="mt-1 text-[15px] leading-relaxed break-words whitespace-pre-line text-ink">{message.message}</p>
          {(onReply || viewer.canPin || viewer.canDelete) && (
            <div className="mt-2 flex gap-5">
              {onReply && (
                <button type="button" onClick={() => onReply(message)} className={TEXT_BUTTON}>
                  Reply
                </button>
              )}
              {viewer.canPin && (
                <button type="button" onClick={() => onPin(message)} disabled={busy === message.id} className={TEXT_BUTTON}>
                  {message.isPinned ? "Unpin" : "Pin"}
                </button>
              )}
              {viewer.canDelete && (
                <button type="button" onClick={() => onDelete(message)} disabled={busy === message.id} className={TEXT_BUTTON}>
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </article>
      {message.replies.map((child) => (
        <Entry
          key={child.id}
          message={child}
          viewer={viewer}
          busy={busy}
          onReply={onReply}
          onPin={onPin}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
