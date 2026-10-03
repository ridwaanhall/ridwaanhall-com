"use client";

import { useId, useRef, useState } from "react";

import { Icon } from "@/components/foothill/icons";
import { usePresence } from "@/lib/motion/use-presence";
import { cn } from "@/lib/utils/cn";

/**
 * A region that grows open and folds shut, rather than appearing.
 *
 * It measures nothing itself: GSAP tweens the height to `auto` and back, so
 * content that wraps differently at another width still opens to its own
 * height. Closed, it is `hidden`, so what is folded away is out of the tab
 * order and the accessibility tree as well as off the screen.
 */
export function Expand({
  open,
  id,
  className,
  children,
}: {
  open: boolean;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const shown = usePresence(open, ref, {
    enter: (tl, el) =>
      tl.fromTo(
        el,
        { height: 0, autoAlpha: 0 },
        { height: "auto", autoAlpha: 1, duration: 0.55, ease: "expo.out", clearProps: "height,opacity,visibility" },
      ),
    exit: (tl, el) => tl.to(el, { height: 0, autoAlpha: 0, duration: 0.4, ease: "power3.inOut" }),
  });

  return (
    <div id={id} ref={ref} hidden={!shown} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}

/**
 * A disclosure: a row that opens what is under it.
 *
 * Instead of `<details>`, which can only snap: the summary is a real button
 * with `aria-expanded`, and the body is an `Expand`. The round plus beside the
 * summary turns into a cross while it is open -- it reads the button's
 * `aria-expanded`, through the `trigger` group, so nothing else on the page
 * that happens to be a `group` can turn it.
 */
export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  plain = false,
  className,
  summaryClassName,
}: {
  summary: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  /** A small inline toggle ("What I did") rather than a full-width row. */
  plain?: boolean;
  className?: string;
  summaryClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group/trigger cursor-pointer text-left",
          plain
            ? "inline-flex items-center gap-2 text-[14px] font-medium text-ink"
            : "flex w-full items-center justify-between gap-4",
          summaryClassName,
        )}
      >
        {plain && <Icon name="plus" className="h-3.5 w-3.5 transition-transform duration-500 group-aria-expanded/trigger:rotate-45" />}
        {summary}
        {!plain && (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-[transform,background-color,border-color] duration-500 group-hover/trigger:border-ink group-aria-expanded/trigger:rotate-45 group-aria-expanded/trigger:bg-raise"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
          </span>
        )}
      </button>
      <Expand open={open} id={id}>
        {children}
      </Expand>
    </div>
  );
}
