"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { BlogSummary } from "@/lib/data/content";
import { isoDateTime, longDateTime } from "@/lib/utils/format";

/**
 * The featured-post slider at the top of the blog listing.
 *
 * A transform track with previous/next buttons, dot indicators and a five
 * second auto-advance, matching featuredSlider.js. An earlier version of this
 * port made it a scroll-snap row with no dots and no auto-advance -- the
 * indicators are how a reader knows there is more than one post up there at
 * all, so their absence was a real loss rather than a simplification.
 *
 * The dot class strings reproduce what the original's `classList.add`/`remove`
 * calls left on the element rather than a tidied equivalent.
 */

/** Matches featuredSlider.js. */
const INTERVAL_MS = 5000;

export function FeaturedSlider({ posts }: { posts: BlogSummary[] }) {
  const [index, setIndex] = useState(0);
  const reduceMotion = useRef(false);

  const count = posts.length;
  const multiple = count > 1;

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // `index` in the dependencies re-arms the timer after a manual move, which
  // is what the original did by calling startAutoSlide() from every click
  // handler. It stops entirely under `prefers-reduced-motion`, which the
  // original did not -- content that moves on its own is what that preference
  // is about, and the arrows and dots still work.
  useEffect(() => {
    if (!multiple || reduceMotion.current) return;
    const timer = window.setTimeout(() => setIndex((current) => (current + 1) % count), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, multiple, count]);

  if (count === 0) return null;

  const go = (next: number) => setIndex(((next % count) + count) % count);

  return (
    <div className="relative mb-4 sm:mb-6 overflow-hidden rounded-xl border border-zinc-800">
      <div className="featured-slider-container relative">
        <div
          className="featured-slider-wrapper flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {posts.map((post, position) => (
            <div key={post.slug} className="featured-slide group w-full flex-shrink-0 relative">
              <div className="absolute inset-0 photo-scrim z-10" />
              {post.image_url && (
                <Image
                  src={post.image_url}
                  alt={post.title}
                  width={1200}
                  height={480}
                  priority={position === 0}
                  className={IMAGE_CLASS}
                />
              )}

              <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-20">
                <div className="bg-lime-400 text-emerald-950 text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                    stroke="none"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z" />
                  </svg>
                  <span className="tracking-wider text-xs">FEATURED</span>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-20">
                <div className="flex items-center space-x-2 mb-2 sm:mb-3">
                  <time dateTime={isoDateTime(post.updated_at)} className="font-mono text-xs">
                    {longDateTime(post.updated_at)}
                  </time>
                </div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1 sm:mb-2">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-zinc-400 hover:after:w-full after:transition-all after:duration-300"
                  >
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm text-zinc-400 mb-2 sm:mb-4 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    {post.author_image && (
                      <Image
                        src={post.author_image}
                        alt={post.author}
                        width={50}
                        height={50}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover"
                      />
                    )}
                    <span className="text-xs sm:text-sm text-zinc-400">{post.author}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {multiple && (
          <>
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-30 flex space-x-1 sm:space-x-2">
              <button
                type="button"
                onClick={() => go(index - 1)}
                className="slider-nav prev cursor-pointer bg-zinc-900 hover:bg-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-l-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105"
                title="Previous Slide"
              >
                <ChevronIcon d="M15 19l-7-7 7-7" />
              </button>
              <button
                type="button"
                onClick={() => go(index + 1)}
                className="slider-nav next cursor-pointer bg-zinc-900 hover:bg-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-r-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105"
                title="Next Slide"
              >
                <ChevronIcon d="M9 5l7 7-7 7" />
              </button>
            </div>

            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-1 sm:space-x-2">
              {posts.map((post, position) => (
                <button
                  key={post.slug}
                  type="button"
                  onClick={() => go(position)}
                  aria-current={position === index}
                  className={position === index ? DOT_ACTIVE : DOT_IDLE}
                  title={`Slide ${position + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/*
 * Hovering the title softens and pushes back the photo behind it, so the words
 * you are reaching for come forward. The title is the slide's only link, so
 * `group-has-[a:hover]` on the image is enough to express it. The small scale
 * is paired with the blur for the same reason the project card pairs them: a
 * blur alone thins the outermost pixels and shows a seam at the frame's edge.
 */
const IMAGE_CLASS =
  "w-full h-60 sm:h-72 md:h-80 object-cover object-center transition-all duration-500 group-has-[a:hover]:scale-105 group-has-[a:hover]:blur-sm";

const DOT_ACTIVE =
  "slider-dot cursor-pointer bg-zinc-300 w-4 h-1.5 sm:h-2 rounded-full hover:bg-zinc-300 transition-all duration-300";
const DOT_IDLE =
  "slider-dot cursor-pointer bg-zinc-300/50 w-1.5 h-1.5 sm:h-2 rounded-full hover:bg-zinc-300 transition-all duration-300";

function ChevronIcon({ d }: { d: string }) {
  return (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}
