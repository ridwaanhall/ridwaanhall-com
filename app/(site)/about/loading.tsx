import { SkeletonBar, SkeletonPage, SkeletonPageHeading, SkeletonText } from "@/components/skeleton";

/**
 * The About page, while it loads: the header, then the index rail beside the
 * opening section -- the status line, the letter, and the CV row.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="grid gap-12 pt-4 lg:grid-cols-[11rem_1fr] lg:gap-16">
        <div className="hidden space-y-3 pl-5 lg:block">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonBar key={i} className="h-4 w-24" />
          ))}
        </div>
        <div>
          <SkeletonBar className="mb-8 h-8 w-32" />
          <SkeletonBar className="mb-8 h-3 w-48" />
          <SkeletonBar className="h-7 w-48" />
          <SkeletonText lines={8} className="mt-5" />
          <SkeletonBar className="mt-6 h-7 w-52" />
          <div className="mt-14 flex items-center justify-between">
            <div>
              <SkeletonBar className="h-6 w-40" />
              <SkeletonBar className="mt-2 h-4 w-72 max-w-full" />
            </div>
            <div className="hidden gap-2 sm:flex">
              {[0, 1, 2].map((i) => (
                <SkeletonBar key={i} className="h-9 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
