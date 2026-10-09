"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState, useTransition } from "react";

import { Avatar } from "@/components/foothill/account-menu";
import { ActionButton } from "@/components/foothill/controls";
import { Brand, Icon } from "@/components/foothill/icons";
import { Button, Heading } from "@/components/foothill/ui";
import { useConfirm } from "@/components/providers/confirm-dialog";
import { signInWith } from "@/lib/actions/auth";
import { deleteComment, postComment } from "@/lib/actions/comments";
import { ROLE_LABEL } from "@/lib/auth/roles";
import { MAX_COMMENT_LENGTH, type CommentNode, type CommentSection } from "@/lib/data/comment-shapes";
import { notify } from "@/lib/notify";
import { shortDate } from "@/lib/site/display";

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
    // `data-fh-scope`: this streams in behind a `<Suspense>`, so the page's
    // own entrance script must leave its heading alone -- styling markup React
    // has not hydrated yet is a hydration mismatch.
    <div id="comments" style={{ scrollMarginTop: 90 }} data-fh-scope="">
      <Heading id="comments-title" title="Comments" count={section.count} note="Signed-in readers can comment." />
      <div style={{ display: "grid", gap: 16, maxWidth: 760 }}>
        <AnimatePresence initial={false}>
          {section.comments.map((comment) => (
            <motion.div
              layout
              key={comment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Message comment={comment} onReply={canPost ? reply : null} onDelete={remove} busy={busy === comment.id}>
                {comment.replies.length > 0 && (
                  <div className="replies">
                    {comment.replies.map((child) => (
                      <Message key={child.id} comment={child} onReply={null} onDelete={remove} busy={busy === child.id} />
                    ))}
                  </div>
                )}
              </Message>
            </motion.div>
          ))}
        </AnimatePresence>

        {!signedInAs ? (
          <div className="panel sign-panel">
            <span className="mute">
              {section.comments.length ? `Sign in to add to the conversation on this ${noun}.` : "No comments yet."}
            </span>
            <Button sm icon="pen" href="/sign-in">
              {section.comments.length ? "Sign in" : "Sign in to write the first"}
            </Button>
          </div>
        ) : !canPost ? (
          <p className="meta">This account can&rsquo;t post comments right now.</p>
        ) : (
          <form
            className="compose"
            style={{ position: "static" }}
            onSubmit={(event) => {
              event.preventDefault();
              submit(event.currentTarget);
            }}
          >
            <input type="hidden" name="content_type" value={section.targetLabel} />
            <input type="hidden" name="object_id" value={section.targetId} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="reply_to" value={replyTo?.id ?? ""} />
            <div className="who">
              {replyTo ? (
                <>
                  Replying to {replyTo.displayName}
                  <button type="button" className="tl" onClick={() => setReplyTo(null)}>
                    <Icon name="x" size={13} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>Commenting as {signedInAs}</>
              )}
            </div>
            <textarea
              ref={input}
              className="input"
              name="body"
              aria-label="Your comment"
              placeholder="Add to the conversation."
              maxLength={MAX_COMMENT_LENGTH}
              required
              value={body}
              onChange={(event) => setBody(event.target.value)}
              style={{ minHeight: 120 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <span className="mono mute">
                {body.length} / {MAX_COMMENT_LENGTH}
              </span>
              <ActionButton sm type="submit" icon="send" disabled={pending || !body.trim()}>
                {pending ? "Posting…" : replyTo ? "Post reply" : "Post comment"}
              </ActionButton>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function Message({
  comment,
  onReply,
  onDelete,
  busy,
  children,
}: {
  comment: CommentNode;
  onReply: ((comment: CommentNode) => void) | null;
  onDelete: (comment: CommentNode) => void;
  busy: boolean;
  children?: React.ReactNode;
}) {
  return (
    <article className="msg" style={busy ? { opacity: 0.5 } : undefined}>
      <Avatar src={comment.profileImage} name={comment.displayName} size={36} />
      <div className="who">
        {comment.displayName}
        {comment.role !== "public" && <span className="tag solid">{ROLE_LABEL[comment.role]}</span>}
        <time dateTime={comment.createdAt} className="mono mute" style={{ fontWeight: 400 }}>
          {shortDate(comment.createdAt)}
        </time>
      </div>
      {comment.isDeleted ? (
        <p className="body mute">
          <i>This comment was deleted.</i>
        </p>
      ) : (
        <p className="body" style={{ whiteSpace: "pre-line" }}>
          {comment.body}
        </p>
      )}
      {!comment.isDeleted && (onReply || comment.canDelete) && (
        <div className="msg-acts">
          {onReply && (
            <button type="button" onClick={() => onReply(comment)}>
              <Icon name="msg" size={13} />
              Reply
            </button>
          )}
          {comment.canDelete && (
            <button type="button" onClick={() => onDelete(comment)} disabled={busy}>
              <Icon name="x" size={13} />
              Delete
            </button>
          )}
        </div>
      )}
      {children}
    </article>
  );
}

/** Sign in with GitHub or Google without leaving the page. */
export function SignInButtons({ redirectTo }: { redirectTo?: string }) {
  const [pending, startTransition] = useTransition();
  const go = (provider: "github" | "google") =>
    startTransition(async () => {
      await signInWith(provider, redirectTo ?? window.location.pathname);
    });
  return (
    <div className="compose-acts">
      <ActionButton wide icon={<Brand name="github" />} disabled={pending} onClick={() => go("github")}>
        Sign in with GitHub
      </ActionButton>
      <ActionButton wide ghost icon={<Brand name="google" />} disabled={pending} onClick={() => go("google")}>
        Sign in with Google
      </ActionButton>
    </div>
  );
}
