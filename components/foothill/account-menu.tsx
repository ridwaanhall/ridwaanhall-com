"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/foothill/icons";
import { ROLE_BLURB, ROLE_LABEL, type SiteRole } from "@/lib/auth/roles";
import { usePresence } from "@/lib/motion/use-presence";
import { cn } from "@/lib/utils/cn";

/**
 * The signed-in reader's menu: who they are, and the two things they can do
 * from here -- open the admin if they are staff, and sign out.
 *
 * The trigger carries the handle with its `@`, which is what tells a reader at
 * a glance which account this browser is signed in as (and what
 * `scripts/check-account-panel.mjs` looks for). The panel opens on demand
 * rather than showing sign-out in the bar, because ending a session should
 * take a deliberate second step.
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

  const shown = usePresence(open, panel, {
    enter: (tl, el) =>
      tl.fromTo(
        el,
        { y: -8, scale: 0.97, autoAlpha: 0, transformOrigin: "100% 0%" },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.35, ease: "expo.out", clearProps: "transform,opacity,visibility" },
      ),
    exit: (tl, el) =>
      tl.to(el, { y: -6, scale: 0.97, autoAlpha: 0, duration: 0.22, ease: "power2.in" }),
  });

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
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        data-account-menu
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => {
          setOpenedAt(pathname);
          setOpen((value) => !value);
        }}
        className="flex cursor-pointer items-center gap-2 rounded-full py-1 pr-1 pl-1 text-[14px] text-mute transition-colors hover:text-ink"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- provider avatars, any host
          <img src={imageUrl} alt="" width={24} height={24} className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-raise text-[11px] text-ink">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="max-w-[9rem] truncate text-[14px]">@{username}</span>
        <Icon name="chevron-down" className={cn("h-3.5 w-3.5 transition-transform duration-500", open && "rotate-180")} />
      </button>

      <div
        id={id}
        ref={panel}
        role="menu"
        hidden={!shown}
        className={cn(
          "absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-[16px] border border-line bg-paper p-2 text-ink",
        )}
      >
        <div className="border-b border-line px-3 pt-2 pb-3">
          <p className="truncate text-[15px] font-medium">{name}</p>
          <p className="mt-1 text-[13px] text-mute" title={ROLE_BLURB[role]}>
            {ROLE_LABEL[role]}
          </p>
        </div>
        <div className="flex flex-col pt-1.5">{children}</div>
      </div>
    </div>
  );
}

