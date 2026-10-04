"use client";

import { useRef, useState, useTransition } from "react";

import { H2, SOLID_BUTTON, TEXT_BUTTON } from "@/components/foothill/classes";
import { Brand, Icon } from "@/components/foothill/icons";
import { Roll } from "@/components/foothill/motion";
import { useConfirm } from "@/components/providers/confirm-dialog";
import { signInWith } from "@/lib/actions/auth";
import { deleteComment, postComment } from "@/lib/actions/comments";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { MAX_COMMENT_LENGTH, type CommentNode, type CommentSection } from "@/lib/data/comment-shapes";
import { notify } from "@/lib/notify";
import { shortDate, sizedAvatar } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

/**
 * The conversation under a post or a project.
 *
 * Every write goes through the server actions, which re-check who may post and
 * who may delete -- the buttons here are hints, not permissions. Replies are
 * one level deep, as the action stores them.
 */
export function Comments({
  section,
  slug,
  signedInAs,
  canPost,
}: {
  section: CommentSection;
  slug: string;
  signedInAs: string | null;
  canPost: boolean;
}) {
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const confirm = useConfirm();
  const input = useRef<HTMLTextAreaElement>(null);
  const noun = section.targetLabel === "project" ? "project" : "post";

  const submit = (form: HTMLFormElement) => {
    const data = new FormData(form);
    startTransition(async () => {
      const result = await postComment(data);
      if (result.ok) {
        notify(result.notice, "success");
        setBody("");
        setReplyTo(null);
      } else {
        notify(result.error, "error");
      }
    });
  };

  const remove = async (comment: CommentNode) => {
    const accepted = await confirm({
      title: "Delete this comment?",
      message: "It will show as deleted for everyone. Replies under it stay.",
      label: "Delete",
      variant: "danger",
    });
    if (!accepted) return;
    setBusy(comment.id);
    startTransition(async () => {
      const result = await deleteComment(comment.id, slug);
      notify(result.ok ? result.notice : result.error, result.ok ? "success" : "error");
      setBusy(null);
    });
  };

  const reply = (comment: CommentNode) => {
    setReplyTo(comment);
    input.current?.focus();
  };

  return (
    <section id="comments" aria-labelledby="comments-title" className="scroll-mt-28">
      <h2 id="comments-title" className={`${H2} text-[clamp(1.75rem,1.4rem+1.4vw,2.5rem)]`}>
        Comments
        <sup className="ml-2 align-super font-text text-[0.4em] font-normal tracking-normal text-mute tabular-nums">
          {section.count}
        </sup>
      </h2>

      {section.comments.length > 0 ? (
        <ol className="mt-6">
          {section.comments.map((comment) => (
            <li key={comment.id} className="border-b border-line py-6 first:pt-2">
              <Comment comment={comment} onReply={canPost ? reply : null} onDelete={remove} busy={busy === comment.id} />
              {comment.replies.length > 0 && (
                <ol className="mt-5 space-y-5 border-l border-line pl-5 md:ml-11">
                  {comment.replies.map((child) => (
                    <li key={child.id}>
                      <Comment comment={child} onReply={canPost ? reply : null} onDelete={remove} busy={busy === child.id} />
                    </li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-6 text-[18px] leading-relaxed text-mute">
          Nobody has said anything about this {noun} yet. You could be the first.
        </p>
      )}

      <div className="mt-10">
        {!signedInAs ? (
          <SignInPrompt />
        ) : !canPost ? (
          <p className="text-[15px] text-mute">This account can&rsquo;t post comments right now.</p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit(event.currentTarget);
            }}
          >
            <input type="hidden" name="content_type" value={section.targetLabel} />
            <input type="hidden" name="object_id" value={section.targetId} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="reply_to" value={replyTo?.id ?? ""} />

            {replyTo && (
              <p className="mb-3 flex items-center gap-3 text-[14px] text-mute">
                Replying to <span className="text-ink">{replyTo.displayName}</span>
                <button type="button" onClick={() => setReplyTo(null)} className={TEXT_BUTTON}>
                  <Icon name="close" className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </p>
            )}
            <label htmlFor="comment-body" className="sr-only">
              Your comment
            </label>
            <textarea
              id="comment-body"
              ref={input}
              name="body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={MAX_COMMENT_LENGTH}
              rows={4}
              required
              placeholder={`Say something about this ${noun}, as ${signedInAs}`}
              className="w-full resize-y rounded-[14px] border border-line bg-transparent px-4 py-3 text-[16px] leading-relaxed text-ink outline-none transition-colors placeholder:text-mute focus:border-ink"
            />
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="text-[13px] text-mute tabular-nums">
                {body.length} / {MAX_COMMENT_LENGTH}
              </span>
              <button type="submit" disabled={pending || !body.trim()} className={SOLID_BUTTON}>
                <Roll>{pending ? "Posting…" : replyTo ? "Post reply" : "Post comment"}</Roll>
                <Icon name="send" className="transition-transform duration-500 group-enabled:group-hover:translate-x-0.5 group-enabled:group-hover:-translate-y-0.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Comment({
  comment,
  onReply,
  onDelete,
  busy,
}: {
  comment: CommentNode;
  onReply: ((comment: CommentNode) => void) | null;
  onDelete: (comment: CommentNode) => void;
  busy: boolean;
}) {
  return (
    <article className={cn("flex gap-4", busy && "opacity-50")}>
      <Avatar src={comment.profileImage} name={comment.displayName} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-[15px] font-medium text-ink">{comment.displayName}</span>
          {comment.role !== "public" && (
            <span className="rounded-full bg-raise px-2 py-0.5 text-[12px] text-ink">{ROLE_LABEL[comment.role]}</span>
          )}
          <time dateTime={comment.createdAt} className="text-[13px] text-mute">
            {shortDate(comment.createdAt)}
          </time>
        </p>
        {comment.isDeleted ? (
          <p className="mt-1.5 text-[15px] text-mute italic">This comment was deleted.</p>
        ) : (
          <p className="mt-1.5 text-[16px] leading-relaxed whitespace-pre-line [overflow-wrap:anywhere] text-ink">{comment.body}</p>
        )}
        {!comment.isDeleted && (onReply || comment.canDelete) && (
          <div className="mt-2 flex gap-5">
            {onReply && (
              <button type="button" onClick={() => onReply(comment)} className={TEXT_BUTTON}>
                <Icon name="reply" className="h-3.5 w-3.5" />
                Reply
              </button>
            )}
            {comment.canDelete && (
              <button type="button" onClick={() => onDelete(comment)} disabled={busy} className={TEXT_BUTTON}>
                <Icon name="trash" className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function Avatar({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element -- provider avatars, any host
    <img
      src={sizedAvatar(src, size * 2)}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center justify-center rounded-full bg-raise text-[12px] text-ink"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Sign-in for a reader who is not signed in, without leaving the page. */
export function SignInPrompt({ redirectTo }: { redirectTo?: string }) {
  const [pending, startTransition] = useTransition();
  const go = (provider: "github" | "google") =>
    startTransition(async () => {
      await signInWith(provider, redirectTo ?? window.location.pathname);
    });

  const provider = (name: "github" | "google", label: string) => (
    <button
      type="button"
      disabled={pending}
      onClick={() => go(name)}
      className="group inline-flex cursor-pointer items-center gap-1.5 font-medium text-ink disabled:opacity-50"
    >
      <Brand name={name} className="h-4 w-4 transition-transform duration-500 group-hover:-rotate-12" />
      <span className="fh-underline">{label}</span>
    </button>
  );

  // One sentence rather than a panel: it is an aside to the conversation, not
  // a gate in front of it.
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-mute">
      <span>Sign in with</span>
      {provider("github", "GitHub")}
      <span>or</span>
      {provider("google", "Google")}
      <span>to join in.</span>
    </p>
  );
}
