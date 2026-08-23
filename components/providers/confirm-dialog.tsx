"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { useBodyScrollLock, useEscape, useModalTransition } from "@/lib/utils/use-modal";

/**
 * One confirmation dialog for the whole site.
 *
 * **Mounted at body level, outside `#page-content`**, for the reason given on
 * the notification stack: that element animates a transform, and a transformed
 * ancestor becomes the containing block for its `position: fixed` descendants,
 * so a dialog rendered inside it could only ever cover the content column and
 * would leave the sidebar unblurred.
 *
 * **Confirmation is one promise, not two modes.** A server-rendered page needs
 * two: one that posts the dialog's own form, and one that dispatches an event
 * for work done over fetch, which cannot navigate away without discarding the
 * state it just updated. Neither problem exists here -- every caller is already
 * a client component
 * doing its own work -- so a caller awaits a boolean instead:
 *
 *     const confirm = useConfirm();
 *     if (await confirm({ title: "Delete this message?", variant: "danger" })) ...
 *
 * That also removes the delegation the original needed. Triggers had to be
 * matched from `document` because the guestbook replaced its whole panel after
 * every post, so any handler bound at load would be left pointing at dead
 * nodes; a hook re-reads on every render by construction.
 */
export type ConfirmOptions = {
  title?: string;
  message?: string;
  /** The confirm button's label. */
  label?: string;
  /** A quoted excerpt of what is about to be acted on. Truncated at 240. */
  detail?: string;
  variant?: "neutral" | "danger";
};

/** Must match the `duration-300` on the root and the panel. */
const EXIT_MS = 300;
const DETAIL_MAX = 240;

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used inside <ConfirmDialogProvider>");
  return confirm;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  /*
   * `pending` is the open state and carries the promise's resolver; `options`
   * is what the markup reads. They are separate because the dialog stays in
   * the tree for its 300ms exit: resolving on the click and clearing `pending`
   * closes it immediately, while `options` keeps the wording on screen until
   * the animation has finished rather than blanking mid-fade.
   */
  const [pending, setPending] = useState<{ resolve: (value: boolean) => void } | null>(null);
  const [options, setOptions] = useState<ConfirmOptions>({});

  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setOptions(next);
        setPending((current) => {
          // A second request while one is open answers the first with `false`
          // rather than leaving its promise unsettled forever.
          current?.resolve(false);
          return { resolve };
        });
      }),
    [],
  );

  const settle = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const cancel = useCallback(() => settle(false), [settle]);
  const accept = useCallback(() => settle(true), [settle]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={pending !== null}
        options={options}
        onCancel={cancel}
        onConfirm={accept}
      />
    </ConfirmContext.Provider>
  );
}

const CONFIRM_BUTTON = {
  neutral: "border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800",
  danger: "border-red-800 bg-red-950/60 text-red-200 hover:border-red-500 hover:bg-red-900/50",
};
const ICON_SHELL = {
  neutral: "border-zinc-700 bg-zinc-900",
  danger: "border-red-900/60 bg-red-950/40",
};
const ICON_GLYPH = { neutral: "text-zinc-300", danger: "text-red-400" };

function ConfirmDialog({
  isOpen,
  options,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  options: ConfirmOptions;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { mounted, shown } = useModalTransition(isOpen, EXIT_MS);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const variant = options.variant ?? "neutral";

  useBodyScrollLock(mounted);
  useEscape(isOpen, onCancel);

  /*
   * Focus Cancel, never Confirm. A stray Enter must not carry out a
   * destructive action the reader only meant to look at -- the original was
   * explicit about this and it is the easiest thing here to get wrong.
   */
  useEffect(() => {
    if (mounted && isOpen) cancelRef.current?.focus();
  }, [mounted, isOpen]);

  if (!mounted) return null;

  const detail =
    options.detail && options.detail.length > DETAIL_MAX
      ? `${options.detail.slice(0, DETAIL_MAX)}…`
      : (options.detail ?? "");

  return (
    <div
      id="confirm-dialog"
      className={`fixed inset-0 z-50 transition-all duration-300 ease-out ${
        shown ? "backdrop-blur-md" : "backdrop-blur-none pointer-events-none"
      }`}
    >
      {/* Backdrop dismissal, as the search palette does it. Escape covers the
          keyboard, so this needs no key handler of its own. */}
      <div className="flex min-h-full items-center justify-center p-4" onClick={onCancel}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className={`relative mx-auto max-w-md w-full overflow-hidden rounded-xl border-2 border-zinc-800 bg-black ring-1 ring-black/5 p-5 transition-all duration-300 ease-out ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${ICON_SHELL[variant]}`}
            >
              <svg
                className={`h-5 w-5 ${ICON_GLYPH[variant]}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M5.07 19h13.86a2 2 0 001.74-3L13.74 4a2 2 0 00-3.48 0L3.33 16a2 2 0 001.74 3z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 id="confirm-dialog-title" className="text-base font-semibold text-zinc-100">
                {options.title ?? "Are you sure?"}
              </h3>
              {options.message && <p className="mt-1 text-sm text-zinc-400">{options.message}</p>}
            </div>
          </div>

          {detail && (
            <blockquote className="mt-4 max-h-24 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-400 italic break-words whitespace-pre-line">
              {detail}
            </blockquote>
          )}

          <div className="mt-5 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800 transition-all duration-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`rounded-lg border px-4 py-2 text-sm transition-all duration-300 ${CONFIRM_BUTTON[variant]}`}
            >
              {options.label ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
