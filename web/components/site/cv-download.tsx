import { AboutBanner } from "@/components/site/about-banner";

/**
 * The CV download banner at the top of the about page's Intro tab.
 *
 * Django carried two copies of this -- `block md:hidden` for a stacked layout
 * and `hidden md:flex` for a side-by-side one -- differing only in flex
 * direction and the width of the button group. One responsive container says
 * the same thing, and it now lives in `<AboutBanner>`, shared with the
 * certifications banner.
 *
 * The three links go through this site's own `/cv`, `/cv-latest` and `/cv-copy`
 * routes rather than at the hosted files directly, so the destination can
 * change in the admin without breaking a link someone has already shared.
 */
const FORMATS = [
  { href: "/cv", label: "PDF", icon: DownloadIcon },
  { href: "/cv-latest", label: "Word", icon: DocumentIcon },
  { href: "/cv-copy", label: "Copy CV", icon: CopyIcon },
] as const;

export function CvDownload() {
  return (
    <AboutBanner
      icon={
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
      }
      title="Curriculum Vitae"
      subtitle="Access my CV in different formats"
      actions={[...FORMATS]}
      note="View in PDF, Word format, or get the editable template"
    />
  );
}

function DownloadIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function DocumentIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}
