import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@/components/site/disclosure";
import { FactIcon, MetaItem, MetaRow, type FactKind } from "@/components/site/meta-row";
import type { Application } from "@/lib/data/about";

/**
 * One job application, with its journey timeline.
 *
 * **The outcome is the only thing here that earns a colour.** Where an
 * application got to is the answer someone is reading the card for. It carries
 * that colour in its text and its border and nothing else: a filled chip in a
 * card that is otherwise all outline read as a button, and pulled harder than
 * the company name above it. This is the same shape the availability chips take
 * on hover, so the site has one way of saying "coloured chip".
 * The facts beside it -- work type, where, how much, through whom -- are five
 * pieces of ordinary metadata, and giving each its own hue made a card of five
 * competing labels with no hierarchy at all.
 *
 * Colours are written out in full per status rather than composed from the
 * status name: Tailwind only generates a class it can see in the source, so an
 * interpolated one would produce no rule at all and the badge would be
 * unstyled.
 *
 * **Keyed on the slug, not on the label.** The label is edited from the
 * Application status screen, so keying on it meant a rewording -- "In Progress"
 * to "In progress" -- silently dropped the badge to the fallback, with the
 * status still rendering correctly beside it and nothing to say what happened.
 * The slug is the identifier and does not move.
 */
const STATUS_STYLES: Record<string, string> = {
  "in-progress": "text-blue-400",
  accepted: "text-emerald-400",
  rejected: "text-red-400",
  ghosted: "text-yellow-400",
  applied: "text-zinc-400",
};

/**
 * Withdrawn has no colour of its own: it falls through to the neutral
 * treatment rather than rendering an unstyled badge.
 */
const FALLBACK_STATUS = STATUS_STYLES.applied;

export function ApplicationCard({ application }: { application: Application }) {
  const status = STATUS_STYLES[application.status_slug] ?? FALLBACK_STATUS;

  const facts = [
    application.employment_type && { key: "employment", label: application.employment_type },
    application.location_type && { key: "locationType", label: application.location_type },
    application.location && { key: "location", label: application.location },
    application.salary_range && { key: "salary", label: application.salary_range },
    application.applied_via && { key: "via", label: application.applied_via },
  ].filter(Boolean) as { key: FactKind; label: string }[];

  return (
    <div className="card-outline group mb-4">
      <div className="p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-start gap-3 sm:gap-5">
          <div className="flex-grow w-full">
            <div className="flex flex-row items-center justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
              <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-2 min-w-0 flex-1">
                <h3 className="text-base sm:text-lg font-medium text-zinc-300 break-words">
                  {application.company_name}{" "}
                  <span className="text-blue-200 italic font-medium text-xs sm:text-sm">
                    — {application.position}
                  </span>
                </h3>
              </div>
              <span
                className={`inline-flex items-center rounded-full border border-zinc-700 px-2 sm:px-2.5 py-1 text-xs whitespace-nowrap flex-shrink-0 ${status}`}
              >
                {application.status}
              </span>
            </div>

            <Disclosure>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {facts.length > 0 ? (
                  <MetaRow>
                    {facts.map((fact) => (
                      <MetaItem key={fact.key}>
                        <FactIcon kind={fact.key} />
                        {fact.label}
                      </MetaItem>
                    ))}
                  </MetaRow>
                ) : (
                  // Keeps the journey button on the right when there are no facts.
                  <div />
                )}

                <div className="flex-shrink-0">
                  <DisclosureButton />
                </div>
              </div>

              {/* Full width, below the badge/button row -- a journey table is
                  far wider than the narrow right-hand cell the button sits in.
                  The original kept `mt-1` on the panel even while collapsed, so
                  it stays on the panel here rather than moving inside it. */}
              <DisclosurePanel className="mt-1">
                <div className="overflow-y-auto overflow-x-auto max-h-[60vh] sm:max-h-[70vh] custom-scroll">
                  <div className="min-w-full">
                    <table className="w-full divide-y divide-zinc-700/30 text-sm table-auto">
                      <thead>
                        <tr>
                          {["Timestamp", "Step", "Details", "Notes"].map((heading) => (
                            <th
                              key={heading}
                              className="py-1 text-left text-xs font-medium text-indigo-300 uppercase tracking-wider"
                            >
                              {heading}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-700/20">
                        {application.journey.map((step, index) => (
                          <tr
                            key={index}
                            className="hover:bg-zinc-800/30 transition-colors duration-150"
                          >
                            <td className="py-1 text-xs sm:text-sm">
                              {step.timestamp ? (
                                <>
                                  <span className="text-zinc-400">
                                    {stepDate(step.timestamp)}
                                  </span>
                                  <br />
                                  <span className="text-zinc-500 text-xs">
                                    {stepTime(step.timestamp)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-zinc-600 italic">-</span>
                              )}
                            </td>
                            <td className="py-1">
                              <span className="font-medium text-indigo-300 text-xs sm:text-sm">
                                {step.title}
                              </span>
                            </td>
                            <td className="py-1 text-xs sm:text-sm break-words">{step.details}</td>
                            <td className="py-1 text-xs break-words">{step.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </DisclosurePanel>
            </Disclosure>

            {application.lessons_learned && (
              <div className="mt-2 pt-2 border-t border-zinc-800/80">
                <div className="text-xs sm:text-sm">
                  <p>
                    <span className="font-semibold">Lessons Learned:</span>{" "}
                    {application.lessons_learned}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Jan 23, 2026". */
function stepDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/** "8:55 PM". */
function stepTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Jakarta",
  }).format(date);
}
