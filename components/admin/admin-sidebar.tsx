"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  ArticleIcon,
  BriefcaseIcon,
  ChatIcon,
  ChevronIcon,
  CloseIcon,
  CommentIcon,
  CubeIcon,
  MenuIcon,
  PersonIcon,
  RailIcon,
  ScaleIcon,
  SlidersIcon,
  SquaresIcon,
  UsersIcon,
} from "@/components/admin/admin-icons";
import {
  ADMIN_ENTRIES,
  ADMIN_ENTRIES_BY_KEY,
  ADMIN_GROUPS,
  entriesInGroup,
  type AdminGroup,
} from "@/lib/admin/registry";
import { cn } from "@/lib/utils/cn";
import { useOutsidePointer, usePopoverPosition } from "@/lib/utils/use-popover";

const GROUP_ICON: Record<AdminGroup, typeof PersonIcon> = {
  About: PersonIcon,
  Blog: ArticleIcon,
  Projects: CubeIcon,
  "Open to work": BriefcaseIcon,
  Legal: ScaleIcon,
  Guestbook: ChatIcon,
  Comments: CommentIcon,
  Users: UsersIcon,
  Settings: SlidersIcon,
};

/**
 * The `lg` breakpoint, as this file's JavaScript sees it.
 *
 * The rail's *width* is Tailwind's job and needs no JavaScript. This is asked
 * only about the flyout, which exists at one size and one state: collapsed, on
 * a screen wide enough that the rail is a rail rather than a drawer. Reading it
 * at the moment of the gesture rather than subscribing to it is deliberate --
 * nothing renders differently from the answer, so there is nothing to keep in
 * step and no server/client disagreement to have.
 */
const WIDE = "(min-width: 64rem)";

/** The group a URL is inside, or `null` for the index and anything unknown. */
function groupForPath(pathname: string): AdminGroup | null {
  // `/admin/<key>/…` -- one flat segment, which is what the registry keys on.
  const key = pathname.split("/")[2];
  if (!key) return null;
  return ADMIN_ENTRIES_BY_KEY.get(key)?.group ?? null;
}

