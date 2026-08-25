"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImageLightbox, type LightboxImage } from "@/components/site/image-lightbox";

/**
 * The Mac-window image frame used by blog posts and projects.
 *
 * A single image gets the frame -- three traffic-light dots and the filename in
 * a header strip. Several get a transform track inside it with prev/next
 * buttons, dot indicators and an auto-advance, and the header's filename
 * follows whichever slide is showing.
 *
 * One component with a `variant`, not two near-identical sliders of 120 lines
 * each differing in three class prefixes and the auto-advance interval.
 *
 * The dot class strings look redundantly specific and are copied deliberately:
 * they reproduce what the original's `classList.add`/`remove` calls left on the
 * element, including the fact that a project's active dot keeps `sm:w-2` and so
 * is *not* elongated above 640px, while a blog's is. Simplifying them would
 * silently change the indicator.
 */

type Variant = "blog" | "project";

/** Auto-advance interval, per the two sliders this replaces. */
const INTERVAL_MS: Record<Variant, number> = { blog: 4000, project: 5000 };

export function MediaGallery({
  images,
  names,
  alt,
  variant,
  className,
}: {
  images: string[];
  names: string[];
  alt: string;
  variant: Variant;
  /** The outer wrapper's classes -- the two pages wrap the gallery differently. */
  className: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [lightboxAt, setLightboxAt] = useState<number | null>(null);
  const reduceMotion = useRef(false);

  const count = images.length;
  const multiple = count > 1;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // `index` in the dependencies is what restarts the timer after a manual
  // move, which is what the original did by calling startAutoSlide() from
  // every click handler. A timeout rather than an interval, for the same
  // reason: it is re-armed from scratch on each change.
  //
  // It also stops entirely under `prefers-reduced-motion`, which neither
  // original did -- content that moves on its own is exactly what that
  // preference is about, and the arrows and dots still work.
  useEffect(() => {
    if (!multiple || paused || lightboxAt !== null || reduceMotion.current) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS[variant]);
    return () => window.clearTimeout(timer);
  }, [index, multiple, paused, lightboxAt, variant, go]);

  if (count === 0) return null;

  const lightboxImages: LightboxImage[] = images.map((src, position) => ({
    src,
    alt: `${alt} — image ${position + 1} of ${count}`,
    filename: names[position] || `image-${position + 1}`,
  }));

  const frame = (
    <div className="gallery-frame">
      <div className="gallery-header">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 hover:bg-red-400 transition-all duration-300" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-all duration-300" />
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500 hover:bg-green-400 transition-all duration-300" />
        </div>
        <span className="ml-auto text-xs hidden sm:block current-filename">
          {names[index] || (variant === "blog" ? "blog-image" : "image")}
        </span>
      </div>

      {multiple ? (
        <div
          className={`${variant}-slider-container relative w-full`}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className={`${variant}-slider-wrapper flex transition-transform duration-500 ease-in-out`}
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((src, position) => (
              <div key={src} className={`${variant}-slide w-full flex-shrink-0`}>
                <div className="aspect-video">
                  <Image
                    src={src}
                    alt={lightboxImages[position].alt}
                    width={1200}
                    height={675}
                    // The article's hero, and the largest paint on the page
                    // at every width, so this is where the explicit preload is
                    // spent rather than on a viewport-dependent guess.
                    // `preload` replaces the deprecated `priority`.
                    preload={position === 0}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-30 flex space-x-1 sm:space-x-2">
            <button
              type="button"
              className={`${navClass(variant, "prev")} gallery-nav-btn rounded-l-lg`}
              title="Previous Image"
              onClick={() => go(index - 1)}
            >
              <ChevronIcon d="M15 19l-7-7 7-7" />
            </button>
            <button
              type="button"
              className={`${navClass(variant, "next")} gallery-nav-btn rounded-r-lg`}
              title="Next Image"
              onClick={() => go(index + 1)}
            >
              <ChevronIcon d="M9 5l7 7-7 7" />
            </button>
          </div>

          <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-1 sm:space-x-2">
            {images.map((src, position) => (
              <button
                key={src}
                type="button"
                className={dotClass(variant, position === index)}
                title={variant === "blog" ? `Image ${position + 1}` : `Go to image ${position + 1}`}
                aria-current={position === index}
                onClick={() => go(position)}
              />
            ))}
          </div>

          {variant === "project" && (
            <MagnifyButton label="Magnify Images" onClick={() => setLightboxAt(index)} />
          )}
        </div>
      ) : (
        <div className="relative w-full">
          <div className="aspect-video">
            <Image
              src={images[0]}
              alt={alt}
              width={1200}
              height={675}
              // Same as the slider branch above: one image, unambiguously
              // the hero, so it earns the explicit preload.
              preload
              className="w-full h-full object-cover object-center"
            />
          </div>
          {variant === "project" && (
            <MagnifyButton label="Magnify Image" onClick={() => setLightboxAt(0)} />
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      {variant === "blog" && multiple ? (
        <div className="blog-image-gallery mb-4">{frame}</div>
      ) : (
        frame
      )}

      {multiple && (
        <p className={`text-sm text-zinc-400 text-center${variant === "project" ? " mt-2" : ""}`}>
          {count} image{count === 1 ? "" : "s"} • Use arrows or dots to navigate
        </p>
      )}

      {lightboxAt !== null && (
        <ImageLightbox
          images={lightboxImages}
          startIndex={lightboxAt}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </div>
  );
}

/** The prev/next button's variant-specific hooks, kept for the CSS selectors. */
function navClass(variant: Variant, direction: "prev" | "next"): string {
  return variant === "blog" ? `blog-slider-nav blog-${direction}` : `project-${direction}`;
}

/**
 * The active/inactive dot, reproducing the classes the original's `classList`
 * calls left behind rather than a tidied equivalent.
 */
function dotClass(variant: Variant, active: boolean): string {
  if (variant === "blog") {
    return active
      ? "blog-slider-dot cursor-pointer bg-zinc-300 w-4 h-1.5 sm:h-2 rounded-full hover:bg-zinc-300 transition-all duration-300"
      : "blog-slider-dot cursor-pointer bg-zinc-300/50 w-1.5 h-1.5 sm:h-2 rounded-full hover:bg-zinc-300 transition-all duration-300";
  }
  return active
    ? "project-slider-dot cursor-pointer h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 focus:outline-none hover:bg-zinc-300 bg-zinc-300 w-4"
    : "project-slider-dot cursor-pointer w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 focus:outline-none hover:bg-zinc-300 bg-zinc-300/50";
}

/**
 * The button that opens the lightbox.
 *
 * `imageLightbox.js` injected this from JavaScript half a second after the page
 * loaded -- which is also how its Tailwind classes came to be scanned out of a
 * file under `staticfiles/js/`. Written as markup they are visible to the
 * compiler in the ordinary way.
 */
function MagnifyButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      title={label}
      onClick={onClick}
      className="magnify-button cursor-pointer absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-30 bg-zinc-900/70 hover:bg-zinc-800/70 border border-zinc-800 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-all duration-300 focus:outline-none transform hover:scale-105"
    >
      <svg
        className="w-4 h-4 sm:w-5 sm:h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
        />
      </svg>
    </button>
  );
}

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
