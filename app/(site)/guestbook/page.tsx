import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/auth";
import { CONTAINER, PageHeader } from "@/components/site/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { GuestbookPanel } from "@/components/site/guestbook/panel";
import { GuestbookPanelSkeleton } from "@/components/site/guestbook/panel-skeleton";
import { getUserProfile } from "@/lib/auth/profile";
import { getAboutData } from "@/lib/data/about";
import { getThread } from "@/lib/data/guestbook";
import { maskEmail } from "@/lib/data/guestbook-tree";
import { guestbookSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { guestbookSchemas } from "@/lib/seo/schemas-for-page";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(guestbookSeo(about), about);
}

/**
 * The guestbook.
 *
 * Dynamic, not prerendered: it reads the session and the thread has to be
 * current. Everything else on the site goes through `use cache`, but a
 * guestbook that shows a message a minute after it was posted is broken.
 *
 * The viewer's permissions come from the database rather than the session
 * token -- `getUserProfile` reads the role and the two public switches -- so
 * taking a role away takes effect on the next page load rather than when a
 * 30-day JWT expires. The actions re-check the same way; these three only
 * decide which controls to draw.
 */
export default function GuestbookPage() {
  return (
    <>
      <JsonLdScript schemas={guestbookSchemas()} />
      <main className={CONTAINER}>
        <PageHeader
          title="Guestbook"
          lead="Leave a trace of your own. Say hello, ask something, or just let me know you were here."
        />

        <div className="pt-4 pb-8">
          <Suspense fallback={<GuestbookPanelSkeleton />}>
            <Panel />
          </Suspense>
        </div>
      </main>
    </>
  );
}

async function Panel() {
  const session = await auth();
  // The subject is a uuid now, so there is nothing to parse -- it is either
  // there or it is not.
  const viewerId = session?.user?.id;

  const [thread, profile] = await Promise.all([
    getThread(),
    viewerId ? getUserProfile(viewerId) : Promise.resolve(null),
  ]);

  return (
    <GuestbookPanel
      thread={thread}
      viewer={{
        userId: profile ? profile.id : null,
        canPost: profile?.can.guestbook ?? false,
        canPin: profile?.can.pin ?? false,
        canDelete: profile?.can.deleteMessages ?? false,
      }}
      signedInAs={profile ? { name: profile.fullName, email: maskEmail(profile.email) } : null}
    />
  );
}
