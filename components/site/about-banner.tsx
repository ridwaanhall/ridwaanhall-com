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
 *
 * **Actions are passed as data, not as nodes**, so the row can size itself from
 * how many there are rather than taking a flag the caller could set wrong: a
 * lone button hugs its label, while several share a half-width row and split it
 * evenly. Rendering `<BannerAction>` from the caller would need that decision
 * duplicated on both sides -- and these are server components, so there is no
 * context to carry it.
 */
export type BannerAction = {
  href: string;
  label: string;
  /** Sized by the banner, so every action's glyph matches. */
  icon: (props: { className: string }) => React.ReactNode;
  /** Off-site: a plain anchor in a new tab rather than a typed `next/link`. */
  external?: boolean;
};

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
  actions: BannerAction[];
  note: React.ReactNode;
}) {
  const share = actions.length > 1;

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

        {/* The text block above is `flex-1`, so a content-width row lands at the
            right-hand end on its own -- no `ml-auto` needed. */}
        <div className={share ? "flex gap-2 md:w-1/2" : "flex gap-2"}>
          {actions.map((action) => (
            <Action key={action.href} action={action} share={share} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <InfoIcon />
        <p className="text-xs text-zinc-400">{note}</p>
      </div>
    </div>
  );
}

function Action({ action, share }: { action: BannerAction; share: boolean }) {
  const { href, label, icon: Icon, external } = action;
  const className = [
    share ? "flex-1" : "",
    "group inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-medium rounded-md border border-zinc-600 hover:border-zinc-500 hover:bg-zinc-700/50 transition-all duration-200",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <Icon className={ACTION_ICON} />
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

const ACTION_ICON = "w-3.5 h-3.5 mr-1 group-hover:scale-110 transition-transform duration-200";

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
