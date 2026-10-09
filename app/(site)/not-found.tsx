import type { Metadata } from "next";

import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { NotHere } from "@/components/foothill/nothing";

/**
 * An address inside the site that leads nowhere, in the site's own chrome.
 * `noindex`: a stale URL indexed as a real page costs the pages that exist.
 */
export const metadata: Metadata = {
  title: "Nothing lives here",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={MAIN} data-quiet="">
      <div>
        <NotHere />
      </div>
      <PageMotion />
    </main>
  );
}
