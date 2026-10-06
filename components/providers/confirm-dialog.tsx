"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/foothill/icons";
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

// The site's own buttons: Cancel is the outlined one, Confirm the solid one --
// or, for something that cannot be undone, the same red the error toast uses.
const CONFIRM_BUTTON = {
  neutral: "bg-ink text-paper hover:opacity-85",
  danger: "border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20",
};
const ICON_MARK = { neutral: "bg-line text-ink", danger: "bg-red-500/15 text-red-400" };

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
        shown ? "bg-[var(--fh-scrim)] backdrop-blur-sm" : "backdrop-blur-none pointer-events-none"
      }`}
    >
      {/* Backdrop dismissal, as the search palette does it. Escape covers the
          keyboard, so this needs no key handler of its own. */}
      <div className="flex min-h-full items-center justify-center p-4" onClick={onCancel}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className={`relative mx-auto w-full max-w-md overflow-hidden rounded-[18px] border border-line bg-paper p-6 font-text transition-all duration-300 ease-out ${
            shown ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${ICON_MARK[variant]}`}
            >
              <Icon name="alert" strokeWidth={1.8} className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0 pt-0.5">
              <h3
                id="confirm-dialog-title"
                className="font-display text-[19px] leading-snug font-medium tracking-[-0.015em] text-ink"
              >
                {options.title ?? "Are you sure?"}
              </h3>
              {options.message && <p className="mt-1.5 text-[14px] leading-relaxed text-mute">{options.message}</p>}
            </div>
          </div>

          {detail && (
            <blockquote className="mt-4 max-h-24 overflow-y-auto rounded-lg border border-line bg-raise px-3 py-2 text-sm text-mute italic break-words whitespace-pre-line">
              {detail}
            </blockquote>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-[opacity,background-color] ${CONFIRM_BUTTON[variant]}`}
            >
              {options.label ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
