"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import type { BlogSummary } from "@/lib/data/content";
import { isoDateTime, longDateTime } from "@/lib/utils/format";

/**
 * The featured-post slider at the top of the blog listing.
 *
 * A scroll-snap row rather than a transform track: the previous/next buttons
 * scroll it, and swiping does the same thing for free. That also means the
 * slides are real content in the document -- a transform-based carousel with
 * one slide visible tends to leave the rest reachable only by script.
 *
 * Unlike the homepage row this does not auto-advance. It did not before either;
 * the buttons are the only way it moves.
 */
export function FeaturedSlider({ posts }: { posts: BlogSummary[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  if (posts.length === 0) return null;

  const go = (delta: number) => {
    const track = trackRef.current;
    if (!track) return;
    // Wrap at both ends, matching the original.
    const next = (index + delta + posts.length) % posts.length;
    setIndex(next);
    track.scrollTo({ left: track.clientWidth * next, behavior: "smooth" });
  };

  return (
    <div className="relative mb-4 sm:mb-6 overflow-hidden rounded-xl border border-zinc-800">
      <div className="relative">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide"
          onScroll={(event) => {
            const track = event.currentTarget;
            setIndex(Math.round(track.scrollLeft / track.clientWidth));
          }}
        >
          {posts.map((post, i) => (
            <div key={post.slug} className="w-full flex-shrink-0 snap-center relative">
              <div className="absolute inset-0 photo-scrim z-10" />
              {post.image_url && (
                <Image
                  src={post.image_url}
                  alt={post.title}
                  width={1200}
                  height={480}
                  priority={i === 0}
                  className="w-full h-60 sm:h-72 md:h-80 object-cover object-center"
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

        {posts.length > 1 && (
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-30 flex space-x-1 sm:space-x-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="slider-nav prev cursor-pointer bg-zinc-900 hover:bg-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-l-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105"
              title="Previous Slide"
              aria-label="Previous slide"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="slider-nav next cursor-pointer bg-zinc-900 hover:bg-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-r-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105"
              title="Next Slide"
              aria-label="Next slide"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
