import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@/components/site/disclosure";
import type { Application } from "@/lib/data/about";

/**
 * One job application, with its journey timeline.
 *
 * Status colours are written out in full per status rather than composed from
 * the status name -- Tailwind only generates a class it can see in the source,
 * so `bg-${hue}-950/60` would produce no rule at all and the badge would be
 * unstyled. Django's template made the same choice, as a chain of `{% if %}`s.
 */
const STATUS_STYLES: Record<string, { badge: string; ping: string; dot: string }> = {
  "In Progress": {
    badge: "bg-blue-950/60 text-blue-300 ring-1 ring-blue-700/70",
    ping: "bg-blue-600",
    dot: "bg-blue-700",
  },
  Accepted: {
    badge: "bg-green-950/60 text-green-300 ring-1 ring-green-700/70",
    ping: "bg-green-600",
    dot: "bg-green-700",
  },
  Rejected: {
    badge: "bg-red-950/60 text-red-300 ring-1 ring-red-700/70",
    ping: "bg-red-600",
    dot: "bg-red-700",
  },
  Ghosted: {
    badge: "bg-yellow-950/60 text-yellow-300 ring-1 ring-yellow-700/70",
    ping: "bg-yellow-600",
    dot: "bg-yellow-700",
  },
  Applied: {
    badge: "bg-zinc-950/60 text-zinc-300 ring-1 ring-zinc-700/70",
    ping: "bg-zinc-600",
    dot: "bg-zinc-700",
  },
};

/**
 * Withdrawn has no styling in the Django template either -- the `{% if %}`
 * chain covers five of the six statuses -- so it falls through to the neutral
 * treatment rather than rendering an unstyled badge.
 */
const FALLBACK_STATUS = STATUS_STYLES.Applied;

const FACT_STYLES = {
  employment: "bg-purple-950/40 text-purple-300 ring-1 ring-purple-700/50",
  locationType: "bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-700/50",
  location: "bg-amber-950/40 text-amber-300 ring-1 ring-amber-700/50",
  salary: "bg-green-950/40 text-green-300 ring-1 ring-green-700/50",
  via: "bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-700/50",
} as const;

export function ApplicationCard({ application }: { application: Application }) {
  const status = STATUS_STYLES[application.status] ?? FALLBACK_STATUS;

  const facts = [
    application.employment_type && { key: "employment", label: application.employment_type },
    application.location_type && { key: "locationType", label: application.location_type },
    application.location && { key: "location", label: application.location },
    application.salary_range && { key: "salary", label: application.salary_range },
    application.applied_via && { key: "via", label: application.applied_via },
  ].filter(Boolean) as { key: keyof typeof FACT_STYLES; label: string }[];

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
                className={`inline-flex items-center rounded-full px-2 sm:px-2.5 py-1 text-xs font-medium whitespace-nowrap flex-shrink-0 ${status.badge}`}
              >
                <span className="relative flex h-1.5 w-1.5 mr-1.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.ping}`}
                  />
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${status.dot}`} />
                </span>
                {application.status}
              </span>
            </div>

            <Disclosure>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {facts.length > 0 ? (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {facts.map((fact) => (
                      <span
                        key={fact.key}
                        className={`inline-flex items-center px-2 py-1 rounded-md ${FACT_STYLES[fact.key]}`}
                      >
                        {fact.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  // Keeps the journey button on the right when there are no facts.
                  <div />
                )}

                <div className="flex-shrink-0">
                  <DisclosureButton className="toggle-pill cursor-pointer px-2 py-1 rounded-full" />
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

/** Django's `{{ step.timestamp|date:"M j, Y" }}` -- "Jan 23, 2026". */
function stepDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

/** Django's `{{ step.timestamp|time:"g:i A" }}` -- "8:55 PM". */
function stepTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Jakarta",
  }).format(date);
}
