import type { Route } from "next";
import Link from "next/link";

import { BackIcon } from "@/components/admin/admin-icons";
import { PILL_BUTTON, ROW_LINK } from "@/components/admin/control-classes";
import { ScreenHead } from "@/components/admin/screen-head";

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
        className={ROW_LINK}
      >
        <BackIcon height={14} width={14} />
        {backLabel}
      </Link>

      <ScreenHead title="Nothing here" lead={message} />
      <Link href={backHref} className={PILL_BUTTON}>
        <BackIcon height={13} width={13} />
        Back to {backLabel}
      </Link>
    </div>
  );
}
