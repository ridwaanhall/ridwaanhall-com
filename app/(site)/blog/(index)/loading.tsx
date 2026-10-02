import {
  SkeletonBar,
  SkeletonPage,
  SkeletonPageHeading,
  SkeletonSectionHeading,
} from "@/components/skeleton";
import { ListingBody } from "@/components/site/listing-skeleton";

/**
 * The blog index, while it loads: the header, the featured lead and its
 * tiles, then `ListingBody` -- the same piece the results boundary falls back
 * to once the shell has arrived, so the search row and the rows are drawn
 * identically at both moments.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />

      <section className="border-t border-zinc-800 py-12 md:py-16">
        <SkeletonSectionHeading action={false} />
        <div className="grid items-end gap-8 md:grid-cols-[1.4fr_1fr]">
          <SkeletonBar className="aspect-[16/10] w-full rounded-lg" />
          <div>
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="mt-4 h-8 w-full" />
            <SkeletonBar className="mt-2 h-8 w-2/3" />
            <SkeletonBar className="mt-5 h-4 w-full" />
            <SkeletonBar className="mt-2 h-4 w-4/5" />
          </div>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i}>
              <SkeletonBar className="aspect-[3/2] w-full rounded-lg" />
              <SkeletonBar className="mt-4 h-3 w-24" />
              <SkeletonBar className="mt-2 h-5 w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-800 py-12 md:py-16">
        <SkeletonSectionHeading action={false} />
        <ListingBody shape="rows" />
      </section>
    </SkeletonPage>
  );
}
