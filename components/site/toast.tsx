"use client";

import { Icon, type IconName } from "@/components/foothill/icons";
import { cn } from "@/lib/utils/cn";

/**
 * One notification toast -- the single definition of this markup for the whole
 * site, the admin's saves and the public forms alike.
 *
 * An ink chip: the theme turned over, so it reads against any page without a
 * colour of its own. A small mark says which kind it is before the words do,
 * and an error's mark is the one place a hue appears, because failure is the
 * message a reader must not miss. The surface is opaque -- a toast floats over
 * arbitrary content.
 *
 * The line along the bottom runs down for as long as the toast will stay, and
 * holds while the stack is pointed at, as sonner holds the timer itself
 * (`.notify-time` in styles/animations.css). The kind is also stated in words
 * for a screen reader, since a glyph cannot carry it alone.
 */
export type ToastVariant = "success" | "error" | "info";

const VARIANTS: Record<ToastVariant, { icon: IconName; mark: string; word: string }> = {
  success: { icon: "check", mark: "text-paper", word: "Success:" },
  error: { icon: "alert", mark: "text-red-400", word: "Error:" },
  info: { icon: "info", mark: "text-paper", word: "Note:" },
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
  const { icon, mark, word } = VARIANTS[variant];

  return (
    <div
      className="notify-toast pointer-events-auto relative flex w-full items-center gap-2.5 overflow-hidden rounded-lg bg-ink py-2.5 pr-1.5 pl-4 font-text text-paper"
      role="status"
      style={{ "--notify-ms": `${duration}ms` } as React.CSSProperties}
    >
      <span className={cn("flex shrink-0", mark)}>
        <Icon name={icon} size={16} />
      </span>
      <span className="sr-only">{word}</span>
      <span className="min-w-0 flex-1 text-[14px] leading-snug font-medium break-words [&_a]:underline [&_a]:underline-offset-2">
        {children}
      </span>
      <button
        type="button"
        onClick={onDismiss}
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-paper/70 transition-colors hover:text-paper"
        aria-label="Dismiss"
      >
        <Icon name="x" size={15} />
      </button>
      <span aria-hidden="true" className="notify-time absolute inset-x-0 bottom-0 h-[2px] origin-left bg-paper/40" />
    </div>
  );
}
