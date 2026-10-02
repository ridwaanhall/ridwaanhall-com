import { RAIL_ASIDE, RAIL_GRID, RAIL_MAIN } from "@/lib/ui/shapes";
import { cn } from "@/lib/utils/cn";

/**
 * A page in two columns, from `lg` up.
 *
 * **This is what the extra width is for.** When the sidebar became a navbar the
 * content column went from about 904px to 1216px, and a page that answers that
 * by making its lines longer is a page that got harder to read. The width goes
 * into a second column instead: the reading column stays near its measure and
 * the rail widens as the page does.
 *
 * **The rail is written first and drawn second.** It is placed into column two
 * by `lg:col-start-2`, so on a phone it reads *before* the content -- which is
 * right, because below `lg` it is a section index rather than an aside, and
 * being able to see where you are going belongs at the top. One node either
 * way: a rail rendered twice is two of everything for a screen reader.
 *
 * **`lg` is the navbar's own threshold**, deliberately. Below it the navigation
 * is behind a hamburger and the page is one column; the rail's disappearance
 * and the nav's collapse are the same moment, not two nearby ones.
 *
 * Two things about the sticky are easy to lose and silent when lost: a grid
 * item is stretched to its row unless told otherwise, and something already as
 * tall as its container never sticks; and any ancestor taking `overflow-hidden`
 * disables it outright. Both live in `RAIL_ASIDE`'s note.
 */
export function RailLayout({
  rail,
  below = "drop",
  children,
  className,
}: {
  rail: React.ReactNode;
  /**
   * What the rail does below `lg`.
   *
   * `"drop"` hides it, for a rail whose contents are all reachable another way
   * -- a table of contents when the headings are right there, a filter when the
   * search box is in the page. `"lead"` keeps it above the content, for a rail
   * that is the only way between sections.
   */
  below?: "drop" | "lead";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(RAIL_GRID, className)}>
      <aside
        className={cn(RAIL_ASIDE, below === "drop" ? "hidden lg:block" : "mb-stack lg:mb-0")}
      >
        {rail}
      </aside>
      <div className={RAIL_MAIN}>{children}</div>
    </div>
  );
}

/**
 * A list of places in the page, as the rail draws them.
 *
 * Below `lg` it is a row that scrolls sideways; from `lg` it is a column. One
 * list, two axes -- which is why the entries carry no margin of their own and
 * the container owns the spacing in both directions.
 */
export function RailNav({
  children,
  label,
  className,
}: {
  children: React.ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      <ul className="flex gap-1 overflow-x-auto scrollbar-hide lg:flex-col lg:gap-0.5 lg:overflow-visible">
        {children}
      </ul>
    </nav>
  );
}

/**
 * One entry.
 *
 * The current one is marked with a rule down its inside edge and a lighter
 * weight of text -- `aria-current` says the same thing to anything not looking
 * at it. This replaced a bar whose position and width were measured from the
 * active button's box on every resize; a rule that belongs to the entry needs
 * no measuring, and cannot be one frame out of date.
 */
export function RailNavItem({
  children,
  current = false,
  ...rest
}: {
  children: React.ReactNode;
  current?: boolean;
} & React.ComponentPropsWithoutRef<"button">) {
  return (
    <li>
      <button
        type="button"
        aria-current={current ? "page" : undefined}
        className={cn(
          "w-full cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-left text-meta transition-colors",
          "lg:rounded-none lg:border-l-2 lg:pl-3",
          current
            ? "bg-zinc-800 text-zinc-100 lg:border-zinc-400 lg:bg-transparent"
            : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 lg:border-zinc-800 lg:hover:bg-transparent",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
        )}
        {...rest}
      >
        {children}
      </button>
    </li>
  );
}

/** The heading a rail's list sits under. Quiet: it labels, it does not compete. */
export function RailHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 text-caption font-medium text-zinc-500">{children}</h2>;
}
