import { SkeletonBar, SkeletonPage, SkeletonPageHeading, SkeletonText } from "@/components/skeleton";

/**
 * A legal document, while it loads: the header with its last-updated line,
 * then ruled sections at the reading measure. Shared by the privacy policy,
 * the terms and every `/legal/<slug>`.
 */
export function LegalSkeleton() {
  return (
    <SkeletonPage>
      <SkeletonPageHeading />
      <div className="max-w-3xl border-t border-zinc-800 pb-8">
        {[0, 1, 2, 3].map((section) => (
          <div key={section} className="border-t border-zinc-800 py-10 first:border-t-0">
            <SkeletonBar className="h-7 w-64 max-w-full" />
            <SkeletonText lines={4} className="mt-5" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
