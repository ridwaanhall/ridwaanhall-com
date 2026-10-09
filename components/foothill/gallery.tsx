"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState } from "react";

/**
 * A record's images: one large frame in 16 by 9, crossfading between them,
 * and a strip of thumbnails under it whose underline slides to the one shown.
 *
 * Each image says what it is from `media_asset.alt` when somebody has written
 * one, and otherwise from the record -- "<title>, image 2 of 5" -- which is
 * the fallback `scripts/check-image-alt.mjs` looks for in the HTML.
 */
export function Gallery({ images, alts = [], title }: { images: string[]; alts?: string[]; title: string }) {
  const [current, setCurrent] = useState(0);
  const count = images.length;
  if (!count) return null;
  const altFor = (i: number) => alts[i] || (count > 1 ? `${title}, image ${i + 1} of ${count}` : title);

  return (
    <div>
      <div className="thumb" style={{ aspectRatio: "16 / 9" }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            style={{ position: "absolute", inset: 0 }}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Image src={images[current]} alt={altFor(current)} fill sizes="(min-width: 1200px) 1104px, 100vw" priority={current === 0} />
          </motion.div>
        </AnimatePresence>
      </div>
      {count > 1 && (
        <div className="gal-strip" style={{ gridTemplateColumns: `repeat(${Math.min(count, 6)}, minmax(0, 1fr))` }}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setCurrent(i)}
              aria-label={`Image ${i + 1} of ${count}`}
              aria-pressed={i === current}
              className="thumb-btn"
            >
              <div className="thumb" style={{ borderColor: i === current ? "var(--fh-ink)" : undefined }}>
                <Image src={src} alt="" fill sizes="180px" />
              </div>
              {i === current && <motion.span className="gal-mark" layoutId="gal" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
