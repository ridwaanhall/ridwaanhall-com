"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState } from "react";

import { Icon, type IconName } from "@/components/foothill/icons";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils/cn";

/*
 * The controls that keep state: the sliding pill under a filter or a switch,
 * the disclosure that opens to its own height, the copy button that turns to
 * a tick. Framer Motion draws all of them; `MotionConfig reducedMotion="user"`
 * in the shell turns the movement off for a reader who asks.
 */

export const EASE = [0.2, 0.8, 0.2, 1] as const;
export const SPRING = { type: "spring", stiffness: 380, damping: 32 } as const;

/** A button that runs code: the filled or outlined look, giving under a press. */
export function ActionButton({
  icon,
  ghost,
  sm,
  wide,
  type = "button",
  disabled,
  onClick,
  className,
  children,
  ...rest
}: {
  icon?: IconName | React.ReactNode;
  ghost?: boolean;
  sm?: boolean;
  wide?: boolean;
  type?: "button" | "submit";
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "children" | "className">) {
  return (
    <motion.button
      type={type}
      className={cn("btn", ghost && "ghost", sm && "sm", wide && "wide", className)}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 600, damping: 30 }}
      {...(rest as object)}
    >
      {typeof icon === "string" ? <Icon name={icon as IconName} /> : icon}
      {children}
    </motion.button>
  );
}

/** Filter chips: the black pill slides to the chosen one. */
export function Chips<T extends string>({
  items,
  value,
  onChange,
  id,
  label,
}: {
  items: [T, string, number?][];
  value: T;
  onChange: (value: T) => void;
  id: string;
  label?: string;
}) {
  return (
    <div className="chips" role="toolbar" aria-label={label}>
      {items.map(([key, text, count]) => (
        <button
          key={key}
          type="button"
          className={cn("chip", value === key && "on")}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {value === key && <motion.span className="bgpill" layoutId={`chip-${id}`} transition={SPRING} />}
          <span>{text}</span>
          {count != null && <span className="n">{count}</span>}
        </button>
      ))}
    </div>
  );
}

/** A chip that is on or off by itself, beside the filter row. */
export function ToggleChip({
  on,
  onChange,
  icon,
  children,
}: {
  on: boolean;
  onChange: (on: boolean) => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button type="button" className={cn("chip", on && "on")} aria-pressed={on} onClick={() => onChange(!on)}>
      {on && <span className="bgpill" />}
      {icon}
      <span>{children}</span>
    </button>
  );
}

/** A segmented switch: the grey pill slides between two or three options. */
export function Seg<T extends string>({
  items,
  value,
  onChange,
  id,
  label,
}: {
  items: [T, string, IconName?][];
  value: T;
  onChange: (value: T) => void;
  id: string;
  label?: string;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([key, text, icon]) => (
        <button
          key={key}
          type="button"
          className={value === key ? "on" : undefined}
          aria-pressed={value === key}
          onClick={() => onChange(key)}
        >
          {value === key && <motion.span className="bgpill" layoutId={`seg-${id}`} transition={SPRING} />}
          {icon && <Icon name={icon} size={14} />}
          {text}
        </button>
      ))}
    </div>
  );
}

/**
 * A row that opens to its own height: the plus turns to a minus and the body
 * eases open. `inline` is the small version that sits inside a block.
 */
export function Disclosure({
  label,
  right,
  inline,
  open: initial = false,
  children,
}: {
  label: React.ReactNode;
  right?: React.ReactNode;
  inline?: boolean;
  open?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(initial);
  const id = useId();
  return (
    <div className={inline ? "inline-disc" : undefined}>
      <button type="button" className="disc-btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {inline ? (
          <>
            <motion.span className="pm" animate={{ rotate: open ? 180 : 0 }} transition={SPRING}>
              <Icon name={open ? "minus" : "plus"} size={12} />
            </motion.span>
            <span>{label}</span>
          </>
        ) : (
          <>
            <span style={{ minWidth: 0, flex: 1 }}>{label}</span>
            {right}
            <motion.span className="pm" animate={{ rotate: open ? 180 : 0 }} transition={SPRING}>
              <Icon name={open ? "minus" : "plus"} size={14} />
            </motion.span>
          </>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            key="body"
            className="disc-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Copy something; the copy icon becomes a tick for a moment. */
export function CopyButton({
  text,
  label,
  sm,
  message = "Copied to the clipboard",
}: {
  text: string;
  label: React.ReactNode;
  sm?: boolean;
  message?: string;
}) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setDone(false), 1600);
    return () => clearTimeout(timer);
  }, [done]);
  const copy = () =>
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        setDone(true);
        notify(message, "success");
      })
      .catch(() => notify("The clipboard is not available here", "error"));
  return (
    <motion.button
      type="button"
      className={cn("btn ghost", sm && "sm")}
      onClick={copy}
      whileTap={{ scale: 0.97 }}
      aria-live="polite"
    >
      <span>{label}</span>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={done ? "done" : "copy"}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.18 }}
          style={{ display: "grid" }}
        >
          <Icon name={done ? "check" : "copy"} />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

/** Try again: the icon spins while it asks. */
export function RetryButton({ onRetry, busy: external }: { onRetry: () => void; busy?: boolean }) {
  const [own, setOwn] = useState(false);
  const busy = external ?? own;
  return (
    <motion.button
      type="button"
      className="btn ghost sm"
      whileTap={{ scale: 0.96 }}
      disabled={busy}
      onClick={() => {
        setOwn(true);
        onRetry();
        setTimeout(() => setOwn(false), 900);
      }}
    >
      <motion.span
        style={{ display: "grid" }}
        animate={busy ? { rotate: 360 } : { rotate: 0 }}
        transition={busy ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
      >
        <Icon name="refresh" />
      </motion.span>
      {busy ? "Asking again" : "Try again"}
    </motion.button>
  );
}

/** Jakarta's time, the digits rolling as they change. */
export function LocalClock({ offsetMinutes = 7 * 60 }: { offsetMinutes?: number }) {
  const read = () => {
    const now = new Date(Date.now() + (offsetMinutes + new Date().getTimezoneOffset()) * 60_000);
    return now.toTimeString().slice(0, 5);
  };
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    // Read after mount: the server's clock is not the reader's moment, and a
    // cached page would freeze whatever minute it was rendered in.
    const tick = () => setTime(read());
    tick();
    const timer = setInterval(tick, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!time) return <span className="clock num">--:--</span>;
  return (
    <span className="clock num">
      {[...time].map((char, index) => (
        <AnimatePresence mode="popLayout" initial={false} key={index}>
          <motion.span
            key={char + index}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            {char}
          </motion.span>
        </AnimatePresence>
      ))}
    </span>
  );
}
