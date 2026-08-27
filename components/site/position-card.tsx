import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@/components/site/disclosure";
import { FactIcon, MetaItem, MetaRow } from "@/components/site/meta-row";
import type { Position } from "@/lib/data/openhire";

import { BulletLines, ICON, TagList } from "./openhire-cards";

/**
 * One open position, with its details behind the site's disclosure.
 *
 * It used to roll its own: `useState` plus `useId`, a panel hidden with
 * `hidden`, and a button reading "Show Details" / "Hide Details". That was the
 * last of the four near-copies of this control -- the others became
 * `components/site/disclosure.tsx` -- and it was the only one that opened with
 * no transition and the only one still using its own wording. Using the shared
 * one settles all three: the same easing the about page's cards have, the same
 * bordered pill, and "Show more" / "Show less" like every other disclosure.
 *
 * Dropping the local state is also what lets this be a server component again;
 * the panel's contents are a job posting, and they should be in the document
 * for a crawler and for in-page search rather than conjured on click.
 *
 * **The card itself has no border.** These sit inside a `SectionCard` that
 * already draws one, so each position was a box inside a box; the only outline
 * left is on the control that does something.
 */
export function PositionCard({
  position,
  applicationEmail,
}: {
  position: Position;
  applicationEmail: string;
}) {
  return (
    <Disclosure>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-medium text-zinc-200">{position.title}</h3>
          <span className="pill-badge px-2.5 py-0.5 text-xs border border-zinc-700 text-zinc-400">
            {position.experience_required}
          </span>
        </div>
        <div className="flex-shrink-0">
          <DisclosureButton />
        </div>
      </div>

      {/* The same row, glyphs and scale the about page's cards use -- see
          components/site/meta-row.tsx. This had its own icon set and its own
          `text-sm` spacing, so a job's location did not look like an
          application's. */}
      <MetaRow>
        <MetaItem>
          <FactIcon kind="employment" />
          {position.type}
        </MetaItem>
        <MetaItem>
          <FactIcon kind="location" />
          {position.location}
        </MetaItem>
        <MetaItem>
          <FactIcon kind="salary" />
          {position.salary_range}
        </MetaItem>
      </MetaRow>

      <DisclosurePanel>
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
            className="toggle-pill group px-2 py-1 rounded-full"
          >
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON.mail} />
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
      </DisclosurePanel>
    </Disclosure>
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
