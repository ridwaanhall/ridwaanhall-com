/**
 * The guestbook panel, holding its height while the thread loads.
 *
 * Its own module so `loading.tsx` can use it too. It used to be a private
 * `PanelSkeleton` inside the page -- as did the dashboard's, with a different
 * signature and the same name, which is a collision waiting to be imported by
 * the wrong one.
 *
 * The height is `min(45vh, 600px)` because the real panel scrolls internally:
 * it has no natural height to match, and this is what it settles at.
 */
export function GuestbookPanelSkeleton() {
  return (
    <div className="skeleton-pulse" role="status" aria-busy="true">
      <span className="sr-only">Loading the guestbook…</span>
      <div
        className="border border-zinc-700 rounded-lg"
        style={{ minHeight: "min(45vh, 600px)" }}
        aria-hidden="true"
      >
        {/* The panel's own header bar, which is opaque and sits above the feed. */}
        <div className="bg-zinc-800 p-3 rounded-t-lg h-12" />
      </div>
    </div>
  );
}
