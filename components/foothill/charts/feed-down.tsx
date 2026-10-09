"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { RetryButton } from "@/components/foothill/controls";
import { Empty } from "@/components/foothill/ui";

/**
 * A panel whose source did not answer: it names the source, says the figures
 * come back by themselves, and offers to ask again now. Only the panels that
 * depend on that source change; the rest of the page stays as it is.
 */
export function FeedDown({ source }: { source: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Empty
      icon="cloud"
      title={`${source} did not answer`}
      note="The site asks again every 15 minutes, and the figures come back on their own."
      action={<RetryButton busy={pending} onRetry={() => startTransition(() => router.refresh())} />}
    />
  );
}
