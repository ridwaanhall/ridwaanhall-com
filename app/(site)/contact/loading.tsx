import { SkeletonBar, SkeletonBlock, SkeletonPage } from "@/components/skeleton";

/**
 * The contact page, while it loads.
 *
 * Three blocks, because the page is three: its heading, the social row, and
 * the message form. The first version drew the middle one as six bare circles
 * and the last as a bordered card, and the page is neither -- the social block
 * is a titled, described grid of five link cards, and the form is a titled,
 * described plain form with a note under it. Measured, that skeleton held
 * 598px against a 752px page: a 154px jump on arrival, and the one route
 * whose skeleton `check-skeleton-shape.mjs` can rarely catch, so nothing
 * reported it.
 *
 * The two blocks repeat `mt-8` and the grid repeats its own column ladder
 * rather than sharing a constant with the components. A skeleton that imported
 * from them would drag a client component and its icon set into the fallback,
 * which is the payload this file exists to avoid -- so the shape is copied,
 * and the harness is what keeps the copy honest.
 */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      {/*
        "Contact Me" over its lead line, sized to `text-2xl lg:text-3xl` above
        `text-base sm:text-lg`. The second lead bar is there only below `sm`,
        where the sentence wraps -- which is the difference between a 73px
        heading and a 92px one, and the only part of this file that is above
        the fold on every screen.
      */}
      <div className="mb-6 sm:mb-8">
        <SkeletonBar className="h-8 lg:h-9 w-48 mb-2" />
        <SkeletonBar className="h-6 sm:h-7 w-full max-w-2xl mt-1 sm:mt-2" />
        <SkeletonBar className="h-6 w-2/3 mt-1 sm:hidden" />
      </div>

      {/*
        The social links: heading, description, then five cards that sit on one
        row from `lg`, two from `sm`, and stack below it -- which is the whole
        difference between 113px and 343px, and why the ladder is repeated
        rather than approximated with a fixed height.
      */}
      <div className="mt-8">
        <SkeletonBar className="h-7 w-44" />
        <SkeletonBar className="h-5 w-full max-w-md mt-2 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonBlock key={i} className="h-[41px] rounded-lg" />
          ))}
        </div>
      </div>

      {/* The message form, and the response-time note it ends on. */}
      <div className="mt-8">
        <SkeletonBar className="h-7 w-52" />
        <SkeletonBar className="h-5 w-full max-w-lg mt-2 mb-4" />

        <div className="flex flex-col gap-4">
          {/* Name and email share a row from `md`. */}
          <div className="flex flex-col gap-4 md:flex-row">
            <SkeletonBar className="h-[46px] flex-1" />
            <SkeletonBar className="h-[46px] flex-1" />
          </div>
          {/* `rows={5}`. */}
          <SkeletonBar className="h-[126px]" />
          {/* The Turnstile widget reserves its own box before it draws. */}
          <SkeletonBar className="h-[65px] w-full max-w-[300px]" />
          <SkeletonBar className="h-[44px] rounded-lg" />
        </div>

        <div className="my-5 mt-4 flex items-center gap-2">
          <SkeletonBar className="h-4 w-4 rounded-full" />
          <SkeletonBar className="h-4 w-full max-w-sm" />
        </div>
      </div>
    </SkeletonPage>
  );
}
