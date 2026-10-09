"use client";

import { useEffect } from "react";

import { ErrorPage } from "@/components/site/error-page";

/**
 * The uncaught-exception boundary.
 *
 * One boundary for every route, rather than each page catching its own data
 * errors and rendering the same thing.
 *
 * The `retry` prop is deliberately not surfaced. It re-renders the segment,
 * which helps only for a transient failure; for the failure this app actually
 * has -- a database that is unreachable -- it would look like a retry that
 * does nothing. Try again here reloads the page, which is a fresh request.
 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <ErrorPage
      code={500}
      title="Something broke on this side."
      message="Nothing you did. The page could not be put together just now; trying again usually works."
      digest={error.digest}
    />
  );
}
