import type { Metadata } from "next";

import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { Unpublished } from "@/components/foothill/nothing";

/** A slug with nothing published behind it: a draft, or an old link. */
export const metadata: Metadata = {
  title: "Not published",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className={MAIN} data-quiet="">
      <div>
        <Unpublished kind="post" />
      </div>
      <PageMotion />
    </main>
  );
}
