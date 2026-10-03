"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { H3 } from "@/components/foothill/classes";
import { Icon } from "@/components/foothill/icons";
import type { Card } from "@/components/foothill/rows";
import { StatusDot } from "@/components/foothill/ui";
import { gsap, MOTION_OK, useGSAP } from "@/lib/motion/gsap";
import { useMountedByHydration } from "@/lib/motion/use-hydrated-mount";
import { cn } from "@/lib/utils/cn";

/*
 * The rhythm a grid of cards is laid out in, from `lg` up: a wide and a
 * narrow, the narrow and the wide, then three of a size -- repeated. Cards in
 * one row share a height, so each width carries its own aspect ratio; the
 * point is that no two neighbouring rows are the same shape. Below `lg` it is
 * a plain two-column grid, and one column on a phone.
 */
const RHYTHM = [
  { span: "lg:col-span-7", ratio: "lg:aspect-[7/5]" },
  { span: "lg:col-span-5", ratio: "lg:aspect-square" },
  { span: "lg:col-span-5", ratio: "lg:aspect-square" },
  { span: "lg:col-span-7", ratio: "lg:aspect-[7/5]" },
  { span: "lg:col-span-4", ratio: "lg:aspect-[4/3]" },
  { span: "lg:col-span-4", ratio: "lg:aspect-[4/3]" },
  { span: "lg:col-span-4", ratio: "lg:aspect-[4/3]" },
];

/**
 * Projects or posts as pictures on the page: no box around any of them, just
 * the image, the title and a line of facts, set straight on the paper.
 *
 * It shows `batch` at first and the next `batch` each time the end of the
 * list comes within a screen of the viewport, so a long index reads as one
 * continuous page instead of numbered pages. Every card is a real link in the
 * markup the moment it is shown, and the count under the grid says how many
 * are left, for anybody whose browser never scrolls it into view.
 */
export function CardGrid({
  cards,
  batch = 9,
  rhythm = true,
  span = "lg:col-span-4",
  eager = 0,
  noun = "items",
  className,
}: {
  cards: Card[];
  batch?: number;
  /** Off for a short row of cards that should all be one size. */
  rhythm?: boolean;
  /** Each card's width from `lg` when `rhythm` is off. */
  span?: "lg:col-span-4" | "lg:col-span-6";
  /** How many of the first images to load eagerly. */
  eager?: number;
  noun?: string;
  className?: string;
}) {
  const [shown, setShown] = useState(Math.min(batch, cards.length));
  const list = useRef<HTMLUListElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const byHydration = useMountedByHydration();
  const more = shown < cards.length;

  // The next batch, when the end of the list nears the viewport.
  useEffect(() => {
    const end = sentinel.current;
    if (!end || !more) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          setShown((count) => Math.min(count + batch, cards.length));
      },
      { rootMargin: "0px 0px 100% 0px" },
    );
    observer.observe(end);
    return () => observer.disconnect();
  }, [more, batch, cards.length, shown]);

  // Each card rises in as it is reached. Only cards not seen yet are
  // watched, so a new batch does not replay the ones above it; cards that
  // come into view together rise one after another.
  useGSAP(
    () => {
      const root = list.current;
      if (!root) return;
      const fresh = Array.from(root.querySelectorAll<HTMLElement>("[data-card]:not([data-seen])")).filter((card) => {
        card.setAttribute("data-seen", "");
        return !byHydration || card.getBoundingClientRect().top > window.innerHeight;
      });
      if (!fresh.length) return;
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.set(fresh, { autoAlpha: 0, y: 48 });
        const observer = new IntersectionObserver(
          (entries) => {
            const arrived = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
            if (!arrived.length) return;
            arrived.forEach((card) => observer.unobserve(card));
            gsap.to(arrived, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, clearProps: "transform,opacity,visibility" });
          },
          { rootMargin: "0px 0px -6% 0px" },
        );
        fresh.forEach((card) => observer.observe(card));
        return () => observer.disconnect();
      });
      return () => mm.revert();
    },
    { scope: list, dependencies: [shown] },
  );

  return (
    <div className={className}>
      <ul ref={list} className="grid gap-x-6 gap-y-14 sm:grid-cols-2 md:gap-y-20 lg:grid-cols-12 lg:gap-x-8">
        {cards.slice(0, shown).map((card, index) => {
          const beat = rhythm ? RHYTHM[index % RHYTHM.length] : { span, ratio: "lg:aspect-[4/3]" };
          return (
            <li key={card.key} data-card className={cn("min-w-0", beat.span)}>
              <CardLink card={card} ratio={beat.ratio} eager={index < eager} />
            </li>
          );
        })}
      </ul>
      {cards.length > batch && (
        <div ref={sentinel} className="mt-16 flex items-center justify-center gap-4 text-[14px] text-mute" aria-live="polite">
          {more ? (
            <>
              <span aria-hidden="true" className="fh-loader" />
              Showing {shown} of {cards.length} {noun}
            </>
          ) : (
            <>All {cards.length} {noun} shown</>
          )}
        </div>
      )}
    </div>
  );
}

function CardLink({ card, ratio, eager }: { card: Card; ratio: string; eager: boolean }) {
  return (
    <Link href={card.href as Route} className="group block">
      <div
        data-card-media
        className={cn("relative aspect-[4/3] overflow-hidden rounded-[16px] bg-raise", ratio)}
      >
        {card.image && (
          <Image
            src={card.image}
            alt={card.imageAlt}
            fill
            sizes="(min-width: 1024px) 680px, (min-width: 640px) 50vw, 100vw"
            priority={eager}
            loading={eager ? undefined : "eager"}
            className="object-cover object-top transition-transform duration-[1400ms] ease-[cubic-bezier(.2,.8,.2,1)] group-hover:scale-[1.045]"
          />
        )}
        <span
          aria-hidden="true"
          className="absolute right-3 bottom-3 flex h-10 w-10 translate-y-3 scale-75 items-center justify-center rounded-full bg-paper text-ink opacity-0 transition-all duration-500 ease-[cubic-bezier(.2,.8,.2,1)] group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100"
        >
          <Icon name="arrow-up-right" className="h-4 w-4" />
        </span>
      </div>
      {/* Two lines at most for the title and two for the summary, each
          holding its two lines even when it needs one, so every card in a
          row ends level and the facts beneath line up across it. */}
      <h3 className={cn(H3, "mt-5 line-clamp-2 min-h-[2.2em]")}>
        <span className="fh-underline">{card.title}</span>
      </h3>
      <p className="mt-2 line-clamp-2 min-h-[3.25em] max-w-[52ch] text-[15px] leading-relaxed text-mute">{card.summary}</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mute">
        {card.status && <StatusDot label={card.status.label} color={card.status.color} className="text-ink" />}
        {card.meta.map((fact, i) => (
          <span key={fact} className="flex items-center gap-3">
            {(i > 0 || card.status) && <span aria-hidden="true" className="h-[3px] w-[3px] rounded-full bg-mute/60" />}
            {fact}
          </span>
        ))}
      </p>
    </Link>
  );
}
