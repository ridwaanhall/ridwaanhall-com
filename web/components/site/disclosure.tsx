"use client";

import { createContext, useContext, useId, useState } from "react";

/**
 * The "Show more" toggle used across the about page.
 *
 * Django had four near-identical implementations -- `toggleCareer.js` carried
 * `toggleResponsibilities`, `toggleAchievements`, `toggleAchievementsCerts` and
 * `toggleJourney`, each hand-wiring a pair of label spans, an arrow and a
 * hidden panel through ids built from loop counters. One component replaces all
 * four, the ids come from `useId`, and every instance now says the same thing:
 * "Show more" / "Show less", rather than three different phrasings for one
 * gesture.
 *
 * **Button and panel are separate elements on purpose.** In every card the
 * button sits in a header row -- usually the right-hand cell of a
 * `justify-between` flex -- while the panel belongs *below* the row that
 * follows it, full width. An earlier version rendered the panel immediately
 * after the button, which made it a flex item of that header: expanding a role
 * squeezed its responsibilities into the narrow right-hand column and pushed
 * the title sideways. Composing them separately is what keeps the card
 * identical before and after the click:
 *
 *     <Disclosure>
 *       <div className="flex justify-between">
 *         <h3>…</h3>
 *         <DisclosureButton />
 *       </div>
 *       <div className="meta">…</div>
 *       <DisclosurePanel>…</DisclosurePanel>
 *     </Disclosure>
 *
 * The content stays mounted and is collapsed rather than unmounted, exactly as
 * before: responsibilities and achievements are real content that should be in
 * the document for a crawler and for in-page search, not conjured on click.
 */

const DisclosureContext = createContext<{
  open: boolean;
  toggle: () => void;
  panelId: string;
} | null>(null);

function useDisclosure() {
  const context = useContext(DisclosureContext);
  if (!context) {
    throw new Error(
      "<DisclosureButton> and <DisclosurePanel> must be inside <Disclosure>",
    );
  }
  return context;
}

/** Renders no element of its own -- it only shares the open state. */
export function Disclosure({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <DisclosureContext.Provider
      value={{ open, toggle: () => setOpen((wasOpen) => !wasOpen), panelId }}
    >
      {children}
    </DisclosureContext.Provider>
  );
}

export function DisclosureButton({
  className = "toggle-pill cursor-pointer px-3 py-1.5 rounded-lg",
}: {
  className?: string;
}) {
  const { open, toggle, panelId } = useDisclosure();

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-expanded={open}
      aria-controls={panelId}
    >
      <span>{open ? "Show less" : "Show more"}</span>
      <svg
        className={`w-3 h-3 ml-1.5 transition-transform duration-200 ${
          open ? "rotate-180" : "animate-pulse"
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
}

/**
 * The animated panel.
 *
 * `grid-template-rows: 0fr -> 1fr` rather than the original's measured
 * `max-height`. It reads the same at 300ms and needs no `scrollHeight` probe,
 * no second timeout to put `hidden` back, and no upper bound to overshoot when
 * the content is shorter than the guess -- which is what made the original's
 * collapse start slowly on a short card and snap on a long one.
 *
 * Collapsed the panel is exactly zero-height, so a card is the same height
 * before the first click as it was in Django with `hidden`. Any spacing above
 * the content therefore belongs *inside* it: a margin on this element would
 * still occupy its pixels while closed. `className` is for the one card whose
 * original kept a `mt-1` gap even when collapsed.
 */
export function DisclosurePanel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, panelId } = useDisclosure();

  return (
    <div
      id={panelId}
      className={`grid transition-all duration-300 ease-in-out ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }${className ? ` ${className}` : ""}`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  );
}

/** The bulleted list shared by responsibilities and achievements. */
export function BulletList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-1 mt-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start group">
          <div className="flex-shrink-0 w-3 h-3 mt-0.5">
            <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full mt-1" />
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">{item}</p>
        </div>
      ))}
    </div>
  );
}
