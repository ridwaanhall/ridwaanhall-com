import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/auth";
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
 * token -- `getUserProfile` reads `is_author` / `is_co_author` -- so revoking
 * co-author takes effect on the next page load rather than when a 30-day JWT
 * expires. The actions re-check the same way; this pair only decides which
 * controls to draw.
 */
export default function GuestbookPage() {
  return (
    <>
      <JsonLdScript schemas={guestbookSchemas()} />
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
              Guestbook
            </h1>
            <p className="mt-2 text-base sm:text-lg text-zinc-300 leading-relaxed">
              Leave a trace of your own. Say hello, ask something, or just let me know you were
              here.
            </p>
          </div>

          {/*
            The heading above is static and prerenders; everything below reads
            the session cookie and the live thread, neither of which is cached.
            Under `cacheComponents` an uncached read outside a boundary is a
            build error (`blocking-prerender-dynamic`), and rightly so -- this
            is the same shape the dashboard uses for its two API panels.
          */}
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
        isAuthor: profile?.isAuthor ?? false,
        canPin: profile?.canPin ?? false,
      }}
      signedInAs={profile ? { name: profile.fullName, email: maskEmail(profile.email) } : null}
    />
  );
}
