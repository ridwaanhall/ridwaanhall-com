"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { ImageLightbox, type LightboxImage } from "@/components/site/image-lightbox";

/**
 * The image set on a blog post or a project.
 *
 * A clean frame and a caption row beneath it: the current file's name, where
 * in the set the reader is, and the controls. It used to be drawn as a macOS
 * window -- three traffic-light dots and a title bar -- which is decoration
 * pretending to be chrome. Every image now opens the lightbox on click, for
 * posts as well as projects.
 *
 * Several images slide on a transform track and auto-advance, paused while
 * the pointer is over them, while the lightbox is open, and entirely for a
 * reader who prefers reduced motion.
 *
 * One component with a `variant`, not two near-identical sliders differing in
 * a class prefix and the auto-advance interval.
 */

type Variant = "blog" | "project";

/** Auto-advance interval, per the two sliders this replaces. */
const INTERVAL_MS: Record<Variant, number> = { blog: 4000, project: 5000 };

export function MediaGallery({
  images,
  alts = [],
  names,
  alt,
  variant,
  className,
}: {
  images: string[];
  /**
   * What each image is described as, positionally alongside `images`.
   *
   * Empty where nothing has been written, which is most of them -- the fallback
   * below is what those get. The column exists for the case the fallback cannot
   * serve: five screenshots on one post, which it describes five times over as
   * that post's title.
   */
  alts?: string[];
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
    // The stored description stands on its own: it says what is in this
    // image, so numbering it would be reading furniture to somebody who
    // already has the sentence. The fallback is numbered because without it
    // every slide announces the same title.
    alt: alts[position] || `${alt} — image ${position + 1} of ${count}`,
    filename: names[position] || `image-${position + 1}`,
  }));

  const zoomLabel = multiple ? "Magnify Images" : "Magnify Image";

  return (
    <figure className={className}>
      <div
        className="relative overflow-hidden rounded-lg bg-zinc-900"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {images.map((src, position) => (
            <button
              key={src}
              type="button"
              tabIndex={position === index ? 0 : -1}
              aria-hidden={position !== index || undefined}
              onClick={() => setLightboxAt(position)}
              title={zoomLabel}
              className="block aspect-video w-full flex-shrink-0 cursor-zoom-in focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-400"
            >
              <Image
                src={src}
                alt={lightboxImages[position].alt}
                width={1200}
                height={675}
                preload={position === 0}
                className="h-full w-full object-cover object-center"
              />
            </button>
          ))}
        </div>
      </div>

      {/* The caption row: which file, where in the set, and the controls. */}
      <figcaption className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span className="current-filename min-w-0 truncate">
          {names[index] || (variant === "blog" ? "blog-image" : "image")}
        </span>
        {multiple && (
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <span className="mr-2 tabular-nums">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              className={`${navClass(variant, "prev")} ${GALLERY_BUTTON}`}
              title="Previous Image"
              aria-label="Previous Image"
              onClick={() => go(index - 1)}
            >
              <ChevronIcon d="M15 19l-7-7 7-7" />
            </button>
            <button
              type="button"
              className={`${navClass(variant, "next")} ${GALLERY_BUTTON}`}
              title="Next Image"
              aria-label="Next Image"
              onClick={() => go(index + 1)}
            >
              <ChevronIcon d="M9 5l7 7-7 7" />
            </button>
          </div>
        )}
        <button
          type="button"
          title={zoomLabel}
          aria-label={zoomLabel}
          onClick={() => setLightboxAt(index)}
          className={`magnify-button ${GALLERY_BUTTON} ${multiple ? "" : "ml-auto"}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
        </button>
      </figcaption>

      {lightboxAt !== null && (
        <ImageLightbox
          images={lightboxImages}
          startIndex={lightboxAt}
          onClose={() => setLightboxAt(null)}
        />
      )}
    </figure>
  );
}

const GALLERY_BUTTON =
  "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

function navClass(variant: Variant, direction: "prev" | "next"): string {
  return variant === "blog" ? `blog-slider-nav blog-${direction}` : `project-${direction}`;
}

/**
 * The button that opens the lightbox.
 *
 * `imageLightbox.js` injected this from JavaScript half a second after the page
 * loaded -- which is also how its Tailwind classes came to be scanned out of a
 * file under `staticfiles/js/`. Written as markup they are visible to the
 * compiler in the ordinary way.
 */
function ChevronIcon({ d }: { d: string }) {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    </svg>
  );
}
