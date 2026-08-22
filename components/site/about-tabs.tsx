"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export type AboutTab = {
  id: string;
  label: string;
  content: React.ReactNode;
};

/**
 * The about page's tab strip.
 *
 * **Every panel stays mounted**, hidden with `hidden` rather than unmounted.
 * That is how the Django version worked and it matters: the experience,
 * education, awards, certifications and applications sections are the substance
 * of the page, and a crawler, a reader using in-page search, or anyone who
 * prints it should find all of them. Only the visible one is laid out.
 *
 * The panel slides in from the side it came from -- forward from the right,
 * backward from the left -- which is what `switchTab.js` did with a pair of
 * nested `setTimeout`s. Here it is a class swap keyed on the direction, so
 * there is no timing to get out of step and nothing to clean up.
 *
 * **The underline is one element that moves**, not a border that switches on
 * and off per tab. Each tab used to own a `border-b-2` that flipped between
 * `zinc-300` and transparent, so the mark disappeared here and reappeared
 * there with nothing connecting the two. Measuring the active button and
 * animating a single bar to it gives the strip the continuity the panel
 * beneath it already had.
 *
 * `top` is measured along with `left`, because the strip wraps to a second row
 * on a narrow screen and a bar that only knew its horizontal position would
 * stay on the first one.
 */
export function AboutTabs({ tabs }: { tabs: AboutTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [mark, setMark] = useState<{ left: number; top: number; width: number } | null>(null);

  const stripRef = useRef<HTMLDivElement>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());

  const measure = useCallback(() => {
    const button = buttons.current.get(active);
    if (!button) return;
    setMark({
      left: button.offsetLeft,
      top: button.offsetTop + button.offsetHeight - 2,
      width: button.offsetWidth,
    });
  }, [active]);

  // Before paint, so the bar is already under the tab that was just clicked
  // rather than arriving a frame later from wherever it was.
  useLayoutEffect(measure, [measure]);

  /*
   * Re-measure when the strip changes size. A window listener would miss the
   * case that actually moves these buttons -- the row wrapping as the content
   * column narrows, which can happen without the window resizing at all.
   */
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [measure]);

  const select = (id: string) => {
    const from = tabs.findIndex((tab) => tab.id === active);
    const to = tabs.findIndex((tab) => tab.id === id);
    setDirection(to > from ? "forward" : "back");
    setActive(id);
  };

  return (
    <>
      <div className="mb-6 border-b border-zinc-700">
        <div
          ref={stripRef}
          className="relative flex flex-wrap min-w-full -mb-px text-sm font-medium text-center"
          role="tablist"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`content-${tab.id}`}
                ref={(node) => {
                  if (node) buttons.current.set(tab.id, node);
                  else buttons.current.delete(tab.id);
                }}
                onClick={() => select(tab.id)}
                className={`inline-block cursor-pointer p-2 sm:p-4 rounded-t-lg transition-colors hover:text-zinc-300 flex-1 sm:flex-none whitespace-nowrap ${
                  selected ? "text-zinc-300" : ""
                }`}
              >
                {tab.label}
              </button>
            );
          })}

          {/*
            Rendered only once the active tab has been measured. Drawing it at
            zero width first would either flash a dot at the left edge or, with
            the transition on, slide the full way in on arrival.
          */}
          {mark && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute h-0.5 bg-zinc-300 transition-all duration-300 ease-out"
              style={{ left: mark.left, top: mark.top, width: mark.width }}
            />
          )}
        </div>
      </div>

      <div className="tab-content w-full">
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <div
              key={tab.id}
              id={`content-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`tab-${tab.id}`}
              className={
                selected
                  ? `block w-full ${
                      direction === "forward" ? "tab-enter-forward" : "tab-enter-back"
                    }`
                  : "hidden w-full"
              }
            >
              {tab.content}
            </div>
          );
        })}
      </div>
    </>
  );
}
