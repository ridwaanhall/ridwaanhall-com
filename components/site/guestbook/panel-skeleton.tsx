import { SkeletonBar } from "@/components/skeleton";
import {
  PANEL_FOOTER,
  PANEL_FRAME,
  PANEL_HEADER,
} from "@/components/site/guestbook/frame";

/**
 * The guestbook panel, holding its shape while the thread loads.
 *
 * Every measurement here comes from `frame.ts`, which the real panel reads too
 * -- see the note there for why that is a module of its own rather than a
 * constant in either component.
 */
export function GuestbookPanelSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading the guestbook…</span>

      <div className={PANEL_FRAME} aria-hidden="true">
        <div className={`${PANEL_HEADER} flex items-center justify-between`}>
          <SkeletonBar className="h-3.5 w-24" />
          <SkeletonBar className="h-8 w-28 rounded-full" />
        </div>

        {/* A few messages, at the rhythm `Message` sets: an avatar beside a
            name line and a bubble, with one reply indented under the second. */}
        <div className="flex-1 space-y-6 py-6">
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
            <SkeletonBar className="h-11 flex-1 rounded-3xl" />
            <SkeletonBar className="h-11 w-11 flex-shrink-0 rounded-full" />
          </div>
          <SkeletonBar className="mt-3 h-3.5 w-56" />
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
        <SkeletonBar className={`h-10 rounded-2xl rounded-tl-md ${short ? "w-1/2" : "w-3/4"}`} />
      </div>
    </div>
  );
}
