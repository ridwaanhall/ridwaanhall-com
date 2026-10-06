"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/foothill/icons";
import { gsap, MOTION_OK } from "@/lib/motion/gsap";
import { cn } from "@/lib/utils/cn";

/**
 * A record's images: a horizontal strip that opens into a full-screen viewer.
 *
 * Each image says what it is from `media_asset.alt` when somebody has written
 * one, and otherwise from the record -- "<title>, image 2 of 5" -- which is
 * the fallback `scripts/check-image-alt.mjs` looks for in the HTML.
 *
 * The viewer is a native `<dialog>` opened with `showModal()`: the browser
 * gives it the top layer, a backdrop, inert content behind it and Escape to
 * close, none of which has to be rebuilt here.
 */
export function Gallery({
  images,
  alts = [],
  title,
  layout = "strip",
  eager = false,
}: {
  images: string[];
  alts?: string[];
  title: string;
  layout?: "strip" | "cover";
  eager?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const count = images.length;
  const altFor = (i: number) => alts[i] || (count > 1 ? `${title}, image ${i + 1} of ${count}` : title);

  const open = (i: number) => {
    setIndex(i);
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    if (window.matchMedia(MOTION_OK).matches)
      gsap.fromTo(
        el.querySelector("[data-stage]"),
        { scale: 0.92, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.6, ease: "expo.out", clearProps: "transform,opacity,visibility" },
      );
  };
  const step = useCallback((by: number) => setIndex((i) => (i + by + count) % count), [count]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [step]);

  if (!count) return null;

  return (
    <>
      {layout === "cover" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => open(0)}
            className="relative block aspect-[16/9] w-full cursor-zoom-in overflow-hidden rounded-[18px] bg-raise"
          >
            <Image
              src={images[0]}
              alt={altFor(0)}
              fill
              sizes="(min-width: 1200px) 1104px, 100vw"
              className="object-cover"
              priority={eager}
            />
          </button>
          {count > 1 && <Strip images={images.slice(1)} offset={1} altFor={altFor} onOpen={open} />}
        </div>
      ) : (
        <Strip images={images} offset={0} altFor={altFor} onOpen={open} eager={eager} />
      )}

      <dialog
        ref={dialog}
        aria-label={`${title}, images`}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
        className="fh-site m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-[var(--fh-scrim)] backdrop:backdrop-blur-sm"
      >
        <div className="pointer-events-none flex h-full flex-col items-center justify-center gap-4 p-4 md:p-10">
          <div data-stage className="pointer-events-auto relative h-full max-h-[80vh] w-full max-w-[1400px]">
            <Image
              key={images[index]}
              src={images[index]}
              alt={altFor(index)}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-paper px-2 py-1.5 text-ink">
            {count > 1 && (
              <button type="button" onClick={() => step(-1)} aria-label="Previous image" className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-raise">
                <Icon name="arrow-left" className="transition-transform duration-500 group-hover:-translate-x-0.5" />
              </button>
            )}
            <span className="px-2 text-[13px] tabular-nums" aria-live="polite">
              {index + 1} / {count}
            </span>
            {count > 1 && (
              <button type="button" onClick={() => step(1)} aria-label="Next image" className="group flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-raise">
                <Icon name="arrow-right" className="transition-transform duration-500 group-hover:translate-x-0.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => dialog.current?.close()}
              aria-label="Close"
              className="group ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full hover:bg-raise"
            >
              <Icon name="close" className="transition-transform duration-500 group-hover:rotate-90" />
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

function Strip({
  images,
  offset,
  altFor,
  onOpen,
  eager = false,
}: {
  images: string[];
  offset: number;
  altFor: (i: number) => string;
  onOpen: (i: number) => void;
  eager?: boolean;
}) {
  return (
    <ul className={cn("fh-strip -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:px-0")}>
      {images.map((src, i) => (
        <li key={src} className="shrink-0 snap-start">
          <button
            type="button"
            onClick={() => onOpen(i + offset)}
            className="relative block aspect-[16/10] w-[78vw] cursor-zoom-in overflow-hidden rounded-[14px] bg-raise sm:w-[460px]"
          >
            <Image
              src={src}
              alt={altFor(i + offset)}
              fill
              sizes="(min-width: 640px) 460px, 78vw"
              className="object-cover transition-transform duration-700 ease-out hover:scale-[1.03]"
              priority={eager && i === 0}
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
