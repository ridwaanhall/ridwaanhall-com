"use client";

import { useId, useState } from "react";

import type { Position } from "@/lib/data/openhire";

import { BulletLines, ICON, TagList } from "./openhire-cards";

/**
 * One open position, with its detail panel behind a Show/Hide toggle.
 *
 * `togglePositionDetails` in toggleCareer.js was the fourth near-copy of the
 * same disclosure -- it addressed five elements by ids built from a loop
 * counter (`position-details-3`, `show-text-position-3`, ...) and animated
 * `maxHeight` from `scrollHeight` through a pair of nested setTimeouts. Here
 * the ids come from `useId` and the panel is hidden with `hidden`, which is
 * what the original ended up at anyway once its transition finished.
 *
 * The panel stays mounted: the required skills, responsibilities and benefits
 * are the substance of a job posting and should be in the document for a
 * crawler and for in-page search, not conjured on click.
 */
export function PositionCard({
  position,
  applicationEmail,
}: {
  position: Position;
  applicationEmail: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="card-outline backdrop-blur-sm">
      <div className="p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-medium text-zinc-200">{position.title}</h3>
            <span className="pill-badge px-2.5 py-0.5 text-xs bg-blue-900/30 text-blue-300 border border-blue-700/50">
              {position.experience_required}
            </span>
          </div>
          <div className="flex-shrink-0">
            <button
              type="button"
              className="toggle-pill cursor-pointer px-3 py-1.5 rounded-full"
              onClick={() => setOpen((wasOpen) => !wasOpen)}
              aria-expanded={open}
              aria-controls={panelId}
            >
              <span>{open ? "Hide Details" : "Show Details"}</span>
              <svg
                className={`w-3 h-3 ml-1.5 transition-transform duration-200 ${
                  open ? "rotate-180" : "animate-pulse"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
          <Meta paths={[ICON.briefcase]}>{position.type}</Meta>
          <Meta paths={[ICON.pinOuter, ICON.pinInner]}>{position.location}</Meta>
          <Meta paths={[ICON.coin]}>{position.salary_range}</Meta>
        </div>

        <div id={panelId} className={open ? undefined : "hidden"}>
          <Group title="Required Skills">
            <TagList items={position.skills_required} />
          </Group>
          <Group title="Key Responsibilities">
            <BulletLines items={position.responsibilities} />
          </Group>
          <Group title="What We Offer">
            <BulletLines items={position.benefits} dotClass="bg-emerald-400" />
          </Group>

          <div className="mt-4 pt-3 border-t border-zinc-700/50">
            <a
              href={`mailto:${applicationEmail}?subject=${encodeURIComponent(
                `Application for ${position.title}`,
              )}`}
              className="toggle-pill group px-3 py-1.5 rounded-lg"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={ICON.mail}
                />
              </svg>
              <span>Apply for {position.title}</span>
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-1.5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ paths, children }: { paths: readonly string[]; children: React.ReactNode }) {
  return (
    <div className="flex items-center">
      <svg
        className="w-4 h-4 mr-1.5 text-zinc-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {paths.map((d) => (
          <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
        ))}
      </svg>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h5 className="text-sm font-medium text-zinc-300 mb-2">{title}</h5>
      {children}
    </div>
  );
}
