"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { initials } from "@/components/foothill/ui";
import { ROLE_BLURB, ROLE_LABEL, type SiteRole } from "@/lib/auth/roles";
import { sizedAvatar } from "@/lib/site/display";

/**
 * The signed-in reader's avatar and the menu under it: who they are, their
 * messages, the admin if they are staff, and signing out.
 *
 * The button is the avatar alone; the handle with its `@` is in it as text for
 * a screen reader (and for `scripts/check-account-panel.mjs`), so the bar
 * stays one circle wide. Ending a session takes a deliberate second step.
 */
export function AccountMenu({
  name,
  username,
  imageUrl,
  role,
  children,
}: {
  name: string;
  username: string;
  imageUrl: string | null;
  role: SiteRole;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();
  const [openedAt, setOpenedAt] = useState(pathname);

  // A navigation closes the menu. Adjusted during render rather than in an
  // effect, so the panel never paints open over the page it led to.
  if (open && openedAt !== pathname) {
    setOpen(false);
    setOpenedAt(pathname);
  }

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="acct">
      <button
        ref={trigger}
        type="button"
        className="av-btn"
        data-account-menu
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`Account menu, ${name} @${username}`}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen((value) => !value);
        }}
      >
        <Avatar name={name} src={imageUrl} size={32} />
        <span className="sr">@{username}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            key="menu"
            id={id}
            ref={panel}
            role="menu"
            className="menu-pop"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
          >
            <div className="mp-head">
              <b>{name}</b>
              <span className="mono mute">@{username}</span>
              <span style={{ marginTop: 6 }} title={ROLE_BLURB[role]}>
                <span className={role === "public" ? "tag" : "tag solid"}>{ROLE_LABEL[role]}</span>
              </span>
            </div>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** A provider's picture, or the initials on a grey disc when there is none. */
export function Avatar({ name, src, size = 36 }: { name: string; src: string | null; size?: number }) {
  const box = { width: size, height: size, fontSize: Math.round(size / 3) };
  if (!src)
    return (
      <span className="av" style={box} aria-hidden="true">
        {initials(name)}
      </span>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element -- provider avatars, any host
    <img className="av" src={sizedAvatar(src, size * 2)} alt="" width={size} height={size} style={{ ...box, objectFit: "cover" }} />
  );
}
