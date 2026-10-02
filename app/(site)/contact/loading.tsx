import { SkeletonBar, SkeletonPage, SkeletonPageHeading } from "@/components/skeleton";

/**
 * The contact page, while it loads: the header, then the list of channels
 * beside the form, stacked below `lg`.
 */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="grid gap-16 border-t border-zinc-800 pt-12 pb-8 md:pt-16 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <SkeletonBar className="h-7 w-44" />
          <SkeletonBar className="mt-2 h-4 w-full max-w-sm" />
          <div className="mt-8 border-b border-zinc-800">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 border-t border-zinc-800 py-4">
                <SkeletonBar className="h-5 w-5 rounded" />
                <SkeletonBar className="h-5 w-24" />
                <SkeletonBar className="ml-auto h-4 w-36" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <SkeletonBar className="h-7 w-48" />
          <SkeletonBar className="mt-2 h-4 w-full max-w-md" />
          <div className="mt-8 flex flex-col gap-5">
            <div className="flex flex-col gap-5 sm:flex-row">
              <SkeletonBar className="h-[74px] flex-1 rounded-lg" />
              <SkeletonBar className="h-[74px] flex-1 rounded-lg" />
            </div>
            <SkeletonBar className="h-[180px] rounded-lg" />
            <SkeletonBar className="h-[65px] w-full max-w-[300px]" />
            <SkeletonBar className="h-10 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
