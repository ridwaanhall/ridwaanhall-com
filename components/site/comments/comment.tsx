"use client";

import type { CommentNode } from "@/lib/data/comment-shapes";

/**
 * One comment. Rendered again for each reply, so a comment's markup lives in
 * exactly one place.
 *
 * `isReply` only changes the scale -- smaller avatar and type. The thread's
 * connector lines are drawn by the wrapper in `section.tsx`, so this stays
 * agnostic about where in the thread it sits.
 */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const TITLE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function Comment({
  comment,
  isReply = false,
  canReply,
  onReply,
  onDelete,
  busy,
}: {
  comment: CommentNode;
  isReply?: boolean;
  canReply: boolean;
  onReply: (comment: CommentNode) => void;
  onDelete: (comment: CommentNode) => void;
  busy: boolean;
}) {
  const created = new Date(comment.createdAt);

  return (
    <article className="group flex gap-3">
      {comment.profileImage ? (
        /* eslint-disable-next-line @next/next/no-img-element --
           provider avatars, as on the guestbook: arbitrary hosts, 28-36px. */
        <img
          src={comment.profileImage}
          alt={comment.username}
          width={isReply ? 28 : 36}
          height={isReply ? 28 : 36}
          loading="lazy"
          className={`avatar-ring ${isReply ? "w-7 h-7" : "w-9 h-9"} mt-0.5`}
        />
      ) : (
        <div
          className={`${isReply ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm"} rounded-full bg-zinc-900 border border-zinc-800 flex-shrink-0 mt-0.5 flex items-center justify-center text-zinc-400 font-medium`}
        >
          {comment.username.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`${isReply ? "text-sm" : ""} font-medium text-zinc-200`}>
            {comment.displayName}
          </span>

          {/*
            Deliberately not the guestbook's badge. That one is a gradient pill
            with a glyph, sized for a dense chat row; this section is body copy
            at a larger scale, and the original styled it differently here for
            that reason.
          */}
          {comment.role === "superuser" ? (
            <span className="inline-flex items-center rounded-full bg-gradient-to-bl from-purple-800 via-violet-900 to-purple-800 px-2 py-0.5 text-[11px] font-medium text-violet-50">
              Superuser
            </span>
          ) : comment.role === "staff" ? (
            <span className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
              Staff
            </span>
          ) : null}

          <time
            dateTime={comment.createdAt}
            title={TITLE_FORMAT.format(created)}
            className="text-xs text-zinc-500 font-mono"
          >
            {DATE_FORMAT.format(created)}
          </time>
        </div>

        {comment.isDeleted ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-600 italic">
            <TrashIcon className="w-3.5 h-3.5 flex-shrink-0" />
            This comment was deleted.
          </p>
        ) : (
          <>
            <p
              className={`mt-1 ${isReply ? "text-sm" : ""} text-zinc-300 whitespace-pre-line break-words leading-relaxed`}
            >
              {comment.body}
            </p>

            <div className="mt-1.5 flex items-center gap-1 text-xs">
              {/* Replies are one level deep, so only a top-level comment offers
                  the control -- answering a reply attaches to its parent
                  anyway, and a button that silently moves your reply elsewhere
                  is worse than no button. */}
              {canReply && !isReply && (
                <button
                  type="button"
                  onClick={() => onReply(comment)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-zinc-500 hover:text-indigo-300 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-all duration-300"
                >
                  <ReplyIcon className="w-3.5 h-3.5" />
                  Reply
                </button>
              )}

              {comment.canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(comment)}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-zinc-500 hover:text-red-300 hover:bg-red-950/40 border border-transparent hover:border-red-900/60 transition-all duration-300 disabled:opacity-50"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function TrashIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3"
      />
    </svg>
  );
}

export function ReplyIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}
