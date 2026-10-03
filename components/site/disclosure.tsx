"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { createContext, useContext, useId, useRef, useState } from "react";

gsap.registerPlugin(useGSAP);

/**
 * The "Show more" toggle used across the about page.
 *
 * One component rather than four near-identical ones, each hand-wiring a pair
 * of label spans, an arrow and a hidden panel through ids built from loop
 * counters. The ids come from `useId`, and every instance says the same thing:
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

/**
 * The toggle: a rounded-full outlined control like every other outlined button
 * here, so its hover is its fill lighting, and an arrow that turns over as the
 * panel opens.
 *
 * "Show more" / "Show less" are the same length on purpose: two words of equal
 * width keep the button from jumping when one replaces the other.
 */
export function DisclosureButton({
  label = "Show more",
  openLabel = "Show less",
  className,
}: {
  label?: string;
  openLabel?: string;
  className?: string;
}) {
  const { open, toggle, panelId } = useDisclosure();

  return (
    <button
      type="button"
      className={
        className ??
        "group relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden rounded-full border border-zinc-500 px-3.5 text-xs font-medium text-zinc-200 transition-[color,background-color,border-color] duration-500 ease-out hover:border-zinc-300 hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      }
      onClick={toggle}
      aria-expanded={open}
      aria-controls={panelId}
    >
      <span>{open ? openLabel : label}</span>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={`h-3 w-3 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${open ? "rotate-180" : ""}`}
      >
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
    </button>
  );
}

/**
 * The panel, opened and closed by GSAP rather than by a CSS row transition.
 *
 * Height to `auto` is the thing CSS cannot tween, and it is what makes the
 * open feel measured on a short panel and a long one alike: GSAP measures the
 * content at the moment of opening, so there is no guessed maximum to
 * overshoot. The rows inside then arrive in a short stagger, so a list of
 * responsibilities reads as unfolding rather than as a block sliding down.
 *
 * Closed, the panel is a zero-height box -- the class is the closed state, so
 * it holds before the bundle arrives -- and `inert`, so a collapsed panel's
 * links are out of the tab order and out of the accessibility tree. The
 * content itself stays in the document: these are the substance of the about
 * page, and a crawler and in-page search should find them closed or open.
 *
 * Spacing above the content belongs *inside* the panel (`className` lands on
 * the inner box): a margin on the outer one would occupy its pixels while
 * closed.
 */
export function DisclosurePanel({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, panelId } = useDisclosure();
  const ref = useRef<HTMLDivElement>(null);
  const settled = useRef(false);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      // The first run is hydration: the markup already is the closed state.
      if (!settled.current) {
        settled.current = true;
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const rows = Array.from(el.firstElementChild?.children ?? []);
      if (open) {
        gsap.fromTo(
          el,
          { height: el.offsetHeight },
          { height: "auto", duration: reduce ? 0 : 0.95, ease: "expo.out", overwrite: true },
        );
        if (!reduce && rows.length > 0) {
          gsap.fromTo(
            rows,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.06, delay: 0.1, overwrite: true },
          );
        }
      } else {
        gsap.to(el, { height: 0, duration: reduce ? 0 : 0.7, ease: "expo.out", overwrite: true });
      }
    },
    { dependencies: [open] },
  );

  return (
    <div ref={ref} id={panelId} inert={!open} className="h-0 overflow-hidden">
      <div className={className}>{children}</div>
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
