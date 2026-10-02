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
        <SkeletonBar className="mt-10 h-4 w-72 max-w-full" />
        <SkeletonBar className="mt-5 h-12 w-3/4 max-w-2xl sm:h-14 md:h-16" />
        <SkeletonBar className="mt-6 h-5 w-full max-w-2xl" />
        <div className="mt-10 flex gap-3">
          <SkeletonBar className="h-10 w-28 rounded-lg" />
          <SkeletonBar className="h-10 w-24 rounded-lg" />
        </div>
      </header>

      <SkeletonBar className="mt-12 aspect-video w-full rounded-lg md:mt-16" />

      <div className="mt-16 grid gap-16 border-t border-zinc-800 pt-12 md:mt-20 md:pt-16 lg:grid-cols-[1fr_17rem]">
        <div>
          <SkeletonBar className="mb-6 h-4 w-24" />
          <SkeletonText lines={6} />
        </div>
        <div className="space-y-4">
          <SkeletonBar className="mb-6 h-4 w-20" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <SkeletonBar className="h-5 w-5 rounded" />
              <SkeletonBar className="h-4 w-28" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