/** The entries of one group, drawn the same way in the panel and the flyout. */
function GroupEntries({
  group,
  pathname,
  onNavigate,
}: {
  group: AdminGroup;
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <ul className="space-y-0.5">
      {entriesInGroup(group).map((entry) => {
        const href = `/admin/${entry.key}` as Route;
        const active = pathname === href || pathname.startsWith(`${href}/`);

        return (
          <li key={entry.key}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              /*
                `admin-nav-item` draws the current marker from `aria-current`,
                so the bar and the accessible state cannot drift apart -- there
                is no second class to remember. See styles/admin-motion.css.
              */
              className={cn(
                "admin-nav-item flex items-center gap-2 rounded-md py-1.5 pr-2 pl-3 text-sm",
                active
                  ? "bg-zinc-800/70 text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
              )}
            >
              <span className="truncate">{entry.labelPlural}</span>
              {entry.singleton && (
                <span className="ml-auto shrink-0 text-[0.625rem] tracking-wide text-zinc-600 uppercase">
                  one
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * One group's entries, beside its icon, while the rail is collapsed.
 *
 * Portaled to the body rather than rendered in the rail. The rail is a flex
 * column whose nav region scrolls, so a panel inside it is clipped at that
 * region's edge -- and the last group in the list is exactly where the clipping
 * would land. `usePopoverPosition` already answers this for the admin's select
 * and date controls; the only new thing is asking it for the horizontal axis,
 * because this comes out of the side of a 4.5rem strip rather than the bottom
 * of a form field.
 *
 * Keyed on the group by its caller, so moving the pointer from one icon to the
 * next remounts it and every measurement is taken fresh. A single instance kept
 * across groups would hold the first one's coordinates: the hook re-measures on
 * scroll, on resize and on its own resize, but not on an anchor swapped
 * underneath it.
 */
function GroupFlyout({
  group,
  anchor,
  autoFocus,
  pathname,
  onClose,
  onHoverIn,
  onHoverOut,
}: {
  group: AdminGroup;
  anchor: HTMLElement;
  /** Opened from the keyboard, which has to be put inside it to use it. */
  autoFocus: boolean;
  pathname: string;
  onClose: () => void;
  onHoverIn: () => void;
  onHoverOut: () => void;
}) {
  /*
   * Captured once, never rewritten. `usePopoverPosition` wants a ref because
   * its other two callers own the element they anchor to; this one is handed a
   * node instead, so the ref is only an adapter. Assigning to it on later
   * renders would be a ref write during render -- which React's lint refuses,
   * and which would be pointless here anyway: the caller keys this component on
   * the group, so a different anchor is a different mount by construction.
   */
  const anchorRef = useRef<HTMLElement | null>(anchor);
  const panelRef = useRef<HTMLDivElement>(null);
  const placement = usePopoverPosition(true, anchorRef, panelRef, "horizontal");

  useOutsidePointer(true, onClose, panelRef, anchorRef);

  /*
   * A portal puts these links at the end of the document, so Tab from the group
   * button walks into the rest of the rail rather than into the menu it just
   * opened. Moving focus on a keyboard open is what closes that gap; a pointer
   * open deliberately does not, because stealing focus from whatever someone is
   * typing in because a cursor crossed an icon is worse than the gap.
   */
  useEffect(() => {
    if (!autoFocus) return;
    panelRef.current?.querySelector("a")?.focus();
  }, [autoFocus]);

  // Escape returns the focus it takes: someone who opened this from the
  // keyboard is standing on the group button, and closing without putting them
  // back drops them at the top of the document.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      anchor.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      data-side={placement?.side}
      /*
        The margin is what clears the rail, and it is a margin rather than a
        bigger gap in the placement hook because the two distances are not the
        same thing. The panel is anchored to its *button*, which sits 8px inside
        the rail's edge -- so a 4px gap from the button puts the panel 4px
        *inside* the rail, overlapping its border. A `position: fixed` box with
        `left` set is placed at `left + margin-left`, so this pushes it clear
        without the hook having to know anything about the rail's gutter.
      */
      className={cn(
        "admin-popover custom-scroll fixed z-50 w-56 overflow-y-auto p-1.5",
        placement?.side === "left" ? "mr-2" : "ml-2",
      )}
      style={{
        top: placement?.top ?? -9999,
        left: placement?.left ?? -9999,
        maxHeight: "min(24rem, 80vh)",
        // Hidden until measured, or it paints once at the fallback coordinates
        // and jumps, which reads as a flicker in the corner of the screen.
        visibility: placement ? "visible" : "hidden",
      }}
      onPointerEnter={onHoverIn}
      /* As on the trigger: a lifted finger is not a pointer leaving. */
      onPointerLeave={(event) => {
        if (event.pointerType === "touch") return;
        onHoverOut();
      }}
    >
      <p className="px-2 pb-1.5 text-[0.6875rem] font-medium tracking-wide text-zinc-500 uppercase">
        {group}
      </p>
      <GroupEntries group={group} pathname={pathname} onNavigate={onClose} />
    </div>,
    document.body,
  );
}

/** `"Open to work"` -> `"open-to-work"`, for the panel ids `aria-controls` names. */
const slug = (group: AdminGroup) => group.toLowerCase().replace(/\s+/g, "-");

/**
 * The admin's model index, as a rail on desktop and a drawer below `lg`.
 *
 * Grouped by area, in registry order, so the sidebar and the index page put the
 * same models in the same places.
 *
 * **One group is open at a time.** Twenty-one screens in eight groups is a list
 * that runs past the fold on a laptop, which made the group headings decoration
 * -- they named the sections but could not put one away. Holding a single
 * `AdminGroup | null` rather than a set is the whole of the behaviour: opening
 * Legal closes Open to work because there is nowhere for the second value to
 * go.
 *
 * **The rail also collapses**, to a strip of group icons whose entries arrive
 * in a flyout. That state is a cookie read by the layout, so the first paint is
 * already the right width -- see `admin-shell.tsx`.
 *
 * The public site's drawer is dismissed by drag, backdrop and Escape and has no
 * close button. This one keeps a close button on purpose: the admin is a tool
 * rather than a reading surface, it is used with a pointer far more often than
 * a thumb, and there is no navbar toggle left on screen once it is open.
 */
export function AdminSidebar({
  signedInAs,
  mini,
  onToggleMini,
}: {
  signedInAs: string;
  mini: boolean;
  onToggleMini: () => void;
}) {
  const [drawer, setDrawer] = useState(false);
  const pathname = usePathname();

  /*
   * The open group follows the route, and a manual choice survives until the
   * route leaves the group.
   *
   * Adjusted during render rather than in an effect. An effect would paint the
   * group shut for one frame on arrival and then open it, which is a flicker on
   * every navigation into a different area. Navigating *within* a group does
   * not touch it -- `active` has not changed -- so somebody who collapsed the
   * group they are working in keeps it collapsed. Landing on `/admin` closes
   * everything, which is right: the index is not inside a group.
   */
  const active = groupForPath(pathname);
  const [openGroup, setOpenGroup] = useState<AdminGroup | null>(active);
  const [lastActive, setLastActive] = useState<AdminGroup | null>(active);
  if (active !== lastActive) {
    setLastActive(active);
    setOpenGroup(active);
  }

  const [flyout, setFlyout] = useState<{
    group: AdminGroup;
    anchor: HTMLElement;
    keyboard: boolean;
  } | null>(null);

  /*
   * A grace period between the icon and the panel.
   *
   * There are four pixels of gap between them, and a pointer crossing that gap
   * leaves both elements for a frame. Closing on that `pointerleave` makes the
   * menu impossible to reach with anything but a perfectly straight cursor.
   */
  const closeTimer = useRef<number | null>(null);
  const cancelClose = useCallback(() => {
    if (closeTimer.current === null) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }, []);

  const closeFlyout = useCallback(() => {
    cancelClose();
    setFlyout(null);
    // Back to whatever the URL says, so `aria-expanded` keeps describing the
    // group whose screen is actually open.
    setOpenGroup(active);
  }, [active, cancelClose]);

  const closeFlyoutSoon = useCallback(() => {
    cancelClose();
    closeTimer.current = window.setTimeout(closeFlyout, 140);
  }, [cancelClose, closeFlyout]);

  const openFlyout = useCallback(
    (group: AdminGroup, anchor: HTMLElement, keyboard: boolean) => {
      cancelClose();
      setFlyout({ group, anchor, keyboard });
      setOpenGroup(group);
    },
    [cancelClose],
  );

  useEffect(() => cancelClose, [cancelClose]);

  /**
   * Whether a flyout is the right answer to this gesture.
   *
   * Only when the rail is collapsed *and* it is a rail: below `lg` the same
   * markup is a 16rem drawer with every label visible, where the accordion is
   * the disclosure and a menu flying out of the side of it would be nonsense.
   * Asked at the moment of the gesture, so nothing renders from it.
   */
  const flyable = () => mini && window.matchMedia(WIDE).matches;

  const onGroupClick = (group: AdminGroup, event: React.MouseEvent<HTMLButtonElement>) => {
    if (flyable()) {
      // `detail === 0` is a click the keyboard produced. A pointer user can see
      // where the menu went; someone on Enter needs to be put inside it.
      if (flyout?.group === group) closeFlyout();
      else openFlyout(group, event.currentTarget, event.detail === 0);
      return;
    }
    setOpenGroup((current) => (current === group ? null : group));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setDrawer(true)}
        className="lg:hidden fixed top-3 left-3 z-40 inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        aria-label="Open admin navigation"
      >
        <MenuIcon height={18} width={18} />
      </button>

      {drawer && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setDrawer(false)}
          className="admin-fade lg:hidden fixed inset-0 z-40 bg-black/70"
        />
      )}

      <nav
        /*
          `overflow-hidden` is what makes the collapse a clip rather than a
          reflow: every label stays in the tree at its full width and the edge
          of the rail simply arrives at it. Rebuilding the rows for the narrow
          state would move the icons, and moving icons is the one thing a
          collapse must not do -- they are the landmark being tracked.
        */
        className={cn(
          "admin-rail-shift fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-hidden border-r border-zinc-800 bg-zinc-950 lg:translate-x-0",
          mini ? "lg:w-18" : "lg:w-64",
          drawer ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Admin sections"
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-zinc-800 px-4">
          <Link
            href="/admin"
            onClick={() => setDrawer(false)}
            className="flex min-w-0 items-center gap-2.5 rounded-md text-zinc-200 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            <SquaresIcon className="shrink-0 text-indigo-400" height={17} width={17} />
            <span
              className="admin-rail-label truncate text-sm font-medium whitespace-nowrap"
              data-hidden={mini}
            >
              Admin
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setDrawer(false)}
            className="lg:hidden ml-auto rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            aria-label="Close admin navigation"
          >
            <CloseIcon height={16} width={16} />
          </button>
        </div>

        <div className="custom-scroll flex-1 overflow-x-hidden overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {ADMIN_GROUPS.map((group) => {
              const Icon = GROUP_ICON[group];
              const open = openGroup === group;
              const holdsActive = active === group;
              const panelId = `admin-group-${slug(group)}`;

              return (
                <li key={group}>
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={(event) => onGroupClick(group, event)}
                    /*
                      Hover is for pointers that hover. A touch fires
                      `pointerenter` on tap and `pointerleave` on lift, so
                      without the guard a tap opened the menu and the click
                      that followed closed it again -- on a tablet held wide
                      enough for the rail, the collapsed rail simply did not
                      work. Tapping goes through `onClick` like a keyboard
                      press does.
                    */
                    onPointerEnter={(event) => {
                      if (event.pointerType === "touch") return;
                      if (flyable()) openFlyout(group, event.currentTarget, false);
                    }}
                    onPointerLeave={(event) => {
                      if (event.pointerType === "touch") return;
                      if (flyout) closeFlyoutSoon();
                    }}
                    className={cn(
                      "admin-group-toggle flex w-full cursor-pointer items-center gap-2.5 rounded-md py-2 pr-2 pl-2.5 text-left text-sm transition-colors hover:bg-zinc-800/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
                      holdsActive ? "text-zinc-100" : "text-zinc-400 hover:text-zinc-200",
                      open && "bg-zinc-900/70",
                    )}
                  >
                    <Icon
                      className={cn("shrink-0", holdsActive && "text-indigo-400")}
                      height={16}
                      width={16}
                    />
                    {/*
                      Opacity, never `display`. The label is what gives this
                      button its accessible name, so dropping it in the
                      collapsed rail would leave eight buttons called nothing --
                      and a name put back with `aria-label` is a second copy of
                      a string the registry already owns.
                    */}
                    <span
                      className="admin-rail-label min-w-0 flex-1 truncate whitespace-nowrap"
                      data-hidden={mini}
                    >
                      {group}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "shrink-0 text-[0.6875rem] text-zinc-600 tabular-nums",
                        mini && "lg:hidden",
                      )}
                    >
                      {entriesInGroup(group).length}
                    </span>
                    <ChevronIcon
                      aria-hidden="true"
                      className={cn("admin-chevron shrink-0 text-zinc-600", mini && "lg:hidden")}
                      height={13}
                      width={13}
                    />
                  </button>

                  {/*
                    `inert` rather than trusting the collapse: a `0fr` row is
                    invisible and still focusable, so without it Tab walks
                    through the entries of every closed group.
                  */}
                  <div
                    id={panelId}
                    data-open={open}
                    data-mini={mini}
                    inert={!open}
                    className="admin-accordion"
                  >
                    <div className="admin-accordion-inner">
                      <div className="mt-0.5 mb-1 ml-[1.4375rem] border-l border-zinc-800 pl-2">
                        <GroupEntries
                          group={group}
                          pathname={pathname}
                          onNavigate={() => setDrawer(false)}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Its own row, and `lg` only. The collapse belongs to the rail rather
            than to the drawer, and a 4.5rem header has no room for a second
            control beside the mark. */}
        <div className="hidden shrink-0 border-t border-zinc-800 px-2 py-2 lg:block">
          <button
            type="button"
            onClick={onToggleMini}
            aria-expanded={!mini}
            aria-label={mini ? "Expand the sidebar" : "Collapse the sidebar"}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-md py-2 pr-2 pl-2.5 text-left text-sm text-zinc-500 transition-colors hover:bg-zinc-800/50 hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            <RailIcon className="shrink-0" height={16} width={16} />
            <span
              aria-hidden="true"
              className="admin-rail-label truncate whitespace-nowrap"
              data-hidden={mini}
            >
              Collapse
            </span>
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-zinc-800 px-4 py-3">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-[0.625rem] font-medium tracking-wide text-zinc-400 uppercase"
          >
            {signedInAs.slice(0, 2)}
          </span>
          <span className="admin-rail-label min-w-0 flex-1" data-hidden={mini}>
            <span className="block truncate text-xs text-zinc-300">{signedInAs}</span>
            <span className="block truncate text-[0.6875rem] text-zinc-600">
              {ADMIN_ENTRIES.length} screens
            </span>
          </span>
        </div>
      </nav>

      {flyout && (
        <GroupFlyout
          key={flyout.group}
          group={flyout.group}
          anchor={flyout.anchor}
          autoFocus={flyout.keyboard}
          pathname={pathname}
          onClose={closeFlyout}
          onHoverIn={cancelClose}
          onHoverOut={closeFlyoutSoon}
        />
      )}
    </>
  );
}
