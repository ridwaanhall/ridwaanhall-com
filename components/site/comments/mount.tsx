import { auth } from "@/auth";
import { SkeletonBar, SkeletonBlock } from "@/components/skeleton";
import { Comments } from "@/components/site/comments/section";
import { getUserProfile } from "@/lib/auth/profile";
import type { CommentTargetLabel } from "@/lib/data/comment-shapes";
import { getCommentSection } from "@/lib/data/comments";

/**
 * The comment section, resolved for one target.
 *
 * A server component, so the blog and project detail pages add comments in one
 * line and the query shape and the permission check live in one place rather
 * than once per page that mounts it.
 *
 * **Delete permission is decided here, not in the markup.** It needs the
 * viewer's author/co-author flags, which cost a query, and asking per comment
 * would repeat that for every row. It is also read from the database rather
 * than the session token, so revoking co-author takes effect at once; the
 * action re-checks the same way, since a flag in rendered HTML is a hint, not
 * an authorisation.
 *
 * The caller must wrap this in `<Suspense>`: it reads the session cookie and
 * uncached rows, and under `cacheComponents` an uncached read outside a
 * boundary stops the route prerendering.
 */
export async function CommentSectionFor({
  label,
  targetId,
  slug,
}: {
  label: CommentTargetLabel;
  targetId: string;
  /** The detail page's slug, so an action knows what to revalidate. */
  slug: string;
}) {
  const session = await auth();
  const viewerId = session?.user?.id;
  const profile = viewerId ? await getUserProfile(viewerId) : null;

  const viewer = profile
    ? { userId: profile.id, moderate: profile.can.moderateComments }
    : null;

  const section = await getCommentSection({ label, targetId, viewer });

  return (
    <Comments
      section={section}
      slug={slug}
      signedInAs={profile?.fullName ?? null}
      canPost={profile?.can.comment ?? false}
    />
  );
}

/** Holds the section's height while it streams, so the page does not jump. */
export function CommentSectionSkeleton() {
  return (
    <section
      className="skeleton-pulse mt-10 sm:mt-12 pt-8 border-t border-zinc-800"
      role="status"
      aria-busy="true"
    >
      <span className="sr-only">Loading comments…</span>
      <div aria-hidden="true">
        <SkeletonBar className="h-7 w-32" />
        <SkeletonBlock className="mt-6 h-32" />
      </div>
    </section>
  );
}
