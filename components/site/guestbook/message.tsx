"use client";

import { MessageText } from "@/components/site/guestbook/message-text";
import {
  AvatarFallback,
  PinIcon,
  ReplyIcon,
  RoleBadge,
} from "@/components/site/guestbook/role-badge";
import type { ThreadMessage } from "@/lib/data/guestbook-tree";

/**
 * One guestbook message and, recursively, its replies.
 *
 * **The only definition of a message's markup.** It used to exist twice --
 * here, and as a ~150-line template string in the guestbook's inline script for
 * messages posted over AJAX -- and the two had to be edited together or a new
 * message rendered differently until the next page load. There is no JS builder
 * now: posting revalidates and the server re-renders this same component.
 *
 * The rails are drawn by the wrapper around each reply, not by the reply
 * itself, so this stays agnostic about where in a thread it sits. Geometry
 * matches `comments/_section.html` -- `left-[1.125rem]` is the centre of a
 * 2.25rem avatar -- with a tighter indent, because a comment thread nests once
 * and this nests twice. **`bg-zinc-700`, not `zinc-800`:** at 1px against a
 * near-black panel, `zinc-800` is invisible.
 */
export type Viewer = {
  userId: number | null;
  isAuthor: boolean;
  canPin: boolean;
};

export type MessageActions = {
  onReply: (message: ThreadMessage) => void;
  onPin: (message: ThreadMessage) => void;
  onDelete: (message: ThreadMessage) => void;
  /** Ids with an action in flight, so the control can show it. */
  busy: Set<number>;
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** `{{ message.timestamp|date:"d/m/Y, H:i" }}`. */
function formatTimestamp(iso: string): string {
  return DATE_FORMAT.format(new Date(iso));
}

export function Message({
  message,
  viewer,
  actions,
}: {
  message: ThreadMessage;
  viewer: Viewer;
  actions: MessageActions;
}) {
  const signedIn = viewer.userId !== null;
  const mine = signedIn && message.userId === viewer.userId;
  const busy = actions.busy.has(message.id);

  return (
    <div className="gb-message" data-message-id={message.id} data-depth={message.depth}>
      <div className="group/msg flex items-start gap-3">
        {message.profileImage ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             avatars are arbitrary provider URLs; next/image needs every host
             allow-listed in advance and these are 36px, so optimising them
             would cost a round trip to save nothing. */
          <img
            src={message.profileImage}
            alt={message.fullName}
            width={36}
            height={36}
            loading="lazy"
            className="avatar-ring w-9 h-9"
          />
        ) : (
          <AvatarFallback className="w-9 h-9" glyph="w-4 h-4" />
        )}

        <div className="min-w-0 flex-1 space-y-1">
          {/*
            Shown only when the tree cannot show the relationship itself: the
            message it answers fell outside the fetched window, or it was
            flattened off its parent at the depth cap. That caption is what the
            entire flat list used to be.
          */}
          {message.showReplyTo && message.replyTo && (
            <div className="flex items-center gap-1 text-xs text-zinc-500">
              <ReplyIcon className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                <ReplyCaption message={message} viewer={viewer} mine={mine} />{" "}
                &ldquo;{truncate(message.replyTo.message, 40)}&rdquo;
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-zinc-200">{message.fullName}</span>
            <RoleBadge isAuthor={message.isAuthor} isCoAuthor={message.isCoAuthor} />
            {message.isPinned && (
              <span
                className="flex items-center gap-0.5 rounded-full bg-zinc-700 px-1.5 py-0.5 text-amber-400"
                title="Pinned message"
              >
                <PinIcon className="w-2.5 h-2.5" filled />
                <span className="text-[9px]">Pinned</span>
              </span>
            )}
            <time dateTime={message.timestamp} className="text-xs text-zinc-500">
              {formatTimestamp(message.timestamp)}
            </time>
          </div>

          <div className="flex items-start gap-2">
            <p className="w-fit min-w-0 rounded-xl rounded-tl-none bg-zinc-800 px-3 py-2 break-words group-hover/msg:bg-zinc-700 transition-colors">
              <MessageText text={message.message} />
            </p>

            {/*
              Always on screen.
              
              These used to fade in on hovering the message, which meant the only
              way to discover that a message could be replied to was to put a
              pointer on it -- and on a touch screen there is no hover at all, so
              the first tap only revealed the control that the second one used.
            */}
            <div className="flex flex-shrink-0 items-center gap-0.5 pt-1">
              <button
                type="button"
                onClick={() => actions.onReply(message)}
                className="p-1.5 rounded-lg hover:bg-zinc-700 transition-colors"
                title={signedIn ? "Reply to this message" : "Sign in to reply"}
              >
                <ReplyIcon className="w-4 h-4 text-zinc-400 hover:text-zinc-200 transition-colors" />
              </button>

              {viewer.canPin && (
                <button
                  type="button"
                  onClick={() => actions.onPin(message)}
                  disabled={busy}
                  className="p-1.5 rounded-lg hover:bg-amber-900/30 transition-colors disabled:opacity-50"
                  title={message.isPinned ? "Unpin this message" : "Pin this message"}
                >
                  <PinIcon
                    className={`w-4 h-4 transition-colors ${
                      message.isPinned ? "text-amber-400" : "text-zinc-400 hover:text-amber-400"
                    }`}
                    filled={message.isPinned}
                  />
                </button>
              )}

              {viewer.isAuthor && (
                <button
                  type="button"
                  onClick={() => actions.onDelete(message)}
                  disabled={busy}
                  className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  title="Delete this message"
                >
                  <svg
                    className="w-4 h-4 text-zinc-400 hover:text-red-400 transition-colors"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*
        Thread rail. Each reply draws its own vertical segment and an elbow into
        the avatar, so the line runs continuously down the branch and stops at
        the last reply rather than dangling past it.
      */}
      {message.replies.length > 0 && (
        <div className="gb-replies mt-3 space-y-3">
          {message.replies.map((reply, index) => (
            <div
              key={reply.id}
              className={`gb-branch relative pl-7 sm:pl-9
                before:content-[''] before:absolute before:left-[1.125rem] before:top-0 before:w-px before:bg-zinc-700
                ${index === message.replies.length - 1 ? "before:h-[1.125rem]" : "before:bottom-[-0.75rem]"}
                after:content-[''] after:absolute after:left-[1.125rem] after:top-[1.125rem] after:h-px after:w-2 sm:after:w-4 after:bg-zinc-700`}
            >
              <Message message={reply} viewer={viewer} actions={actions} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** `{{ …|truncatechars:40 }}` — Django counts the ellipsis within the limit. */
function truncate(text: string, limit: number): string {
  return text.length <= limit ? text : `${text.slice(0, limit - 1)}…`;
}

/** Who answered whom, phrased from the reader's point of view. */
function ReplyCaption({
  message,
  viewer,
  mine,
}: {
  message: ThreadMessage;
  viewer: Viewer;
  mine: boolean;
}) {
  const target = message.replyTo;
  if (!target) return null;

  if (message.userId === target.userId) {
    return mine ? (
      <>You replied to yourself:</>
    ) : (
      <>
        <span className="font-medium text-zinc-400">{message.fullName}</span> replied to self:
      </>
    );
  }
  if (mine) {
    return (
      <>
        You replied to <span className="font-medium text-zinc-400">{target.fullName}</span>:
      </>
    );
  }
  if (viewer.userId !== null && target.userId === viewer.userId) {
    return <>Replied to you:</>;
  }
  return (
    <>
      Replied to <span className="font-medium text-zinc-400">{target.fullName}</span>:
    </>
  );
}
