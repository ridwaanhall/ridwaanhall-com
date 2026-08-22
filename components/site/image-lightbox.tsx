"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * The magnifying overlay for gallery images.
 *
 * `imageLightbox.js` was a 425-line class that built its own markup as an HTML
 * string, appended it to `<body>` once at DOMContentLoaded, then -- 500ms later,
 * on a `setTimeout` -- scanned the document for galleries, injected a magnify
 * button into each, and read the *current* slide back out by regex-matching the
 * slider's inline `translateX(-200%)`. Every one of those steps exists only
 * because the script had no access to the gallery's state. Here the gallery
 * owns the state and hands it over as props, so the scan, the timeout, the
 * regex and the id lookups all disappear.
 *
 * Two things from the original are deliberately kept:
 *
 *  - **It renders into `document.body`, not in place.** `.image-lightbox` is
 *    `position: fixed`, and `#page-content` carries a transform -- a
 *    transformed ancestor becomes the containing block for its fixed
 *    descendants, so a lightbox rendered inside the page would be positioned
 *    against the content column rather than the viewport. Same reason the toast
 *    stack and the confirm dialog sit at body level.
 *  - **The image is set as a property, never interpolated into markup.** The
 *    original made this point in a comment and it still holds: `alt` text comes
 *    from the database, and building the `<img>` as a string would let an alt
 *    of `" onerror="…` escape the attribute. JSX assigns it verbatim.
 */

export type LightboxImage = { src: string; alt: string; filename: string };

/** Matches the CSS transition on `.image-lightbox` and `.lightbox-content`. */
const EXIT_MS = 300;

export function ImageLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: LightboxImage[];
  startIndex: number;
  /** Called once the exit transition has finished, so the parent can unmount. */
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  // `false` for the first frame so the entrance transition has something to
  // animate from -- the original did this with `setTimeout(..., 10)`.
  const [active, setActive] = useState(false);
  const closing = useRef(false);

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setActive(false);
    setTimeout(onClose, EXIT_MS);
  }, [onClose]);

  const step = useCallback(
    (delta: number) => {
      if (images.length <= 1) return;
      setIndex((current) => (current + delta + images.length) % images.length);
    },
    [images.length],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setActive(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // The page must not scroll behind the overlay.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
      else if (event.key === "ArrowLeft") step(-1);
      else if (event.key === "ArrowRight") step(1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [requestClose, step]);

  const multiple = images.length > 1;

  return createPortal(
    <div
      className={`image-lightbox${active ? " active" : ""}`}
      style={{ display: "flex", visibility: "visible" }}
      role="dialog"
      aria-modal="true"
      aria-label={images[index]?.filename ?? "Image"}
      // Clicking the backdrop closes; clicking the window does not.
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="lightbox-content">
        <div className="lightbox-header">
          <div className="mac-dots">
            <div className="mac-dot red" />
            <div className="mac-dot yellow" />
            <div className="mac-dot green" />
          </div>
          <div className="lightbox-filename">{images[index]?.filename}</div>
        </div>

        <div className="lightbox-image-container">
          <div
            className="lightbox-slider-wrapper"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((image, position) => (
              <div key={image.src} className="lightbox-slide">
                <Image
                  className="lightbox-image"
                  src={image.src}
                  alt={image.alt}
                  width={1920}
                  height={1080}
                  // The original bytes, not a re-encode. This view exists to
                  // magnify, and the optimiser's default q=75 pass over an
                  // already-compressed WebP is visibly softer than the source
                  // -- which is the same conclusion `getFullResolutionSrc`
                  // reached when it stripped the proxy's `w`/`h`/`output`
                  // parameters before showing an image here. The gallery
                  // thumbnails behind the overlay stay optimised.
                  unoptimized
                  // Only the slide in view is worth fetching eagerly; the rest
                  // load as they are reached.
                  loading={position === startIndex ? "eager" : "lazy"}
                />
              </div>
            ))}
          </div>

          <button
            className="lightbox-close"
            type="button"
            title="Close (ESC)"
            onClick={requestClose}
          >
            <CloseIcon />
          </button>

          {/*
            Always rendered, even for a single image -- the original hid the
            nav and emptied the dots for a one-image gallery but left the
            counter showing "1 / 1", and that is what a reader sees.
          */}
          <div className="lightbox-counter">
            {index + 1} / {images.length}
          </div>

          {multiple && (
            <>
              <div className="lightbox-nav-combined" style={{ display: "flex" }}>
                <button
                  className="lightbox-nav prev"
                  type="button"
                  title="Previous Image"
                  onClick={() => step(-1)}
                >
                  <ChevronIcon d="M15 19l-7-7 7-7" />
                </button>
                <button
                  className="lightbox-nav next"
                  type="button"
                  title="Next Image"
                  onClick={() => step(1)}
                >
                  <ChevronIcon d="M9 5l7 7-7 7" />
                </button>
              </div>

              <div className="lightbox-dots" style={{ display: "flex" }}>
                {images.map((image, position) => (
                  <button
                    key={image.src}
                    type="button"
                    className={`lightbox-dot${position === index ? " active" : ""}`}
                    title={`Go to image ${position + 1}`}
                    aria-current={position === index}
                    onClick={() => setIndex(position)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg
      className="w-4 h-4 sm:w-5 sm:h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
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
