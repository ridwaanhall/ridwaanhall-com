import type { Route } from "next";
import Link from "next/link";

import { BackIcon } from "@/components/admin/admin-icons";

/**
 * "That is not here", inside the admin rather than on the public 404 page.
 *
 * Rendered two ways, which is why it is a component and not just the body of
 * `app/admin/not-found.tsx`:
 *
 * - as that segment's `not-found.tsx`, for a URL the router itself rejects --
 *   an unbuilt screen, a key that is not in the registry. Those do get a real
 *   404 status.
 * - **returned normally** from inside the record route's `<Suspense>` boundary,
 *   for a row that does not exist. `notFound()` cannot be used there: once the
 *   shell is committed and the fallback is on screen, throwing it resolves the
 *   boundary to nothing at all, leaving an empty page. A missing record is
 *   ordinary content here, so it is rendered as content.
 */
export function NothingHere({
  message,
  backLabel = "Admin",
  backHref = "/admin" as Route,
}: {
  message: string;
  backLabel?: string;
  backHref?: Route;
}) {
  return (
    <div className="max-w-3xl space-y-4">
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 rounded text-xs text-zinc-500 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        <BackIcon height={14} width={14} />
        {backLabel}
      </Link>

      <div className="rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 px-6 py-10 text-center">
        <h1 className="text-lg font-medium text-zinc-200">Nothing here</h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-400">{message}</p>
        <Link
          href={backHref}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-zinc-800 px-4 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        >
          <BackIcon height={13} width={13} />
          Back to {backLabel}
        </Link>
      </div>
    </div>
  );
}
