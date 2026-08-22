import Link from "next/link";

import type { AboutData } from "@/lib/data/about";

/**
 * Availability badges: open to work, hiring, unwell.
 *
 * **All three can be true at once**, and that is the case worth testing before
 * judging any change here. In the 248px rail three badges beside `@username`
 * wrapped onto two lines and collided with it; in the mobile drawer they
 * additionally forced the name to wrap. Both placements therefore give the
 * badges their own row -- see the callers.
 *
 * The two variants differ for real layout reasons, so they are a prop rather
 * than one compromise:
 *
 * - `rail` (248px column) combines Open + Hiring into a single gradient pill
 *   when both are live, because two separate pills do not fit, and spells out
 *   "Open to Work" when it has the room.
 * - `drawer` keeps them as two compact pills and abbreviates to "Open"; the
 *   drawer header is horizontal and has width to spare but little height.
 */
export function StatusBadges({
  about,
  variant,
}: {
  about: Pick<AboutData, "is_open_to_work" | "is_hiring" | "is_sick">;
  variant: "rail" | "drawer";
}) {
  const { is_open_to_work: open, is_hiring: hiring, is_sick: sick } = about;
  if (!open && !hiring && !sick) return null;

  const rail = variant === "rail";
  const pad = rail ? "px-2 py-1" : "px-2 py-0.5";
  const dotGap = rail ? "mr-1.5" : "mr-1";

  return (
    <div
      className={
        rail
          ? "flex flex-wrap items-center gap-1 w-full mt-2"
          : "flex flex-wrap gap-1 min-w-0 mt-1.5"
      }
    >
      {(open || hiring) && (
        <Link href="/openhire" className={rail ? "inline-block" : "flex gap-1"}>
          {rail && open && hiring ? (
            <span
              className={`pill-badge ${pad} text-xs bg-gradient-to-r from-green-900/30 to-blue-900/30 text-green-400 border border-green-800/50 hover:from-green-900/40 hover:to-blue-900/40 transition-colors`}
            >
              <span className={`w-1.5 h-1.5 bg-green-500 rounded-full ${dotGap} animate-pulse`} />
              <span className="text-green-400">Open</span>
              <span className="mx-1" />
              <span className={`w-1.5 h-1.5 bg-blue-500 rounded-full ${dotGap} animate-pulse`} />
              <span className="text-blue-400">Hiring</span>
            </span>
          ) : (
            <>
              {open && (
                <span
                  className={`pill-badge ${pad} text-xs bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/40 transition-colors`}
                >
                  <span
                    className={`w-1.5 h-1.5 bg-green-500 rounded-full ${dotGap} animate-pulse`}
                  />
                  {rail ? "Open to Work" : "Open"}
                </span>
              )}
              {hiring && (
                <span
                  className={`pill-badge ${pad} text-xs bg-blue-900/30 text-blue-400 border border-blue-800/50 hover:bg-blue-900/40 transition-colors`}
                >
                  <span className={`w-1.5 h-1.5 bg-blue-500 rounded-full ${dotGap} animate-pulse`} />
                  Hiring
                </span>
              )}
            </>
          )}
        </Link>
      )}

      {sick && (
        <span
          className={`pill-badge ${pad} text-xs bg-amber-900/30 text-amber-400 border border-amber-800/50`}
          title="Currently unwell — replies may be slow"
        >
          <span className={`w-1.5 h-1.5 bg-amber-500 rounded-full ${dotGap} animate-pulse`} />
          Unwell
        </span>
      )}
    </div>
  );
}
