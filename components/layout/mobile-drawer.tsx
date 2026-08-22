"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { NavLinks } from "@/components/layout/nav-links";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { SearchTrigger } from "@/components/layout/search-trigger";
import { SidebarFooter } from "@/components/layout/sidebar-footer";
import { StatusBadges } from "@/components/layout/status-badges";
import type { AboutData } from "@/lib/data/about";
import { cn } from "@/lib/utils/cn";

/**
 * The mobile navigation drawer.
 *
 * **It has no close button.** It is dismissed three ways -- dragged down,
 * backdrop tap, or Escape -- and this component owns all three. The X button
 * and the drawer-footer theme toggle were both removed deliberately: the
 * navbar already carries a toggle that stays reachable whether the drawer is
 * open or shut.
 */

/** Drag past this share of the drawer's own height and release closes it.
 *  Proportional rather than a pixel count so a short drawer is not
 *  disproportionately hard to dismiss. */
const CLOSE_FRACTION = 0.25;
/** A quick flick closes even when it never travelled that far. */
const FLICK_VELOCITY = 0.5; // px per ms
/** Ignore taps, which are fast but go nowhere. */
const FLICK_MIN_DISTANCE = 12;
/** Must match the `duration-300` on the panel. */
const EXIT_MS = 300;

export function MobileDrawer({
  about,
  adminLink,
  isOpen,
  onClose,
}: {
  about: AboutData;
  adminLink?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startY: 0, startTime: 0, offset: 0 });
  const pathname = usePathname();

  /*
   * Two pieces of state, because the drawer has to stay on screen while it
   * leaves. `visible` is whether the backdrop is in the layout at all;
   * `raised` is whether the panel is up.
   *
   * The port previously had only the second. Closing dropped `hidden` back on
   * the backdrop in the same commit that reset the panel's transform, so the
   * whole drawer vanished on the spot -- there was no exit animation, which is
   * exactly what the original spent a 300ms timeout avoiding.
   *
   * Both transitions start as adjustments during render rather than from an
   * effect: opening has to put the panel in the layout on this render, and
   * closing has to start the slide on this one. Only the *timing* is left in
   * effects -- a frame for the browser to paint the down position before
   * animating up, and the wait for the slide down to finish.
   */
  const [visible, setVisible] = useState(isOpen);
  const [raised, setRaised] = useState(false);

  if (isOpen && !visible) setVisible(true);
  if (!isOpen && raised) setRaised(false);

  useEffect(() => {
    if (isOpen) {
      // Two frames, not one: a single rAF callback runs *before* the paint of
      // the frame it was queued in, so the browser can still coalesce the
      // panel's arrival and its raise into one paint and skip the transition
      // entirely. The second frame guarantees the down position was painted.
      let second = 0;
      const first = requestAnimationFrame(() => {
        second = requestAnimationFrame(() => setRaised(true));
      });
      return () => {
        cancelAnimationFrame(first);
        cancelAnimationFrame(second);
      };
    }
    const id = window.setTimeout(() => setVisible(false), EXIT_MS);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  // Scroll lock for as long as anything is on screen, so the page underneath
  // does not lurch back mid-slide.
  useEffect(() => {
    if (!visible) return;
    document.body.classList.add("overflow-hidden");
    return () => document.body.classList.remove("overflow-hidden");
  }, [visible]);

  // Escape is the only keyboard dismissal now that the close button is gone.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Navigating closes it -- otherwise tapping a nav link leaves the drawer
  // covering the page it just opened.
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  /** Hand the drawer back to CSS. Clearing the inline transform in the *same*
   *  synchronous block as the close means the class's own 300ms transition
   *  carries it on from wherever the finger left it, instead of snapping to 0
   *  first. */
  const settle = useCallback(
    (shouldClose: boolean) => {
      const menu = menuRef.current;
      if (menu) {
        menu.style.transition = "";
        menu.style.transform = "";
      }
      if (shouldClose) onClose();
    },
    [onClose],
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Never start a drag on something the reader meant to press -- the status
    // badges in the header are a link.
    if (event.button !== 0 || (event.target as HTMLElement).closest("a, button, input")) return;

    drag.current = { active: true, startY: event.clientY, startTime: event.timeStamp, offset: 0 };
    // Transitions off for the duration: the drawer has to sit under the finger,
    // not chase it 300ms behind.
    if (menuRef.current) menuRef.current.style.transition = "none";
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* capture is an improvement, not a requirement -- a failure here must not
         abort the drag and strand the drawer with its transitions off */
    }
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    // Downward only. Rubber-banding upward would suggest the drawer can be
    // expanded, and it cannot.
    drag.current.offset = Math.max(0, event.clientY - drag.current.startY);
    if (menuRef.current) {
      menuRef.current.style.transform = `translateY(${drag.current.offset}px)`;
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    drag.current.active = false;

    const elapsed = Math.max(1, event.timeStamp - drag.current.startTime);
    const offset = drag.current.offset;
    const flicked = offset > FLICK_MIN_DISTANCE && offset / elapsed > FLICK_VELOCITY;
    // Read the height before settle() touches any style, so the measurement is
    // not what flushes the pending transform.
    const travelled = offset > (menuRef.current?.offsetHeight ?? 0) * CLOSE_FRACTION;

    settle(flicked || travelled);
  };

  const onPointerCancel = () => {
    if (!drag.current.active) return;
    drag.current.active = false;
    settle(false);
  };

  const handleProps = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    "data-drawer-handle": true,
  };

  return (
    <div
      id="mobile-sidebar"
      className={cn(
        "fixed inset-0 z-40 bg-transparent bg-opacity-60 backdrop-blur-sm md:hidden",
        !visible && "hidden",
      )}
      aria-hidden={!isOpen}
      // Anything above the drawer is backdrop.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={menuRef}
        id="mobile-menu"
        className={cn(
          "fixed inset-x-0 bottom-0 w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-black transition-transform duration-300 ease-out transform flex flex-col border-t border-zinc-800",
          // `will-change` keeps the panel on its own compositor layer for the
          // whole gesture rather than being promoted the moment it starts to
          // move, which is what made the first few frames of the slide stutter.
          "will-change-transform",
          !raised && "translate-y-full",
        )}
      >
        {/* `touch-none` on both drag zones is load-bearing, not styling:
            #mobile-menu is overflow-y-auto, so without it the browser claims a
            vertical drag as a scroll and the pointermove handler never runs. */}
        <div
          className="w-full flex justify-center pt-3 pb-3 touch-none select-none cursor-grab active:cursor-grabbing"
          {...handleProps}
        >
          <div className="w-12 h-1.5 bg-zinc-700 rounded-full" />
        </div>

        <div
          className="flex items-center justify-between px-5 pb-5 mb-2 touch-none select-none cursor-grab active:cursor-grabbing"
          {...handleProps}
        >
          <div className="flex items-center">
            <ProfileAvatar src={about.image_url} name={about.name} size={48} />
            <div className="ml-3">
              <span className="text-xl font-semibold">{about.name}</span>
              <div className="flex flex-col gap-1">
                <p className="text-xs text-zinc-400 hover:text-zinc-300">@{about.username}</p>
              </div>
              <StatusBadges about={about} variant="drawer" />
            </div>
          </div>
        </div>

        {/* tabIndex -1 keeps the drawer's controls out of the tab order while it
            is closed, matching the Django markup. */}
        <SearchTrigger tabIndex={isOpen ? 0 : -1} />
        <NavLinks tabIndex={isOpen ? 0 : -1} />
        <SidebarFooter about={about} adminLink={adminLink} />
      </div>
    </div>
  );
}
