import { SkeletonBar, SkeletonPage, SkeletonText } from "@/components/skeleton";
import { PageHeaderSkeleton } from "@/components/site/ui/page-header";

/**
 * A legal document, while it loads.
 *
 * One component for three routes: `/terms`, `/privacy-policy` and the
 * `/legal/[slug]` catch-all all render `LegalDocumentPage`, so they all wait
 * for the same shape -- a title and summary, then numbered clauses divided by
 * rules, then the cross-links at the foot.
 *
 * The header comes from `PageHeaderSkeleton`, which lives beside the header it
 * stands in for. What is drawn here is only what this page adds to it.
 */
export function LegalSkeleton() {
  return (
    <SkeletonPage>
      <div>
        <PageHeaderSkeleton />

        <div className="divide-y divide-zinc-800">
          {[0, 1, 2, 3].map((clause) => (
            <div key={clause} className="py-6 first:pt-0">
              <div className="mb-stack flex items-baseline gap-3">
                {/* The clause number, then its heading. */}
                <SkeletonBar className="h-5 w-3" />
                <SkeletonBar className="h-5 w-56 max-w-full" />
              </div>
              <SkeletonText lines={4} className="max-w-measure" />
            </div>
          ))}
        </div>

        <div className="mt-section border-t border-zinc-800 pt-6">
          <SkeletonBar className="h-4 w-36" />
          <div className="mt-3 flex flex-wrap gap-2">
            <SkeletonBar className="h-8 w-36 rounded-full" />
            <SkeletonBar className="h-8 w-32 rounded-full" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
