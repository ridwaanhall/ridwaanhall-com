"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useTransition } from "react";

import { Avatar } from "@/components/foothill/account-menu";
import { SignInButtons } from "@/components/foothill/comments";
import { ActionButton, EASE, Seg } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import { Empty } from "@/components/foothill/ui";
import { useConfirm } from "@/components/providers/confirm-dialog";
import { deleteMessage, sendMessage, togglePin } from "@/lib/actions/guestbook";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { MAX_MESSAGE_LENGTH, MIN_MESSAGE_LENGTH, type Thread, type ThreadMessage } from "@/lib/data/guestbook-tree";
import { notify } from "@/lib/notify";
import { shortDate } from "@/lib/site/display";

export type Viewer = { userId: string | null; canPost: boolean; canPin: boolean; canDelete: boolean };

type Result = { ok: true; notice: string } | { ok: false; error: string };

const BATCH = 12;

/** Every reply under a thread, at any depth, in the order they were written. */
function replies(root: ThreadMessage): ThreadMessage[] {
  const out: ThreadMessage[] = [];
  const walk = (message: ThreadMessage) =>
    message.replies.forEach((child) => {
      out.push(child);
      walk(child);
    });
  walk(root);
  return out.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

/**
 * The guestbook: the line to write on, beside the conversation.
 *
 * Threads newest first by default, pinned ones above the rest either way,
 * twelve at a time. Every action is a server action that re-checks the
 * account -- a hidden button is a courtesy, not the rule. Deleting a message
 * is a superuser's alone, because it takes every reply with it and leaves no
 * trace. The ids and data attributes on the regions and messages are what
 * the harnesses find them by.
 */
export function Guestbook({
  thread,
  viewer,
  signedInAs,
}: {
  thread: Thread;
  viewer: Viewer;
  signedInAs: { name: string; image: string | null } | null;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [order, setOrder] = useState<"new" | "old">("new");
  const [shown, setShown] = useState(BATCH);
  const signedIn = viewer.userId !== null;
  const canPost = signedIn && viewer.canPost;

  const report = (result: Result) => notify(result.ok ? result.notice : result.error, result.ok ? "success" : "error");
  const run = (id: string, action: () => Promise<Result>) => {
    setBusy(id);
    startTransition(async () => {
      report(await action());
      setBusy(null);
    });
  };

  const send = (body: string, parent: string | null, done: () => void) => {
    const value = body.trim();
    if (value.length < MIN_MESSAGE_LENGTH) return;
    const data = new FormData();
    data.set("message", value);
    if (parent) data.set("reply_to", parent);
    startTransition(async () => {
      const result = await sendMessage(data);
      report(result);
      if (result.ok) done();
    });
  };

  const remove = async (message: ThreadMessage) => {
    const accepted = await confirm({
      title: "Delete this message?",
      message: "It is removed for everyone, with every reply under it. This cannot be undone.",
      label: "Delete",
      variant: "danger",
      detail: message.message,
    });
    if (!accepted) return;
    if (replyTo === message.id) setReplyTo(null);
    run(message.id, () => deleteMessage(message.id));
  };

  const roots = order === "new" ? [...thread.roots].reverse() : thread.roots;
  const pinned = roots.filter((message) => message.isPinned);
  const rest = roots.filter((message) => !message.isPinned);

  // A render function, not a component: a component declared here would be a
  // new type on every render, and the open reply box would lose its focus at
  // each keystroke.
  const renderMessage = (message: ThreadMessage, small = false) => (
    <article
      key={message.id}
      className={message.isPinned && !small ? "msg pinned" : "msg"}
      data-message-id={message.id}
      data-depth={message.depth}
      style={busy === message.id ? { opacity: 0.5 } : undefined}
    >
      <Avatar src={message.profileImage} name={message.fullName} size={small ? 28 : 36} />
      <div className="who">
        {message.fullName}
        {message.role !== "public" && <span className="tag solid">{ROLE_LABEL[message.role]}</span>}
        {message.isPinned && (
          <span className="tag">
            <Icon name="pin" size={11} />
            Pinned
          </span>
        )}
        <time dateTime={message.timestamp} className="mono mute" style={{ fontWeight: 400 }}>
          {shortDate(message.timestamp)}
        </time>
      </div>
      {small && message.showReplyTo && message.replyTo && (
        <p className="meta reply-to">
          <Icon name="reply" size={12} />
          <span>
            {message.replyTo.fullName}: {message.replyTo.message}
          </span>
        </p>
      )}
      <p className="body" style={{ whiteSpace: "pre-line" }}>
        {message.message}
      </p>
      {(canPost || viewer.canPin || viewer.canDelete) && (
        <div className="msg-acts">
          {canPost && (
            <button
              type="button"
              aria-expanded={replyTo === message.id}
              onClick={() => {
                setReplyTo(replyTo === message.id ? null : message.id);
                setReply("");
              }}
            >
              <Icon name="msg" size={13} />
              Reply
            </button>
          )}
          {viewer.canPin && !small && (
            <button type="button" disabled={busy === message.id} onClick={() => run(message.id, () => togglePin(message.id))}>
              <Icon name="pin" size={13} />
              {message.isPinned ? "Unpin" : "Pin"}
            </button>
          )}
          {viewer.canDelete && (
            <button type="button" disabled={busy === message.id} onClick={() => remove(message)}>
              <Icon name="x" size={13} />
              Delete
            </button>
          )}
        </div>
      )}
      <AnimatePresence initial={false}>
        {replyTo === message.id && (
          <motion.div
            key="reply"
            className="reply-box"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <textarea
              className="input"
              autoFocus
              aria-label={`Reply to ${message.fullName}`}
              placeholder={`Reply to ${message.fullName}`}
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              maxLength={MAX_MESSAGE_LENGTH}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <ActionButton sm ghost onClick={() => setReplyTo(null)}>
                Cancel
              </ActionButton>
              <ActionButton
                sm
                icon="send"
                disabled={pending || reply.trim().length < MIN_MESSAGE_LENGTH}
                onClick={() =>
                  send(reply, message.id, () => {
                    setReply("");
                    setReplyTo(null);
                  })
                }
              >
                Post reply
              </ActionButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!small && replies(message).length > 0 && (
        <div className="replies">
          {replies(message).map((child) => renderMessage(child, true))}
        </div>
      )}
    </article>
  );

  return (
    <div className="wrap gbwrap gb" style={{ paddingBottom: 80 }}>
      {canPost ? (
        <form
          className="compose"
          onSubmit={(event) => {
            event.preventDefault();
            send(text, null, () => setText(""));
          }}
        >
          <div className="compose-h">
            <h2 className="t3">Write a message</h2>
            <span className="mono mute">
              {text.length} / {MAX_MESSAGE_LENGTH}
            </span>
          </div>
          <div className="who" style={{ fontWeight: 500 }}>
            <Avatar src={signedInAs?.image ?? null} name={signedInAs?.name ?? "?"} size={28} />
            Posting as {signedInAs?.name}
          </div>
          <textarea
            id="guestbook-input"
            className="input"
            aria-label="Your message"
            placeholder="Say hello, ask about a project, or leave a note for the next visitor."
            maxLength={MAX_MESSAGE_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <ActionButton wide type="submit" icon="send" disabled={pending || text.trim().length < MIN_MESSAGE_LENGTH}>
            {pending ? "Posting…" : "Post message"}
          </ActionButton>
          <p className="meta">Shown with your name. A message stays until the site&rsquo;s owner removes it.</p>
        </form>
      ) : (
        <div className="compose">
          <div className="compose-h">
            <h2 className="t3">Write a message</h2>
            <span className="mono mute">0 / {MAX_MESSAGE_LENGTH}</span>
          </div>
          <label className="f" htmlFor="guestbook-input">
            <span className="meta">Your message, in your own name</span>
            <textarea
              id="guestbook-input"
              className="input"
              placeholder="Say hello, ask about a project, or leave a note for the next visitor."
              disabled
            />
          </label>
          {signedIn ? (
            <p className="meta">Posting to the guestbook is turned off for this account.</p>
          ) : (
            <>
              <SignInButtons redirectTo="/guestbook" />
              <p className="meta">Signing in only shows your name and picture beside what you write. Nothing is posted for you.</p>
            </>
          )}
        </div>
      )}

      <div id="guestbook-messages">
        {thread.roots.length > 0 ? (
          <div className="gb-bar">
            <span className="meta">{roots.length} threads, pinned first</span>
            <Seg
              id="gb-sort"
              label="Order"
              value={order}
              onChange={(value) => {
                setOrder(value);
                setShown(BATCH);
              }}
              items={[
                ["new", "Newest"],
                ["old", "Oldest"],
              ]}
            />
          </div>
        ) : (
          <Empty icon="msg" title="No messages yet" note="The first line here could be yours. Sign in, write a message, and it appears at the top." />
        )}
        <AnimatePresence initial={false}>
          {[...pinned, ...rest.slice(0, shown)].map((message) => (
            <motion.div
              layout
              key={message.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
            >
              {renderMessage(message)}
            </motion.div>
          ))}
        </AnimatePresence>
        {rest.length > shown && (
          <div style={{ display: "grid", justifyItems: "center", gap: 12, marginTop: 28 }}>
            <button type="button" className="btn ghost" onClick={() => setShown(shown + BATCH)}>
              <Icon name="plus" />
              Show 12 more
            </button>
            <span className="mono mute">
              Showing {Math.min(shown, rest.length)} of {rest.length} threads
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
