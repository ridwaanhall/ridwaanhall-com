import Image from "next/image";
import Link from "next/link";

import type { BlogPost, BlogSummary } from "@/lib/data/content";
import { isoDateTime, longDate, slugify } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * A blog card.
 *
 * One component with a `variant`, not two near-identical copies of the markup:
 * the home page's slider and the blog listing differ only in padding and the
 * heading's size and weight.
 *
 * The date/"Read more" swap on hover is CSS-only and stays that way: it is an
 * affordance, not a label, so unlike a tooltip it has nothing to expose on
 * touch. Both spans are absolutely positioned in the same slot and cross-fade.
 */
export function BlogCard({
  blog,
  variant = "grid",
  priority = false,
}: {
  blog: BlogPost | BlogSummary;
  variant?: "grid" | "slider";
  /**
   * Set on the first card of a list, which is the one above the fold and so the
   * candidate for Largest Contentful Paint. Left off, Next loads it lazily and
   * says so in the console on every render of the home page.
   */
  priority?: boolean;
}) {
  const slider = variant === "slider";
  const tags = blog.tags.map(String);

  return (
    <Link href={`/blog/${blog.slug}`}>
      <div
        style={{ height: 350 }}
        className="group relative overflow-hidden rounded-xl border border-zinc-700 transition-all duration-300 transform h-full"
      >
        <div className="absolute inset-0">
          {blog.image_url && (
            <Image
              src={blog.image_url}
              alt={slider ? `Featured image for blog: ${blog.title}` : blog.title}
              width={300}
              height={300}
              priority={priority}
              className="w-full h-full object-cover group-hover:scale-105 group-hover:blur-sm transition-all duration-500"
            />
          )}
          {/* A bottom-anchored fade so the text below stays legible over
              arbitrary photography. Themed by hand, not from the palette --
              its contrast is against the image, not against a surface. */}
          <div className="absolute inset-0 photo-scrim" />
        </div>

        <div className={cn("relative z-10 flex flex-col h-full", slider ? "p-4 sm:p-4" : "p-3 sm:p-4")}>
          <div className="flex flex-wrap gap-1 mb-2 sm:mb-4">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium rounded-full bg-zinc-900 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono"
              >
                #{slugify(tag)}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs font-medium rounded-full bg-zinc-900 px-2 py-0.5 sm:px-2.5 sm:py-1 font-mono">
                +{tags.length - 3}
              </span>
            )}
          </div>

          <div className="flex-grow" />

          <h3
            className={cn(
              "mb-1 sm:mb-2 line-clamp-2 relative inline-block",
              slider ? "text-lg font-medium" : "text-base sm:text-lg font-semibold",
            )}
          >
            <span className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current group-hover:after:w-full after:transition-all after:duration-300">
              {blog.title}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 sm:line-clamp-3 mb-2">
            {blog.description}
          </p>

          <div className="mt-auto">
            <hr className="border-t border-zinc-500 w-full mb-2 sm:mb-3" />

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1 sm:space-x-2">
                {blog.author_image && (
                  <Image
                    src={blog.author_image}
                    alt={`Profile photo of ${blog.author}`}
                    width={50}
                    height={50}
                    className="rounded-full w-4 h-4 sm:w-5 sm:h-5"
                  />
                )}
                <span className="text-xs sm:text-sm text-zinc-400 truncate max-w-[100px] sm:max-w-[150px]">
                  {blog.author}
                </span>
              </div>

              <div className="flex items-center min-w-[110px] sm:min-w-[150px] relative">
                <span className="transition-all duration-300 transform group-hover:opacity-0 group-hover:translate-y-4 group-hover:pointer-events-none opacity-100 pointer-events-auto translate-y-0 absolute left-0 w-full flex justify-end">
                  <time dateTime={isoDateTime(blog.created_at)} className="text-xs text-zinc-400">
                    {longDate(blog.created_at)}
                  </time>
                </span>
                <span className="transition-all text-zinc-400 duration-300 transform group-hover:opacity-100 group-hover:translate-y-0 opacity-0 pointer-events-none group-hover:pointer-events-auto -translate-y-4 flex items-center text-xs sm:text-sm absolute left-0 w-full justify-end">
                  Read more
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="ml-1 h-3 w-3 sm:h-4 sm:w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
