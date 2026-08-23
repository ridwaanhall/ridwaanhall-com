import { SkeletonBar, SkeletonBlock, SkeletonPage, SkeletonText } from "@/components/skeleton";

/** A project, while it loads. The blog post's shape with a metadata row. */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <header className="mb-6 md:mb-8">
        <SkeletonBar className="h-8 w-5/6 max-w-3xl mb-2 md:mb-3" />

        {/* Status, dates and the link/share controls. */}
        <div className="flex flex-col mb-4 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBar className="h-6 w-24 rounded-full" />
            <SkeletonBar className="h-4 w-40" />
          </div>
          <div className="flex flex-wrap gap-2 mt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBar key={i} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full" />
            ))}
          </div>
        </div>

        <SkeletonBlock className="mb-6 md:mb-8 h-60 sm:h-72 md:h-96" />
      </header>

      <SkeletonText lines={8} className="mb-8 md:mb-10" />

      {/* Tech stack. */}
      <SkeletonBar className="h-6 w-32 mb-2" />
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonBar key={i} className="h-6 w-24 rounded-full" />
        ))}
      </div>
    </SkeletonPage>
  );
}
