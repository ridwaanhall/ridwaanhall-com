"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";

import { GitHubMark, GoogleMark } from "@/components/icons/provider-marks";
import { useConfirm } from "@/components/providers/confirm-dialog";
import { Comment, ReplyIcon } from "@/components/site/comments/comment";
import { signInWith } from "@/lib/actions/auth";
import { deleteComment, postComment } from "@/lib/actions/comments";
import { MAX_COMMENT_LENGTH, type CommentNode, type CommentSection } from "@/lib/data/comment-shapes";
import { notify } from "@/lib/notify";

/**
 * The comment section for any commentable object.
 *
 * The form keeps a real `action`, so it still posts with JavaScript
 * unavailable. Only the reply indicator needs the client.
 */
export function Comments({
  section,
  slug,
  signedInAs,
  canPost,
}: {
  section: CommentSection;
  /** Which page to revalidate after a mutation. */
  slug: string;
  signedInAs: string | null;
  /**
   * Whether this reader may post at all, decided on the server.
   *
   * Hiding the form is not the gate -- `postComment` refuses the same reader
   * whatever is on screen -- but a form that is going to be refused is a form
   * that should say so before somebody types into it.
   */
  canPost: boolean;
}) {
  const confirm = useConfirm();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<CommentNode | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const signedIn = signedInAs !== null;

  const report = (result: { ok: true; notice: string } | { ok: false; error: string }) =>
    result.ok ? notify(result.notice, "success") : notify(result.error, "error");

  async function submit(formData: FormData) {
    const result = await postComment(formData);
    report(result);
    if (result.ok) {
      formRef.current?.reset();
      setReplyTo(null);
    }
  }

  async function remove(comment: CommentNode) {
    const accepted = await confirm({
      title: "Delete this comment?",
      message: "This can't be undone. Any replies will stay in the thread.",
      label: "Delete",
      variant: "danger",
      detail: comment.body,
    });
    if (!accepted) return;
    setBusy(comment.id);
    startTransition(async () => {
      report(await deleteComment(comment.id, slug));
      setBusy(null);
      if (replyTo?.id === comment.id) setReplyTo(null);
    });
  }

  return (
    <section id="comments" className="mt-10 sm:mt-12 pt-8 border-t border-zinc-800">
      <h2 className="text-lg sm:text-xl font-medium mb-4 md:mb-6 flex items-center gap-2">
        <ChatIcon className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
        {section.count} comment{section.count === 1 ? "" : "s"}
      </h2>

      {signedIn && !canPost && <CannotPost />}

      {signedIn && canPost ? (
        <>
          <form ref={formRef} action={submit} className="mb-8">
            <input type="hidden" name="content_type" value={section.targetLabel} />
            <input type="hidden" name="object_id" value={section.targetId} />
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="reply_to" value={replyTo?.id ?? ""} />

            {/* No card around this. The contact page's form sits directly on
                the page, and a bordered, filled panel here drew a second box
                inside the comment section's own rule -- with the reply chip and
                the textarea each drawing a third and a fourth. */}
            {replyTo && (
                <div className="mb-3 flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm">
                  <span className="flex items-center gap-1.5 text-zinc-400 min-w-0">
                    <ReplyIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    Replying to
                    <strong className="text-zinc-200 truncate">{replyTo.displayName}</strong>
                  </span>
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="ml-2 flex-shrink-0 rounded-md p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all duration-300"
                  title="Cancel reply"
                  aria-label="Cancel reply"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* The contact form's field, exactly -- see `FIELD` in
                components/site/contact-form.tsx. */}
            <textarea
              ref={bodyRef}
              name="body"
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              placeholder="Share your thoughts…"
              required
              aria-label="Comment"
              className="w-full rounded-md border border-zinc-700 hover:border-zinc-400 px-3 py-2 focus:outline-none focus:border-zinc-400 bg-transparent placeholder-zinc-400 text-zinc-300 hover:text-zinc-200 transition-all duration-300 resize-y"
            />

            {/* The hint and the button keep the row they were in; only their
                treatment changes. */}
            <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-zinc-600">
                Markdown isn&rsquo;t supported — plain text only.
              </span>
              <button
                type="submit"
                disabled={pending}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-zinc-700 hover:border-zinc-400 bg-zinc-800 hover:bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-200 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <SendIcon />
                Post comment
              </button>
            </div>
          </form>

          <p className="-mt-6 mb-8 text-xs text-zinc-500">
            Signed in as <span className="text-zinc-400">{signedInAs}</span> ·{" "}
            <SignOutButton />
          </p>
        </>
      ) : (
        <div className="mb-8">
          <SignInPrompt />
        </div>
      )}

      <div className="divide-y divide-zinc-900">
        {section.comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-500">
            No comments yet. Be the first to share your thoughts.
          </p>
        ) : (
          section.comments.map((comment) => (
            <div className="py-5 first:pt-0" key={comment.id}>
              <Comment
                comment={comment}
                canReply={signedIn && canPost}
                onReply={(target) => {
                  setReplyTo(target);
                  bodyRef.current?.focus();
                }}
                onDelete={remove}
                busy={busy === comment.id}
              />

              {comment.replies.length > 0 && (
                /*
                  Thread rail. Each reply draws its own vertical segment and an
                  elbow into the avatar, so the line runs continuously down the
                  thread and stops at the last reply rather than dangling past
                  it. `left-[1.125rem]` is the centre of the parent's 2.25rem
                  avatar.
                */
                <div className="mt-3 space-y-3">
                  {comment.replies.map((reply, index) => (
                    <div
                      key={reply.id}
                      className={`relative pl-9 sm:pl-11
                        before:content-[''] before:absolute before:left-[1.125rem] before:top-0 before:w-px before:bg-zinc-700
                        ${index === comment.replies.length - 1 ? "before:h-4" : "before:bottom-[-0.75rem]"}
                        after:content-[''] after:absolute after:left-[1.125rem] after:top-4 after:h-px after:w-4 sm:after:w-6 after:bg-zinc-700`}
                    >
                      <Comment
                        comment={reply}
                        isReply
                        canReply={signedIn && canPost}
                        onReply={(target) => {
                          setReplyTo(target);
                          bodyRef.current?.focus();
                        }}
                        onDelete={remove}
                        busy={busy === reply.id}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function SignOutButton() {
  const confirm = useConfirm();
  return (
    <button
      type="button"
      onClick={async () => {
        const accepted = await confirm({
          title: "Sign out?",
          message: "You'll need to sign in again to post a comment.",
          label: "Sign out",
        });
        if (accepted) {
          const { signOutHere } = await import("@/lib/actions/auth");
          await signOutHere(window.location.pathname);
        }
      }}
      className="text-zinc-400 underline hover:text-zinc-200 transition-colors duration-300"
    >
      Sign out
    </button>
  );
}

/**
 * The signed-out state.
 *
 * Server-rendered in the page rather than a dialog or a browser prompt, and
 * offering the same two providers as the guestbook, so there is one sign-in
 * story across the site.
 */
/**
 * Said plainly, rather than by a form that fails on submit.
 *
 * Deliberately does not say who decided or why: the reader cannot change it
 * from here, and a reason is a conversation to have somewhere other than the
 * bottom of a blog post.
 */
function CannotPost() {
  return (
    <p className="mb-8 rounded-lg border border-zinc-800 px-4 py-3 text-sm text-zinc-400">
      Commenting is turned off for this account.
    </p>
  );
}

function SignInPrompt() {
  return (
    <div className="px-4 py-6 text-center">
      <ChatIcon className="mx-auto mb-3 h-6 w-6 text-zinc-600" />
      <p className="text-zinc-400 mb-4 text-sm sm:text-base">
        Sign in to join the conversation. Rest assured, your information is secure. See my{" "}
        <Link href="/privacy-policy" className="text-indigo-400 hover:text-indigo-300 underline">
          privacy policy
        </Link>{" "}
        for more.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <ProviderButton provider="google" label="Sign in with Google">
          <GoogleMark />
        </ProviderButton>
        <ProviderButton provider="github" label="Sign in with GitHub">
          <GitHubMark />
        </ProviderButton>
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
      onClick={() => signInWith(provider, window.location.pathname)}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-100 hover:border-indigo-500/70 hover:bg-zinc-800 transition-all duration-300 cursor-pointer"
    >
      {children}
      {label}
    </button>
  );
}

/** The guestbook's send glyph, so posting looks the same in both places. */
function SendIcon() {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
      aria-hidden="true"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
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
