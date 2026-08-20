"use client";

import { useState } from "react";

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
 */
export function AboutTabs({ tabs }: { tabs: AboutTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id ?? "");
  const [direction, setDirection] = useState<"forward" | "back">("forward");

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
          className="flex flex-wrap min-w-full -mb-px text-sm font-medium text-center"
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
                onClick={() => select(tab.id)}
                className={`inline-block cursor-pointer p-2 sm:p-4 border-b-2 rounded-t-lg hover:text-zinc-300 hover:border-zinc-300 flex-1 sm:flex-none whitespace-nowrap ${
                  selected ? "border-zinc-300 text-zinc-300" : "border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
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
