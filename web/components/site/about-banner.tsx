import Link from "next/link";
import type { Route } from "next";

/**
 * The banner that opens an about-page tab.
 *
 * Two tabs lead with the same object: an icon, a title, a one-line subtitle, a
 * group of action buttons and a footnote. The Intro tab's is the CV download;
 * the Certifications tab's points at the full list on LinkedIn. They were
 * written twice and had drifted into two different designs -- the LinkedIn one
 * had a tinted fill, blue type instead of the zinc scale, and a row that never
 * stacked, so on a phone the button crushed the text it sat beside. One shell
 * is what stops that happening again.
 *
 * The body is `flex-col` below `md`. That is the load-bearing half: an icon, two
 * lines of text and a button group do not fit on one line in a phone-width
 * column, and squeezing them is what the certifications banner used to do.
 */
export function AboutBanner({
  icon,
  title,
  subtitle,
  actions,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  /** One or more `<BannerAction>`; they share the row and each takes an equal share. */
  actions: React.ReactNode;
  note: React.ReactNode;
}) {
  return (
    <div className="mb-6 p-4 rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1 flex items-center gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">{title}</h3>
            <p className="text-xs text-zinc-400 mt-1">{subtitle}</p>
          </div>
        </div>

        <div className="flex gap-2 md:w-1/2">{actions}</div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <InfoIcon />
        <p className="text-xs text-zinc-400">{note}</p>
      </div>
    </div>
  );
}

/**
 * One action button in a banner's row.
 *
 * `external` is what picks the element: an off-site destination is a plain
 * anchor opening in a new tab, everything else goes through `next/link` so the
 * route is type-checked and the navigation stays client-side.
 */
export function BannerAction({
  href,
  label,
  icon: Icon,
  external,
}: {
  href: string;
  label: string;
  /** Rendered with `BANNER_ACTION_ICON` so every banner's glyphs match. */
  icon: (props: { className: string }) => React.ReactNode;
  external?: boolean;
}) {
  const className =
    "group flex-1 inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700/50 transition-all duration-200";
  const content = (
    <>
      <Icon className={BANNER_ACTION_ICON} />
      {label}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href as Route} className={className}>
      {content}
    </Link>
  );
}

const BANNER_ACTION_ICON =
  "w-3.5 h-3.5 mr-1 group-hover:scale-110 transition-transform duration-200";

/** The circled `i` on every banner's footnote row. */
function InfoIcon() {
  return (
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
  );
}
