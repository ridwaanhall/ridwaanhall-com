"use client";

/**
 * One notification toast -- the single definition of this markup for the whole
 * site.
 *
 * The alternative is the same green/red/blue strip copied into the guestbook,
 * comments and contact pages, plus a hand-rolled JS builder or two. The palette
 * lives here in one table so that adding a variant is a one-file change.
 *
 * Colour is carried by a dot and the text over an **opaque** `bg-zinc-900`
 * rather than by a translucent tint -- a toast floats over arbitrary page
 * content, so a `/20` fill would composite against whatever happens to be
 * behind it. A dot rather than a coloured border: it is the same signal every
 * other status on the site uses, and the fill alone already lifts the toast
 * off the page. The variant is also stated in words for a screen reader,
 * since colour alone cannot carry it.
 */
export type ToastVariant = "success" | "error" | "info";

const VARIANTS: Record<ToastVariant, { className: string; dot: string; word: string }> = {
  success: { className: "text-green-300", dot: "bg-green-400", word: "Success:" },
  error: { className: "text-red-300", dot: "bg-red-400", word: "Error:" },
  info: { className: "text-blue-300", dot: "bg-blue-400", word: "Note:" },
};

export function Toast({
  variant,
  onDismiss,
  children,
}: {
  variant: ToastVariant;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const { className, dot, word } = VARIANTS[variant];

  return (
    <div
      className={`notify-toast pointer-events-auto flex w-full items-start gap-3 rounded-2xl bg-zinc-900 px-4 py-3 text-sm ${className}`}
      role="status"
    >
      <span aria-hidden="true" className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${dot}`} />
      <span className="sr-only">{word}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="-mr-1 flex-shrink-0 cursor-pointer rounded-full p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        title="Dismiss"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
