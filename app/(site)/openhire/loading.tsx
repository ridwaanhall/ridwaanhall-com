import { SkeletonBar, SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";

/**
 * OpenHire, while it loads: the header, the tab strip, then ruled sections --
 * a name on the left, label-and-value rows on the right.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <SkeletonBar className="mb-4 h-11 w-52 rounded-full" />
      {[0, 1, 2, 3].map((section) => (
        <div key={section} className="grid grid-cols-1 gap-x-10 gap-y-4 py-9 md:grid-cols-[12rem_1fr]">
          <SkeletonBar className="mt-1 h-3 w-32" />
          <div>
            {[0, 1, 2].map((row) => (
              <div key={row} className="flex justify-between gap-4 py-2.5">
                <SkeletonBar className="h-4 w-36" />
                <SkeletonBar className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </SkeletonPage>
  );
}
