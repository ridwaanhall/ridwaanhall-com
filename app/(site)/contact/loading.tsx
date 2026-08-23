import { SkeletonBar, SkeletonBlock, SkeletonPage } from "@/components/skeleton";

/** The contact page, while it loads: the social row over the message form. */
export default function Loading() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-6 sm:mb-8">
        <SkeletonBar className="h-8 w-48 mb-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <SkeletonBar key={i} className="h-10 w-10 rounded-full" />
        ))}
      </div>

      <SkeletonBlock className="p-4 space-y-4">
        {/* Name and email side by side, then subject, then the message box. */}
        <div className="grid gap-4 sm:grid-cols-2">
          <SkeletonBar className="h-10" />
          <SkeletonBar className="h-10" />
        </div>
        <SkeletonBar className="h-10" />
        <SkeletonBar className="h-32" />
        <SkeletonBar className="h-16 w-full max-w-xs" />
        <SkeletonBar className="h-10 w-32 rounded-full" />
      </SkeletonBlock>
    </SkeletonPage>
  );
}
