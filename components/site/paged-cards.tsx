"use client";

import { useRef, useState } from "react";

import { PaginationButtons } from "@/components/site/pagination";
import { ITEMS_PER_PAGE, paginate } from "@/lib/api/pagination";

/**
 * A list of cards on `/about`, ten at a time.
 *
 * Two tabs need this -- applications and certifications -- and the second is
 * why it stopped being `ApplicationsPanel`: a hundred and eleven certifications
 * in one column is not a list anybody reads to the end of. It is the same
 * component either way, so it is one component.
 *
 * **The page lives here rather than in the URL.** Every other listing on the
 * site pages through `?page=`, because a page of `/blog` is a place you can
 * link someone to. These lists are inside a tab whose selection is client
 * state, so `/about?page=3` would name a page that opens on the Intro tab with
 * the list out of sight -- a link pointing at something its reader cannot see.
 * Keeping the page beside the tab state it belongs to also means paging costs
 * no navigation and no round trip.
 *
 * **Every card stays mounted**, hidden with `hidden` rather than unmounted --
 * the same thing `AboutTabs` does with the panels themselves, for the same
 * reason: these lists are the substance of this page and a crawler should still
 * find all of them. Nothing that was in the HTML before this existed has left
 * it, and that is what makes paging a hundred and eleven certifications safe to
 * do at all.
 *
 * The cards arrive already rendered, as an array of elements, so the card
 * components and the data behind them stay on the server -- the same trick
 * `SiteShell` uses for its account panel.
 */
export function PagedCards({
  cards,
  className = "space-y-4",
}: {
  cards: React.ReactNode[];
  /** Spacing for the list, which differs between the two tabs. */
  className?: string;
}) {
  const [page, setPage] = useState(1);
  const list = useRef<HTMLDivElement>(null);

  /*
   * Only the counts are read from this: nothing is unmounted, so the slice it
   * cuts has no use here. It is still the thing that decides them, because it
   * is what /blog and /projects count with -- and because it clamps, so the
   * state can never name a page that is not there.
   */
  const paged = paginate(cards, page);
  const first = (paged.page - 1) * ITEMS_PER_PAGE;
  const last = first + ITEMS_PER_PAGE;

  const go = (n: number) => {
    setPage(n);
    /*
     * The bar sits at the foot of a tall list, so arriving at page two from the
     * bottom of page one would otherwise leave the reader at the bottom of it.
     * A navigation does this for /blog on its own; here it has to be asked for.
     * The scroll margin on the list is what keeps the first card clear of the
     * fixed header the shell draws on a narrow screen.
     */
    list.current?.scrollIntoView();
  };

  return (
    <>
      <div ref={list} className={`${className} scroll-mt-20 md:scroll-mt-0`}>
        {cards.map((card, index) => (
          // A wrapper rather than a prop on the card: `hidden` has to land on an
          // element this component owns. Spacing is unchanged -- the wrappers
          // become the spaced siblings, and a hidden one draws no box.
          <div key={index} hidden={index < first || index >= last}>
            {card}
          </div>
        ))}
      </div>

      {paged.pages > 1 && (
        <div className="mt-4">
          <PaginationButtons page={paged} onPageChange={go} />
        </div>
      )}
    </>
  );
}
