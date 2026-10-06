"use client";

import { Icon, type IconName } from "@/components/foothill/icons";
import { cn } from "@/lib/utils/cn";

/**
 * One notification toast -- the single definition of this markup for the whole
 * site, the admin's saves and the public forms alike.
 *
 * Drawn in the site's own vocabulary: a raised paper card with a hairline
 * border, the message in Funnel Sans at reading size, and a small round mark
 * that says which kind it is before the words do. The surface is **opaque** --
 * a toast floats over arbitrary content, so a translucent fill would composite
 * against whatever happens to be behind it.
 *
 * The line along the bottom runs down for as long as the toast will stay, and
 * holds while the stack is pointed at, as sonner holds the timer itself
 * (`.notify-time` in styles/animations.css). The kind is also stated in words
 * for a screen reader, since a colour and a glyph cannot carry it alone.
 */
export type ToastVariant = "success" | "error" | "info";

const VARIANTS: Record<ToastVariant, { icon: IconName; mark: string; time: string; word: string }> = {
  success: { icon: "check", mark: "bg-ink text-paper", time: "bg-ink", word: "Success:" },
  error: { icon: "alert", mark: "bg-red-500/15 text-red-400", time: "bg-red-500", word: "Error:" },
  info: { icon: "info", mark: "bg-line text-ink", time: "bg-mute", word: "Note:" },
};

export function Toast({
  variant,
  duration,
  onDismiss,
  children,
}: {
  variant: ToastVariant;
  /** How long it stays, in ms, which the line along the bottom counts down. */
  duration: number;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const { icon, mark, time, word } = VARIANTS[variant];

  return (
    <div
      className="notify-toast pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-[14px] border border-line bg-raise py-3 pr-2.5 pl-3.5 font-text text-ink"
      role="status"
      style={{ "--notify-ms": `${duration}ms` } as React.CSSProperties}
    >
      <span className={cn("mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full", mark)}>
        <Icon name={icon} strokeWidth={2} className="h-3.5 w-3.5" />
      </span>
      <span className="sr-only">{word}</span>
      <span className="min-w-0 flex-1 pt-0.5 text-[14px] leading-snug break-words [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="-my-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-mute transition-colors hover:bg-line hover:text-ink"
        aria-label="Dismiss"
      >
        <Icon name="close" className="h-4 w-4" />
      </button>
      <span aria-hidden="true" className={cn("notify-time absolute inset-x-0 bottom-0 h-[2px] origin-left", time)} />
    </div>
  );
}
