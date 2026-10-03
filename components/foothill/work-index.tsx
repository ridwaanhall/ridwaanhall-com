"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { Reveal } from "@/components/foothill/reveal";
import { StatusDot } from "@/components/foothill/ui";
import { EASE, gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";

export type WorkRow = {
  slug: string;
  title: string;
  headline: string;
  category: string;
  year: number | null;
  status: string;
  statusColor: string;
  image: string | null;
  imageAlt: string;
};

/**
 * Projects as an index: one ruled row each, title first.
 *
 * On a fine pointer the row's first screenshot follows the cursor while it is
 * over the row, so the list stays a list -- scannable, no cards -- and the
 * picture is there for whoever wants it. On touch there is no hover to hang it
 * on, and the row carries its headline instead.
 */
export function WorkIndex({ rows, eagerFirst = false }: { rows: WorkRow[]; eagerFirst?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<number | null>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_OK} and (pointer: fine)`, () => {
        const box = preview.current;
        if (!box) return;
        gsap.set(box, { xPercent: -50, yPercent: -50, scale: 0.86, autoAlpha: 0 });
        const toX = gsap.quickTo(box, "x", { duration: 0.6, ease: EASE });
        const toY = gsap.quickTo(box, "y", { duration: 0.6, ease: EASE });
        const onMove = (event: PointerEvent) => {
          toX(event.clientX);
          toY(event.clientY);
        };
        window.addEventListener("pointermove", onMove);
        return () => window.removeEventListener("pointermove", onMove);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  // Plain handlers rather than `contextSafe`: each tween they start is
  // overwritten by the next, so none of them needs reverting on unmount.
  const show = (index: number) => {
    if (!rows[index]?.image || !window.matchMedia(`${MOTION_OK} and (pointer: fine)`).matches) return;
    setShown(index);
    gsap.to(preview.current, { scale: 1, autoAlpha: 1, duration: 0.45, ease: EASE, overwrite: "auto" });
  };
  const hide = () => {
    gsap.to(preview.current, { scale: 0.86, autoAlpha: 0, duration: 0.3, ease: EASE, overwrite: "auto" });
  };

  const current = shown !== null ? rows[shown] : null;

  return (
    <div ref={root} onPointerLeave={hide}>
      <Reveal as="ul" stagger className="border-b border-line">
        {rows.map((row, index) => (
          <li key={row.slug} className="border-t border-line">
            <Link
              href={`/projects/${row.slug}`}
              onPointerEnter={() => show(index)}
              onFocus={() => show(index)}
              onBlur={hide}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1.5 py-5 md:grid-cols-[minmax(0,1fr)_11rem_4rem_12rem] md:py-6"
            >
              <span className="text-[clamp(1.25rem,1.05rem+0.9vw,1.75rem)] leading-tight font-medium tracking-[-0.02em] text-ink transition-transform duration-500 ease-out group-hover:translate-x-2">
                {row.title}
              </span>
              <span className="fh-mono text-right text-[12px] text-mute tabular-nums md:order-3 md:text-left">
                {row.year ?? ""}
              </span>
              <span className="col-span-2 line-clamp-2 text-[14px] leading-snug text-mute md:hidden">
                {row.headline}
              </span>
              <span className="hidden text-[14px] text-mute md:order-2 md:block">{row.category}</span>
              <StatusDot
                label={row.status}
                color={row.statusColor}
                className="fh-mono hidden text-[11px] tracking-[0.06em] text-mute uppercase md:order-4 md:inline-flex"
              />
            </Link>
          </li>
        ))}
      </Reveal>

      <div
        ref={preview}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-40 hidden aspect-[16/10] w-[340px] overflow-hidden rounded-md border border-line bg-raise opacity-0 [@media(pointer:fine)]:block"
      >
        {current?.image && (
          <Image
            key={current.slug}
            src={current.image}
            alt={current.imageAlt}
            fill
            sizes="340px"
            className="object-cover"
            priority={eagerFirst && shown === 0}
          />
        )}
      </div>
    </div>
  );
}
