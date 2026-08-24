"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { BlogCard } from "@/components/site/blog-card";
import type { BlogSummary } from "@/lib/data/content";

/**
 * The homepage's auto-advancing row of recent posts.
 *
 * A plain horizontally-scrolling flex row, not a carousel library: it has no
 * pagination, no transform track and no slide indices -- it scrolls, and the
 * timer nudges `scrollLeft`. Embla would be more code and more behaviour than
 * this needs, and native scrolling keeps the swipe, the momentum and the
 * keyboard for free.
 *
 * Auto-advance pauses on hover and on touch, as it did before, and stops
 * entirely under `prefers-reduced-motion` -- content that moves on its own with
 * no way to stop it is exactly what that preference is about.
 */
const SLIDE_INTERVAL_MS = 6000;
const CARD_WIDTH_PX = 285;

export function LatestBlogs({ blogs }: { blogs: BlogSummary[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const slider = sliderRef.current;
    if (!slider) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number | undefined;

    const slideNext = () => {
      const maxScroll = slider.scrollWidth - slider.clientWidth;
      // Wrap back to the start rather than stalling at the end.
      if (slider.scrollLeft >= maxScroll - 1) {
        slider.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        slider.scrollBy({ left: CARD_WIDTH_PX, behavior: "smooth" });
      }
    };

    const start = () => {
      stop();
      timer = window.setInterval(slideNext, SLIDE_INTERVAL_MS);
    };
    const stop = () => {
      if (timer !== undefined) window.clearInterval(timer);
      timer = undefined;
    };

    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", start);
    slider.addEventListener("touchstart", stop, { passive: true });
    slider.addEventListener("touchend", start, { passive: true });
    start();

    return () => {
      stop();
      slider.removeEventListener("mouseenter", stop);
      slider.removeEventListener("mouseleave", start);
      slider.removeEventListener("touchstart", stop);
      slider.removeEventListener("touchend", start);
    };
  }, []);

  if (blogs.length === 0) return null;

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
        <h2 className="text-xl sm:text-2xl font-medium">
          Latest Blogs
        </h2>
        <Link
          href="/blog"
          className="group flex items-center hover:text-zinc-200 transition-colors duration-300"
        >
          <span className="transform transition-transform duration-300 group-hover:-translate-x-1">
            View All
          </span>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 ml-1 transition-transform duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>

      <div className="relative mb-6 sm:mb-6 md:mb-8 lg:mb-8">
        <div
          ref={sliderRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
        >
          {blogs.map((blog, position) => (
            <div key={blog.slug} className="flex-none w-80">
              {/* The leftmost card is the home page's Largest Contentful Paint. */}
              <BlogCard blog={blog} variant="slider" priority={position === 0} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
