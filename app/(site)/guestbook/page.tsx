import type { Metadata } from "next";
import { Suspense } from "react";

import { auth } from "@/auth";
import { Guestbook } from "@/components/foothill/guestbook";
import { MAIN } from "@/components/foothill/layout";
import { MarkdownChips } from "@/components/foothill/markdown";
import { PageMotion } from "@/components/foothill/motion";
import { Bar, InlineSkeleton, RowSkeleton } from "@/components/foothill/skeleton";
import { Facts } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getUserProfile } from "@/lib/auth/profile";
import { getAboutData } from "@/lib/data/about";
import { getThread } from "@/lib/data/guestbook";
import type { Thread, ThreadMessage } from "@/lib/data/guestbook-tree";
import { guestbookSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { guestbookSchemas } from "@/lib/seo/schemas-for-page";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(guestbookSeo(), about);
}

/**
 * The heading is static and prerenders; the facts beside it and everything
 * below read the live thread and the session cookie, neither of which is
 * cached. Under `cacheComponents` an uncached read outside a boundary stops
 * the route prerendering, so each streams behind its own `<Suspense>`.
 */
export default function GuestbookPage() {
  return (
    <main className={MAIN}>
      <JsonLdScript schemas={guestbookSchemas()} />
      <div>
        <section className="head wrap">
          <div>
            <h1 className="t1" data-fh-split="">
              Leave a line.
            </h1>
            <p className="lead">Say hello, ask a question, or tell me one of the APIs is down. I read every message.</p>
            <MarkdownChips path="/guestbook" />
          </div>
          <Suspense fallback={<FactsSkeleton />}>
            <ThreadFacts />
          </Suspense>
        </section>
        <Suspense fallback={<GuestbookSkeleton />}>
          <Panel />
        </Suspense>
      </div>
      <PageMotion />
    </main>
  );
}

function everyone(thread: Thread): ThreadMessage[] {
  const out: ThreadMessage[] = [];
  const walk = (list: ThreadMessage[]) =>
    list.forEach((message) => {
      out.push(message);
      walk(message.replies);
    });
  walk(thread.roots);
  return out;
}

async function ThreadFacts() {
  const thread = await getThread();
  const all = everyone(thread);
  return (
    <div>
      <Facts
        rows={[
          ["Messages", thread.messageCount],
          ["Threads", thread.roots.length],
          ["People", new Set(all.map((message) => message.userId)).size],
          ["Pinned", all.filter((message) => message.isPinned).length],
        ]}
      />
    </div>
  );
}

async function Panel() {
  const session = await auth();
  const viewerId = session?.user?.id;
  const [thread, profile] = await Promise.all([getThread(), viewerId ? getUserProfile(viewerId) : Promise.resolve(null)]);

  return (
    <Guestbook
      thread={thread}
      viewer={{
        userId: profile ? profile.id : null,
        canPost: profile?.can.guestbook ?? false,
        canPin: profile?.can.pin ?? false,
        canDelete: profile?.can.deleteMessages ?? false,
      }}
      signedInAs={profile ? { name: profile.fullName, image: profile.profileImage ?? null } : null}
    />
  );
}

function FactsSkeleton() {
  return (
    <div className="facts" aria-hidden="true">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i}>
          <Bar w="38%" />
          <Bar w="20%" />
        </div>
      ))}
    </div>
  );
}

function GuestbookSkeleton() {
  return (
    <InlineSkeleton label="Loading the guestbook">
      <div className="wrap gbwrap gb" style={{ paddingBottom: 72 }}>
        <div className="compose">
          <Bar w="60%" h={20} />
          <Bar w="100%" h={200} r="var(--fh-r-m)" />
          <Bar w="100%" h={48} r="var(--fh-r-m)" />
          <Bar w="100%" h={48} r="var(--fh-r-m)" />
        </div>
        <div>
          {/* Twelve: the thread lands twelve at a time and fills the screen, and a
              placeholder that fills less leaves the page to jump when it does. */}
          {Array.from({ length: 12 }, (_, i) => (
            <RowSkeleton key={i} avatar />
          ))}
        </div>
      </div>
    </InlineSkeleton>
  );
}
