"use client";

import { useId, useState } from "react";

/**
 * The "Show More / Show Less" toggle used across the about page.
 *
 * Django had four near-identical implementations of this -- `toggleCareer.js`
 * carried `toggleResponsibilities`, `toggleAchievements`,
 * `toggleAchievementsCerts` and `toggleJourney`, each hand-wiring a pair of
 * label spans, an arrow and a hidden panel through ids built from loop
 * counters (`achievements-{{ forloop.counter }}`). One component replaces all
 * four, and the ids come from `useId` rather than from a position in a list.
 *
 * The content stays mounted and is hidden with `hidden`, exactly as before:
 * responsibilities and achievements are real content that should be in the
 * document for a crawler and for in-page search, not something conjured on
 * click.
 */
export function Disclosure({
  showLabel,
  hideLabel,
  className = "toggle-pill cursor-pointer px-3 py-1.5 rounded-lg",
  children,
}: {
  showLabel: string;
  hideLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span>{open ? hideLabel : showLabel}</span>
        <svg
          className={`w-3 h-3 ml-1.5 transition-transform duration-200 ${open ? "rotate-180" : "animate-pulse"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div id={panelId} className={open ? "mt-1 w-full" : "hidden"}>
        {children}
      </div>
    </>
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
