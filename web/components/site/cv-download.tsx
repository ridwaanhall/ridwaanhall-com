import Link from "next/link";

/**
 * The CV download card on the about page.
 *
 * Django carried two copies of this -- `block md:hidden` for a stacked layout
 * and `hidden md:flex` for a side-by-side one -- differing only in flex
 * direction and the width of the button group. One responsive container says
 * the same thing.
 *
 * The three links go through this site's own `/cv`, `/cv-latest` and `/cv-copy`
 * routes rather than at the hosted files directly, so the destination can
 * change in the admin without breaking a link someone has already shared.
 */
const FORMATS = [
  { href: "/cv", label: "PDF", icon: DownloadIcon },
  { href: "/cv-latest", label: "Word", icon: DocumentIcon },
  { href: "/cv-copy", label: "Copy", icon: CopyIcon },
] as const;

export function CvDownload() {
  return (
    <div className="mb-6 p-4 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Curriculum Vitae</h3>
            <p className="text-xs text-zinc-400 mt-1">Access my CV in different formats</p>
          </div>
        </div>

        <div className="flex gap-2 md:w-1/2">
          {FORMATS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex-1 inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700/50 transition-all duration-200"
            >
              <Icon />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <svg
          className="w-3 h-3 text-zinc-400 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-xs text-zinc-400">
          View in PDF, Word format, or get the editable template
        </p>
      </div>
    </div>
  );
}

const ICON_CLASS = "w-3.5 h-3.5 mr-1 group-hover:scale-110 transition-transform duration-200";

function DownloadIcon() {
  return (
    <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className={ICON_CLASS} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
