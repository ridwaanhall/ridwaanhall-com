import Link from "next/link";

import type { PostRow } from "@/components/foothill/rows";
import { shortDate } from "@/lib/site/display";
import { cn } from "@/lib/utils/cn";

/**
 * Posts as ruled rows: date, title, then what kind of post and how long.
 *
 * `showYear` off is for a list already grouped under a year heading, where
 * repeating the year in every row is noise.
 */
export function PostList({
  posts,
  className,
  dateStyle = "full",
}: {
  posts: PostRow[];
  className?: string;
  dateStyle?: "full" | "day";
}) {
  return (
    <ul data-fh-reveal data-fh-stagger className={cn("border-b border-line", className)}>
      {posts.map((post) => (
        <li key={post.slug} className="border-t border-line">
          <Link
            href={`/blog/${post.slug}`}
            className="group grid grid-cols-1 gap-y-1.5 py-5 md:grid-cols-[9rem_minmax(0,1fr)_auto] md:items-baseline md:gap-x-8 md:py-6"
          >
            <time
              dateTime={post.date.toISOString()}
              className="fh-mono text-[12px] text-mute tabular-nums"
            >
              {dateStyle === "full"
                ? shortDate(post.date)
                : shortDate(post.date).replace(/, \d{4}$/, "")}
            </time>
            <span>
              <span className="block text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-snug font-medium tracking-[-0.015em] text-ink decoration-sulfur-mark decoration-1 underline-offset-[5px] group-hover:underline">
                {post.title}
              </span>
              <span className="mt-1.5 line-clamp-2 block max-w-[62ch] text-[15px] leading-relaxed text-mute">
                {post.description}
              </span>
            </span>
            <span className="fh-mono text-[12px] text-mute md:text-right">
              {post.category} · {post.minutes} min
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
