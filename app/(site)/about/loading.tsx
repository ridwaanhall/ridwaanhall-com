import { SkeletonBar, SkeletonPage, SkeletonPageHeading, SkeletonText } from "@/components/skeleton";

/**
 * The About page, while it loads: the header, then the index rail beside the
 * opening section -- the status line, the letter, and the CV row.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="grid gap-12 border-t border-zinc-800 pt-12 md:pt-16 lg:grid-cols-[11rem_1fr] lg:gap-16">
        <div className="hidden space-y-3 border-l border-zinc-800 pl-5 lg:block">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBar key={i} className="h-4 w-24" />
          ))}
        </div>
        <div>
          <SkeletonBar className="mb-8 h-8 w-28" />
          <SkeletonBar className="mb-8 h-4 w-48" />
          <SkeletonBar className="h-6 w-44" />
          <SkeletonText lines={8} className="mt-5" />
          <SkeletonBar className="mt-5 h-6 w-48" />
          <div className="mt-12 flex items-center justify-between border-y border-zinc-800 py-6">
            <div>
              <SkeletonBar className="h-5 w-36" />
              <SkeletonBar className="mt-2 h-4 w-72 max-w-full" />
            </div>
            <SkeletonBar className="hidden h-4 w-40 sm:block" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
