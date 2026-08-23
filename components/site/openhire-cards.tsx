import type { ReactNode } from "react";

/**
 * The building blocks of the OpenHire page.
 *
 * Sixteen sections share four shapes between them -- a bordered card with an
 * indigo icon, a label/value row, a pill tag and a bulleted line. The shapes
 * are defined once here; the sections that use them live in the page.
 */

/** The icon every section heading carries. Some are two-path outlines. */
export function SectionIcon({ paths }: { paths: readonly string[] }) {
  return (
    <svg
      className="w-5 h-5 mr-3 text-zinc-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      ))}
    </svg>
  );
}

/**
 * A bordered section.
 *
 * `badge` switches the heading to the two-column form the status and company
 * cards use -- the heading takes `flex-1` so the pill sits hard against the
 * right edge.
 */
export function SectionCard({
  title,
  paths,
  badge,
  children,
}: {
  title: string;
  paths: readonly string[];
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border border-zinc-700 rounded-lg p-4">
      {badge ? (
        <div className="flex flex-wrap items-start justify-between w-full gap-2 mb-3">
          <h2 className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 break-words flex-1 flex items-center">
            <SectionIcon paths={paths} />
            {title}
          </h2>
          {badge}
        </div>
      ) : (
        <h2 className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 break-words flex items-center mb-3">
          <SectionIcon paths={paths} />
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/**
 * The status pill in a section heading.
 *
 * Neutral, like every other availability marker on the site -- the same reason
 * given on `StatusChip` in `components/layout/status-badges.tsx`. It used to
 * carry an indigo gradient and a pulsing dot whose colour was passed in by the
 * caller and meant nothing beyond "this is the open-to-work one".
 */
export function StatusPill({ text }: { text: string }) {
  return (
    <span className="inline-flex flex-shrink-0 items-center text-xs text-zinc-400 px-2 py-1 rounded-full border border-zinc-700 whitespace-nowrap">
      {text}
    </span>
  );
}

/**
 * One label/value row.
 *
 * `muted` is the default because almost every value is `text-zinc-400`; the
 * two rows that colour their own value (Remote Work, Relocation) turn it off
 * and supply the colour themselves.
 */
export function DetailRow({
  label,
  muted = true,
  children,
}: {
  label: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-2 bg-zinc-800/30 rounded">
      <span className="font-medium text-sm">{label}</span>
      <span className={`text-sm ${muted ? "text-zinc-400 " : ""}mt-1 sm:mt-0`}>{children}</span>
    </div>
  );
}

/** A yes/no value, coloured rather than muted. */
export function YesNo({ yes, on, off }: { yes: boolean; on: string; off: string }) {
  return yes ? (
    <span className="text-emerald-400">{on}</span>
  ) : (
    <span className="text-red-400">{off}</span>
  );
}

/** The pill list used for roles, skills, locations and position requirements. */
export function TagList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <div className={`flex flex-wrap gap-2${className ? ` ${className}` : ""}`}>
      {items.map((item) => (
        <span
          key={item}
          className="px-2 py-1 bg-zinc-800/50 text-zinc-300 rounded-full text-xs border border-zinc-700/50"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

/**
 * The bulleted lines used by culture, requirements, responsibilities and
 * benefits. `dotClass` is the only thing that varies -- benefits are emerald,
 * everything else zinc.
 */
export function BulletLines({
  items,
  dotClass = "bg-zinc-400",
}: {
  items: string[];
  dotClass?: string;
}) {
  return (
    <div className="space-y-1 ml-1">
      {items.map((item) => (
        <div key={item} className="flex items-start group">
          <div className="flex-shrink-0 w-3 h-3 mt-0.5">
            <div className={`w-1.5 h-1.5 ${dotClass} rounded-full mt-1`} />
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">{item}</p>
        </div>
      ))}
    </div>
  );
}

/** Every heading icon on the page, named by what it depicts. */
export const ICON = {
  user: "M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  briefcase:
    "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  lightbulb:
    "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  idCard:
    "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2",
  translate:
    "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
  pinOuter: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z",
  pinInner: "M15 11a3 3 0 11-6 0 3 3 0 016 0z",
  cogOuter:
    "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  cogInner: "M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  building:
    "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  clipboard:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
  users:
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
  shield:
    "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  code: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
  mail: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  info: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
  document:
    "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  coin: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
} as const;
