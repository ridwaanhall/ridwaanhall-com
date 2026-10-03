import { SkeletonBar, SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";

/**
 * The contact page, while it loads: the header, then the list of channels
 * beside the form, stacked below `lg`.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="grid gap-16 pt-4 pb-8 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <SkeletonBar className="h-6 w-52 md:h-7" />
          <SkeletonBar className="mt-3 h-4 w-full max-w-sm" />
          <div className="mt-8">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 py-3.5">
                <SkeletonBar className="h-5 w-5 rounded-full" />
                <SkeletonBar className="h-5 w-24" />
                <SkeletonBar className="ml-auto h-3 w-36" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <SkeletonBar className="h-6 w-56 md:h-7" />
          <SkeletonBar className="mt-3 h-4 w-full max-w-md" />
          <div className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <SkeletonBar className="h-[69px] flex-1 rounded-full" />
              <SkeletonBar className="h-[69px] flex-1 rounded-full" />
            </div>
            <SkeletonBar className="h-[206px] rounded-lg" />
            <SkeletonBar className="h-[65px] w-full max-w-[300px]" />
            <SkeletonBar className="h-11 w-56 rounded-full" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
