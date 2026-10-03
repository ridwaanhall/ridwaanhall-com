import type { Route } from "next";
import Link from "next/link";

import type { Paginated } from "@/lib/api/pagination";
import { listingHref } from "@/lib/site/listing";
import { cn } from "@/lib/utils/cn";

/**
 * Page links under a listing. Real links, so every page is crawlable and
 * the back button behaves; page 1 carries no `?page`.
 */
export function Pagination({
  result,
  basePath,
  query,
}: {
  result: Pick<Paginated<unknown>, "page" | "pages" | "has_previous" | "has_next" | "page_range">;
  basePath: "/blog" | "/projects";
  query: string;
}) {
  if (result.pages <= 1) return null;
  const href = (page: number) => listingHref(basePath, query, page) as Route;
  const edge = "fh-mono text-[12px] tracking-[0.08em] uppercase transition-colors";

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-between gap-6">
      {result.has_previous ? (
        <Link href={href(result.page - 1)} className={cn(edge, "text-ink hover:text-sulfur")} rel="prev">
          ← Newer
        </Link>
      ) : (
        <span className={cn(edge, "text-line")}>← Newer</span>
      )}
      <ul className="flex items-center gap-1">
        {result.page_range.map((entry, index) =>
          entry === "..." ? (
            <li key={`gap-${index}`} className="fh-mono px-1 text-[12px] text-mute">
              …
            </li>
          ) : (
            <li key={entry}>
              <Link
                href={href(entry)}
                aria-current={entry === result.page ? "page" : undefined}
                className={cn(
                  "fh-mono flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-[12px] tabular-nums transition-colors",
                  entry === result.page ? "bg-ink text-paper" : "text-mute hover:text-ink",
                )}
              >
                {entry}
              </Link>
            </li>
          ),
        )}
      </ul>
      {result.has_next ? (
        <Link href={href(result.page + 1)} className={cn(edge, "text-ink hover:text-sulfur")} rel="next">
          Older →
        </Link>
      ) : (
        <span className={cn(edge, "text-line")}>Older →</span>
      )}
    </nav>
  );
}
