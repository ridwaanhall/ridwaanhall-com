"use client";

/**
 * One notification toast -- the single definition of this markup for the whole
 * site, as `templates/components/_toast.html` was.
 *
 * Django replaced five separate copies of the same green/red/blue strip with
 * that partial: the message blocks on the guestbook, comments and contact
 * pages, plus `showLoginMessage()` and `showMessage()`, two hand-rolled JS
 * builders. The palette lives here, in one table, for the same reason it lived
 * in the partial: adding a variant must be a one-file change.
 *
 * Colour is carried by the border and the text over an **opaque** `bg-zinc-900`
 * rather than by a translucent tint -- a toast floats over arbitrary page
 * content, so a `/20` fill would composite against whatever happens to be
 * behind it. The variant is also stated in words for a screen reader, since
 * colour alone cannot carry it.
 */
export type ToastVariant = "success" | "error" | "info";

const VARIANTS: Record<ToastVariant, { className: string; word: string }> = {
  success: { className: "border-green-700 text-green-300", word: "Success:" },
  error: { className: "border-red-700 text-red-300", word: "Error:" },
  info: { className: "border-blue-700 text-blue-300", word: "Note:" },
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
  const { className, word } = VARIANTS[variant];

  return (
    <div
      className={`notify-toast pointer-events-auto flex w-full items-start gap-3 rounded-lg border bg-zinc-900 px-4 py-3 text-sm ${className}`}
      role="status"
    >
      <span className="sr-only">{word}</span>
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="-mr-1 flex-shrink-0 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
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
