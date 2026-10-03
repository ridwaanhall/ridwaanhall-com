import { SkeletonBar, SkeletonPage, SkeletonText } from "@/components/skeleton";

/**
 * A project, while it loads: the back link, the status line, the title, the
 * headline and the two actions, the gallery, then the description beside the
 * stack column.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <header className="pt-10 md:pt-16">
        <SkeletonBar className="h-4 w-24" />
        <SkeletonBar className="mt-12 h-3 w-72 max-w-full" />
        <SkeletonBar className="mt-5 h-8 w-3/4 max-w-2xl sm:h-9 md:h-[2.6rem]" />
        <SkeletonBar className="mt-7 h-5 w-full max-w-2xl" />
        <div className="mt-10 flex gap-3">
          <SkeletonBar className="h-11 w-32 rounded-full" />
          <SkeletonBar className="h-11 w-28 rounded-full" />
        </div>
      </header>

      <SkeletonBar className="mt-12 aspect-video w-full rounded-xl md:mt-16" />

      <div className="mt-20 grid gap-16 md:mt-28 lg:grid-cols-[1fr_17rem]">
        <div>
          <SkeletonBar className="mb-7 h-6 w-40 md:h-7" />
          <SkeletonText lines={6} />
        </div>
        <div className="space-y-4">
          <SkeletonBar className="mb-7 h-6 w-36 md:h-7" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <SkeletonBar className="h-5 w-5 rounded-full" />
              <SkeletonBar className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
