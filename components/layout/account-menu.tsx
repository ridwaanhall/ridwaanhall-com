"use client";

import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { AccountChevronIcon } from "@/components/icons/nav-icons";
import { AvatarFallback } from "@/components/site/guestbook/role-badge";
import { ROLE_BLURB, ROLE_LABEL, type SiteRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils/cn";

/**
 * The account row at the base of the sidebar, and the menu behind it.
 *
 * The row is drawn to a nav item's geometry -- same inset, same corner, same
 * hover plate -- so it reads as the last entry in the sidebar's own list
 * rather than as a control bolted underneath it. What used to sit here was an
 * identity block with a second row of pills below it, which cost two rows and
 * put two session controls at the same weight as eight navigation links.
 *
 * The menu opens *upward*. It is the last thing in a column pinned to the
 * bottom of the window, so there is nowhere below it to open into.
 *
 * **The panel is hidden, never unmounted.** `SignOutButton` captures its form,
 * waits for the confirm dialog, and then calls `requestSubmit()` on it -- and
 * a form removed from the document in the meantime is one that call does
 * nothing to. Hiding keeps it in the document, and costs nothing in return:
 * the contents leave the tab order on their own, which is why nothing here
 * juggles `tabIndex` the way the drawer has to.
 *
 * It carries no `role="menu"`. That pattern obliges arrow-key navigation with
 * a roving tabindex, and claiming it without implementing it is worse for a
 * reader than not claiming it: these are two ordinary focusable elements and
 * Tab reaches them in the order they are written. The panel is therefore
 * written *after* the trigger even though it is drawn above it, so tabbing out
 * of the row goes into the menu rather than past it.
 */
export function AccountMenu({
  name,
  username,
  imageUrl,
  roles,
  children,
}: {
  name: string;
  username: string;
  /** Resolved on the server. A provider URL, or nothing if they have none. */
  imageUrl: string | null;
  /**
   * Every role this reader holds, most privileged first, or an empty array.
   *
   * A plain `string[]` because it crosses the server/client boundary, computed
   * in `AccountPanel` where the two sources are already loaded. Most readers
   * hold none, and then nothing is drawn.
   */
  roles: SiteRole[];
  /** The menu's rows: the admin link, and the form that signs out. */
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  // Provider avatars are somebody else's URL, and they do go away: an account
  // deleted at Google, a Gravatar that never existed, a network that refuses
  // the request. Left alone the browser draws its own broken-image glyph in a
  // 32px circle, which is worse than the stand-in this falls back to.
  const [imageBroken, setImageBroken] = useState(false);
  const panelId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Navigating closes it, the same way it closes the drawer -- otherwise the
  // menu is still hanging over the nav on the page it just opened. Adjusted
  // during render rather than from an effect, which is the drawer's own answer
  // to the same question: the close belongs to the render that already knows
  // the route changed, not to a second commit after it.
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    // Escape is the only dismissal that puts focus back. Pointing at something
    // else is already a statement about where attention has gone; pressing
    // Escape is a request to return to where it was.
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Opening lands on the first row, so the keyboard does not have to walk back
  // into a menu it just asked for. Harmless with a pointer: a programmatic
  // focus after a click does not draw a focus ring.
  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("a[href], button")?.focus();
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={trigger}
        type="button"
        data-account-menu
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        {imageUrl && !imageBroken ? (
          /* eslint-disable-next-line @next/next/no-img-element --
             avatars are arbitrary provider URLs; next/image needs every host
             allow-listed in advance and these are 32px, so optimising them
             would cost a round trip to save nothing. */
          <img
            src={imageUrl}
            alt=""
            width={32}
            height={32}
            loading="lazy"
            onError={() => setImageBroken(true)}
            className="avatar-ring w-8 h-8"
          />
        ) : (
          <AvatarFallback className="w-8 h-8" glyph="w-4 h-4" />
        )}

        {/* `min-w-0` is what lets the two lines truncate: without it this
            column takes its content's width and the rail's 248px are simply
            overrun by a long display name. */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm leading-tight text-zinc-200">{name}</div>
          <div className="truncate text-xs leading-tight text-zinc-500">@{username}</div>
          {/*
            A line of its own rather than chips beside the name. This column is
            about 170px once the avatar and the chevron have taken theirs, and
            two badges crowded onto the name line would truncate the display
            name that the row is mostly for.

            Outline only, no fill: `status-badges.tsx` sets the house rule for
            the sidebar -- nothing in this chrome shouts. The guestbook's own
            filled badge stays where it is, on a message header, where being
            loud is the point.
          */}
          {roles.length > 0 && (
            <div className="mt-1 flex flex-wrap items-center gap-1">
              {roles.map((role) => (
                <span
                  key={role}
                  title={ROLE_BLURB[role]}
                  className="pill-badge border border-zinc-700 px-1.5 py-0.5 text-[0.625rem] leading-none text-zinc-400"
                >
                  {ROLE_LABEL[role]}
                </span>
              ))}
            </div>
          )}
        </div>

        <AccountChevronIcon
          className={cn(
            "flex-shrink-0 text-zinc-500 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Activating any row closes the menu, caught here as the click bubbles
          rather than on each row: the rows are rendered on the server and
          handed down, so there is nothing on them to attach to. Keyboard
          activation bubbles a click too, and `preventDefault` on the sign-out
          button stops the submit, not the propagation -- so the confirm dialog
          opens over a closed menu rather than an open one. */}
      <div
        ref={panel}
        id={panelId}
        hidden={!open}
        onClick={() => setOpen(false)}
        className="absolute bottom-full left-0 right-0 z-20 mb-2 rounded-lg border border-zinc-700 bg-zinc-900 p-1"
      >
        {children}
      </div>
    </div>
  );
}
