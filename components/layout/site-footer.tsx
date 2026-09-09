import { SmallPrint } from "@/components/layout/small-print";
import type { AboutData } from "@/lib/data/about";

/**
 * The site's footer, and the first one it has had.
 *
 * The legal links and the copyright used to live at the foot of the desktop
 * sidebar, which is where a column puts them and nowhere a row can. Losing the
 * column meant they needed a home; a footer is the one every other site would
 * have looked for first.
 *
 * **Full-bleed rule, aligned contents.** The element spans the viewport so its
 * top edge reads as the end of the page rather than as the end of a box, and its
 * inner row carries the same cap and the same gutter as the navbar and as every
 * page between them -- one element with both, because a cap wrapping a gutter
 * indents the contents by the gutter and the three would no longer line up.
 *
 * It sits outside `#page-content` deliberately. That element is keyed on the
 * pathname so its entrance animation replays per navigation, and the small print
 * is not news: inside it, the copyright would fade in again on every click.
 */
export function SiteFooter({ about }: { about: AboutData }) {
  return (
    <footer className="border-t border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <SmallPrint about={about} variant="page" />
      </div>
    </footer>
  );
}
