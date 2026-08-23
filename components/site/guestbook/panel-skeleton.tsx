import { SkeletonBar } from "@/components/skeleton";

/**
 * The panel's frame, and its height, in one place.
 *
 * Both the real panel and the skeleton below import this, which is the only
 * reliable way to make them the same size. They were not: the skeleton drew a
 * bordered box with an opaque header bar for a panel that had stopped having
 * either, at 405px for something 758px tall -- a picture of a previous design,
 * held for half the space the real one needed, so the page jumped by the
 * difference every time the thread arrived.
 *
 * It lives in this module rather than in `panel.tsx` because `loading.tsx`
 * imports the skeleton, and `panel.tsx` is a client component: importing the
 * constant from there would pull the whole panel, the confirm dialog and the
 * server actions into a fallback made of rectangles.
 *
 * The band is a band because the panel scrolls internally -- it has no natural
 * height, and this is where it settles.
 */
export const PANEL_FRAME =
  "flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 " +
  "min-h-[min(78vh,720px)] max-h-[min(85vh,860px)]";

/** The header strip and the composer footer, shared so both states match. */
export const PANEL_HEADER = "flex-shrink-0 border-b border-zinc-800 px-3 py-2.5";
export const PANEL_FOOTER = "flex-shrink-0 border-t border-zinc-800 p-3";

export function GuestbookPanelSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading the guestbook…</span>

      <div className={PANEL_FRAME} aria-hidden="true">
        <div className={`${PANEL_HEADER} flex items-center justify-between`}>
          <SkeletonBar className="h-4 w-28" />
          <SkeletonBar className="h-4 w-24" />
        </div>

        {/* A few messages, at the rhythm `Message` sets: an avatar beside a
            name line and a bubble, with one reply indented under the second. */}
        <div className="flex-1 space-y-5 px-3 py-4">
          {[0, 1, 2].map((row) => (
            <div key={row}>
              <MessageRow />
              {row === 1 && (
                <div className="mt-3 pl-7 sm:pl-9">
                  <MessageRow short />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={PANEL_FOOTER}>
          <div className="flex items-end gap-2">
            <SkeletonBar className="h-11 flex-1 rounded-lg" />
            <SkeletonBar className="h-11 w-11 flex-shrink-0 rounded-lg" />
          </div>
          <SkeletonBar className="mt-2.5 h-3.5 w-56" />
        </div>
      </div>
    </div>
  );
}

function MessageRow({ short = false }: { short?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <SkeletonBar className="h-9 w-9 flex-shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBar className="h-3.5 w-40" />
        <SkeletonBar className={`h-9 rounded-xl rounded-tl-none ${short ? "w-1/2" : "w-3/4"}`} />
      </div>
    </div>
  );
}
