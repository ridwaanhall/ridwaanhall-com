import { AboutBanner, BannerAction } from "@/components/site/about-banner";

/**
 * The banner at the top of the about page's Certifications tab.
 *
 * The page lists a selection; LinkedIn holds the complete record. This used to
 * be its own design -- a `bg-zinc-800/30` fill, `text-blue-200`/`text-blue-300`
 * type instead of the zinc scale every other card uses, an indigo icon, and a
 * plain `flex items-center` row that never stacked, so at phone widths the
 * button squeezed the two lines of text beside it into a narrow column. It is
 * the CV banner's shell now, so the two tabs open the same way.
 *
 * The LinkedIn glyph is kept as its own 24-viewBox path rather than reusing the
 * search palette's `LinkedInIcon`, which is drawn on a 16 viewBox and is a
 * visibly different mark.
 */
export function LinkedInCertifications({
  username,
  count,
}: {
  username: string;
  /** How many certifications the page itself lists, for the footnote. */
  count: number;
}) {
  return (
    <AboutBanner
      icon={
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-zinc-400"
          fill="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      }
      title="View All 115+ Certifications"
      subtitle="See my complete certification portfolio on LinkedIn"
      actions={
        <BannerAction
          href={`https://linkedin.com/in/${username}/details/certifications/`}
          label="View on LinkedIn"
          icon={ExternalArrowIcon}
          external
        />
      }
      note={`Showing ${count} here; the full record lives on LinkedIn`}
    />
  );
}

function ExternalArrowIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
