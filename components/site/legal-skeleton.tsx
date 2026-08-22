import { SkeletonBar, SkeletonBlock, SkeletonPage, SkeletonText } from "@/components/skeleton";

/**
 * A legal document, while it loads.
 *
 * One component for three routes: `/terms`, `/privacy-policy` and the
 * `/legal/[slug]` catch-all all render `LegalDocumentPage`, so they all wait
 * for the same shape -- a summary, then bordered sections, then the
 * cross-links at the foot.
 */
export function LegalSkeleton() {
  return (
    <SkeletonPage gutter="article">
      <div className="mb-6 sm:mb-8">
        <SkeletonBar className="h-8 w-72 max-w-full mb-3" />
        <SkeletonBar className="h-4 w-full max-w-2xl mb-2" />
        <SkeletonBar className="h-4 w-2/5 max-w-md" />
      </div>

      <div className="space-y-4">
        {[0, 1, 2, 3].map((section) => (
          <div key={section} className="border border-zinc-700 rounded-lg p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 flex-1">
                <SkeletonBar className="h-5 w-5 rounded" />
                <SkeletonBar className="h-5 w-56 max-w-full" />
              </div>
              {/* The "last updated" pill sits on the first section only. */}
              {section === 0 && <SkeletonBar className="h-6 w-32 rounded-full" />}
            </div>
            <SkeletonText lines={4} />
          </div>
        ))}

        <SkeletonBlock className="rounded-lg border-zinc-700 p-4">
          <SkeletonBar className="h-5 w-48 mb-3" />
          <div className="flex flex-wrap gap-2">
            <SkeletonBar className="h-10 w-36 rounded-lg" />
            <SkeletonBar className="h-10 w-32 rounded-lg" />
          </div>
        </SkeletonBlock>
      </div>
    </SkeletonPage>
  );
}
