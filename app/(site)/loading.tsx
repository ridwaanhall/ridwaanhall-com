import { SkeletonBar, SkeletonBlock, SkeletonPage } from "@/components/skeleton";

/**
 * The home page, while it loads.
 *
 * Also the fallback for any route in this group that has no `loading.tsx` of
 * its own, which is a safety net and not a plan: what it hands such a route is
 * a *hero, a card rail and a skills marquee*, so a page shaped like anything
 * else settles by collapsing into place. Every route in the group has a file of
 * its own for that reason, and a new one arrives with one.
 *
 * Mirrors the hero, the latest-blogs rail and the skills marquee with their
 * dividers, so the page settles into the same rhythm it will keep.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      {/* Hero: heading, the location/status line, the lead, the action pills. */}
      <section>
        <SkeletonBar className="h-8 w-3/4 max-w-md mb-3" />
        <SkeletonBar className="h-4 w-56 my-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-4 w-2/3 max-w-xl mb-4" />
        <div className="flex flex-row gap-2 sm:gap-3 mb-6 sm:mb-6 md:mb-8">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBar key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      </section>

      <Divider />

      {/* Latest blogs: a heading with its "see all" link, then the card rail. */}
      <section>
        <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
          <SkeletonBar className="h-7 w-44" />
          <SkeletonBar className="h-4 w-20" />
        </div>
        <div className="relative mb-6 sm:mb-6 md:mb-8 lg:mb-8">
          {/* The real rail scrolls horizontally; here it simply clips. */}
          <div className="flex gap-3 sm:gap-4 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="flex-none w-80" style={{ height: 350 }} />
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* Skills: a heading over three marquee rows of pills. */}
      <section>
        <div className="flex flex-row items-center justify-between gap-2 mb-3 md:mb-4">
          <SkeletonBar className="h-7 w-36" />
        </div>
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-3 py-2 overflow-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <SkeletonBar key={i} className="h-10 w-32 flex-none rounded-full" />
            ))}
          </div>
        ))}
      </section>

      <Divider />

      {/* The sponsor banner. */}
      <SkeletonBlock className="mt-4 sm:mt-6 h-48 rounded-2xl" />
    </SkeletonPage>
  );
}

function Divider() {
  return <div className="w-full mx-auto border-t border-zinc-800 my-4 md:my-6 lg:my-6" />;
}
