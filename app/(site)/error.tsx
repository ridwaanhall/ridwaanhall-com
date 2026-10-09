"use client";

import { useEffect } from "react";

import { MAIN } from "@/components/foothill/layout";
import { Broke } from "@/components/foothill/nothing";

/**
 * A page of the site failed. Inside the site's chrome, so the reader keeps the
 * navigation and the search; the root `app/error.tsx` covers what fails
 * outside it.
 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <main className={MAIN} data-quiet="">
      <div>
        <Broke digest={error.digest} />
      </div>
    </main>
  );
}
