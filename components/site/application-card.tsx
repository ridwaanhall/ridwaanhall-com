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

/**
 * The icon on each fact badge.
 *
 * Five different glyphs in the original, three of them stroke outlines and
 * two solid shapes lifted from icon sets with their own viewBoxes -- which is
 * why this is a table of specs rather than five inline SVGs. The port had the
 * colours but dropped the icons entirely.
 */
const FACT_ICONS: Record<
  keyof typeof FACT_STYLES,
  { viewBox: string; filled?: boolean; paths: string[] }
> = {
  employment: {
    viewBox: "0 0 950 950",
    filled: true,
    paths: [
      "M0,517.352c0,13.211,8.243,25.019,20.644,29.57l56.499,20.742c4.25-10.152,10.483-19.666,18.735-27.918 c16.486-16.486,38.406-25.566,61.722-25.566c23.315,0,45.235,9.08,61.722,25.566l172.915,172.914 c24.33,24.33,31.256,59.563,20.8,90.115c25.141,18.411,58.865,21.584,87.34,7.268L738.185,690.48 c38.854-19.532,54.917-64.051,41.763-102.336c-0.108,0-0.219,0.004-0.325,0.004c-31.656,0-61.48-13.911-81.826-38.168 L534.089,354.8l-23.117,23.117c-16.206,16.204-37.751,25.131-60.67,25.131c-22.918,0-44.465-8.925-60.67-25.131l-7.884-7.885 c-16.206-16.206-25.13-37.752-25.13-60.671c0-22.918,8.925-44.464,25.13-60.67l65.64-65.64l-13.702-16.334 c-25.049-30.156-67.626-38.977-102.594-21.253l-178.495,90.47L43.26,191.946c-20.7-8.328-43.258,6.911-43.258,29.224v296.182H0z",
      "M950,504.524v-242.43c0-17.397-14.104-31.5-31.5-31.5H779L635.51,127.021c-14.771-10.662-31.996-15.891-49.138-15.891 c-21.646,0-43.158,8.339-59.424,24.604l-64.854,64.853l-64.227,64.227c-24.604,24.603-24.604,64.493,0,89.096l7.884,7.885 c12.301,12.302,28.425,18.452,44.548,18.452c16.124,0,32.247-6.15,44.548-18.452l40.716-40.715l179.699,214.248 c13.398,15.975,31.974,26.096,51.916,29.086c4.103,0.615,8.26,0.936,12.441,0.936c6.003,0,12.06-0.646,18.064-1.969 l127.589-28.094C939.714,532.108,950,519.313,950,504.524z",
      "M284.914,819.983c12.592,12.593,29.096,18.888,45.6,18.888c16.504,0,33.009-6.295,45.601-18.888 c9.826-9.825,15.799-22.036,17.958-34.768c3.374-19.898-2.601-41.074-17.958-56.434L203.2,555.868 c-12.592-12.592-29.096-18.888-45.6-18.888s-33.008,6.296-45.6,18.888l0,0c-5.84,5.842-10.308,12.528-13.439,19.66 c-10.372,23.627-5.904,52.196,13.439,71.539L284.914,819.983z",
    ],
  },
  locationType: {
    viewBox: "0 0 24 24",
    paths: [
      "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    ],
  },
  location: {
    viewBox: "0 0 24 24",
    paths: [
      "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
      "M15 11a3 3 0 11-6 0 3 3 0 016 0z",
    ],
  },
  salary: {
    viewBox: "0 0 32 32",
    filled: true,
    paths: [
      "M18.314,25l-5.849,5.849c-0.391,0.391-0.902,0.586-1.414,0.586s-1.024-0.195-1.414-0.586L3.787,25H18.314 z M28.213,7l-5.849-5.849c-0.391-0.391-0.902-0.586-1.414-0.586s-1.024,0.195-1.414,0.586L13.686,7H28.213z M16,11 c-2.949,0-4,2.583-4,5c0,2.417,1.051,5,4,5s4-2.583,4-5C20,13.583,18.949,11,16,11z M31,22c0,1.105-0.895,2-2,2 c0,0-26.158-0.015-26.237-0.024c-0.923-0.11-1.647-0.844-1.742-1.771C1.014,22.136,1,10,1,10c0-1.105,0.895-2,2-2 c0,0,26.158,0.015,26.237,0.024c0.923,0.11,1.647,0.844,1.742,1.771C30.986,9.864,31,22,31,22z M5,21c0-0.552-0.448-1-1-1 s-1,0.448-1,1c0,0.552,0.448,1,1,1S5,21.552,5,21z M5,11c0-0.552-0.448-1-1-1s-1,0.448-1,1c0,0.552,0.448,1,1,1S5,11.552,5,11z M21,16c0-3.314-1.686-6-5-6s-5,2.686-5,6s1.686,6,5,6S21,19.314,21,16z M29,21c0-0.552-0.448-1-1-1s-1,0.448-1,1 c0,0.552,0.448,1,1,1S29,21.552,29,21z M29,11c0-0.552-0.448-1-1-1s-1,0.448-1,1c0,0.552,0.448,1,1,1S29,11.552,29,11z",
    ],
  },
  via: {
    viewBox: "0 0 24 24",
    paths: [
      "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    ],
  },
};

function FactIcon({ kind }: { kind: keyof typeof FACT_STYLES }) {
  const icon = FACT_ICONS[kind];
  return (
    <svg
      className="w-3 h-3 mr-1"
      viewBox={icon.viewBox}
      fill={icon.filled ? "currentColor" : "none"}
      stroke={icon.filled ? undefined : "currentColor"}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {icon.paths.map((d) =>
        icon.filled ? (
          <path key={d} d={d} />
        ) : (
          <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
        ),
      )}
    </svg>
  );
}
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
                        <FactIcon kind={fact.key} />
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
