import type { Heading } from "@/lib/utils/toc";
import { cn } from "@/lib/utils/cn";

/**
 * The article's own headings, as links.
 *
 * Anchors rather than buttons: these go somewhere, they work with the keyboard
 * and the middle mouse button for free, and they survive with no JavaScript at
 * all. The landing offset is `scroll-margin-top` in `styles/components.css`,
 * which has to be a stylesheet rule because the targets are headings inside
 * stored HTML that no class of ours can reach.
 *
 * Nothing highlights the section you are in. That wants an observer and a
 * client component, and a contents list is useful before it has one -- so it
 * ships without, rather than shipping a worse version of the page to get it.
 */
export function TocNav({ headings }: { headings: Heading[] }) {
  if (headings.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <h2 className="mb-2 text-caption font-medium text-zinc-500">On this page</h2>
      <ul className="space-y-0.5 border-l border-zinc-800">
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "block border-l-2 border-transparent py-1 text-meta text-zinc-400 transition-colors",
                "hover:border-zinc-600 hover:text-zinc-200",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
                // A sub-heading is indented rather than made smaller: two sizes
                // in a list this short reads as two lists.
                heading.level === 3 ? "-ml-px pl-6" : "-ml-px pl-3",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
