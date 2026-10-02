import { SkeletonBar, SkeletonPage, SkeletonText } from "@/components/skeleton";

/**
 * A blog post, while it loads: the back link, the dateline, the title and its
 * lead, the author row with the share buttons, the image, then the body --
 * the same measures the article uses.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <header className="mx-auto max-w-3xl pt-10 md:pt-16">
        <SkeletonBar className="h-4 w-20" />
        <SkeletonBar className="mt-10 h-4 w-64" />
        <SkeletonBar className="mt-5 h-10 w-full sm:h-12" />
        <SkeletonBar className="mt-2 h-10 w-2/3 sm:h-12" />
        <SkeletonBar className="mt-6 h-5 w-full" />
        <SkeletonBar className="mt-2 h-5 w-4/5" />
        <div className="mt-10 flex items-center justify-between border-y border-zinc-800 py-5">
          <div className="flex items-center gap-3">
            <SkeletonBar className="h-9 w-9 rounded-full" />
            <div>
              <SkeletonBar className="h-4 w-28" />
              <SkeletonBar className="mt-1.5 h-3 w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonBar key={i} className="h-8 w-8 rounded-full sm:h-9 sm:w-9" />
            ))}
          </div>
        </div>
      </header>

      <SkeletonBar className="mx-auto mt-12 aspect-video w-full max-w-4xl rounded-lg" />

      <SkeletonText lines={10} className="mx-auto mt-12 max-w-3xl md:mt-16" />
    </SkeletonPage>
  );
}
