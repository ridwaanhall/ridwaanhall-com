import { SkeletonBar, SkeletonPage } from "@/components/skeleton";

/** Sign-in, while it loads: the title, the explanation, the two providers. */
export default function Loading() {
  return (
    <SkeletonPage>
      <div className="flex min-h-[70vh] items-center justify-center py-16">
        <div className="w-full max-w-sm">
          <SkeletonBar className="h-10 w-36" />
          <div className="mt-4 space-y-2">
            <SkeletonBar className="h-5 w-full" />
            <SkeletonBar className="h-5 w-11/12" />
            <SkeletonBar className="h-5 w-2/5" />
          </div>
          <div className="mt-10 space-y-2">
            <SkeletonBar className="h-11 w-full rounded-lg" />
            <SkeletonBar className="h-11 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
