import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Guestbook } from "@/components/foothill/guestbook";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { Bar } from "@/components/foothill/skeleton";
import { PageHead } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
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

export default function GuestbookPage() {
  return (
    <main className={MAIN}>
      <JsonLdScript schemas={guestbookSchemas()} />
      <div className={WRAP}>
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <PageHead
                title="Leave a line."
                lead="Say hello, ask a question, or tell me one of the APIs is down. I read every message."
              />
            </div>
          </div>
          <div className="min-w-0 lg:col-span-8">
            {/*
              The heading above is static and prerenders; everything below
              reads the session cookie and the live thread, neither of which is
              cached. Under `cacheComponents` an uncached read outside a
              boundary stops the route prerendering.
            */}
            <Suspense fallback={<GuestbookSkeleton />}>
              <Panel />
            </Suspense>
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

async function Panel() {
  const session = await auth();
  const viewerId = session?.user?.id;

  const [thread, profile] = await Promise.all([
    getThread(),
    viewerId ? getUserProfile(viewerId) : Promise.resolve(null),
  ]);

  return (
    <Guestbook
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

function GuestbookSkeleton() {
  return (
    <div role="status" aria-busy="true" className="skeleton-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true" className="overflow-hidden rounded-[20px] border border-line">
        <div className="border-b border-line px-5 py-4">
          <Bar className="h-5 w-28" />
        </div>
        <div className="h-[min(68vh,720px)] px-5 py-6">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="mb-8 flex gap-3">
              <Bar className="h-[30px] w-[30px] rounded-full" />
              <div className="flex-1">
                <Bar className="h-3.5 w-40" />
                <Bar className="mt-3 h-4 w-[80%]" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line px-5 py-4">
          <Bar className="h-[58px] w-full" />
        </div>
      </div>
    </div>
  );
}
