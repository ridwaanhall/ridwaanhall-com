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

// The site's own buttons: Cancel is the outlined one, Confirm the solid one.
// Something that cannot be undone says so in its label and carries the
// trash glyph rather than a colour -- the interface adds no hue of its own.
const CONFIRM_ICON = { neutral: null, danger: "trash" } as const;

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
        shown ? "bg-[var(--fh-scrim)] backdrop-blur-[4px]" : "backdrop-blur-none pointer-events-none"
      }`}
    >
      {/* Backdrop dismissal, as the search palette does it. Escape covers the
          keyboard, so this needs no key handler of its own. */}
      <div className="flex min-h-full items-start justify-center p-4 pt-[max(16px,26vh)]" onClick={onCancel}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className={`relative mx-auto grid w-full max-w-[440px] gap-2.5 overflow-hidden rounded-[10px] border border-zinc-700 bg-paper p-6 font-text transition-all duration-300 ease-out ${
            shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-2.5 scale-[0.97] opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <h3
            id="confirm-dialog-title"
            className="font-display text-[1.3rem] leading-tight font-medium tracking-[-0.02em] text-ink"
          >
            {options.title ?? "Are you sure?"}
          </h3>
          {options.message && <p className="text-[15px] leading-relaxed text-mute">{options.message}</p>}

          {detail && (
            <blockquote className="mt-2 max-h-24 overflow-y-auto rounded-md border border-line bg-raise px-3 py-2 text-sm text-mute italic break-words whitespace-pre-line">
              {detail}
            </blockquote>
          )}

          <div className="mt-2.5 flex flex-wrap justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 cursor-pointer items-center rounded-lg border border-zinc-700 px-[18px] text-[14.5px] font-medium text-ink transition-colors hover:border-ink"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-ink bg-ink px-[18px] text-[14.5px] font-medium text-paper transition-opacity hover:opacity-85"
            >
              {CONFIRM_ICON[variant] && <Icon name={CONFIRM_ICON[variant]} size={16} />}
              {options.label ?? "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
