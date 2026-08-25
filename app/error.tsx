"use client";

import { useEffect } from "react";

import { ErrorPage } from "@/components/site/error-page";

/**
 * The uncaught-exception boundary.
 *
 * One boundary for every route, rather than each page catching its own data
 * errors and rendering the same thing.
 *
 * The `retry` prop is deliberately not surfaced as a button. It re-renders the
 * segment, which helps only for a transient failure; for the failure this app
 * actually has -- a database that is unreachable -- it would look like a retry
 * that does nothing. "Go Back" and "Go to Homepage" are honest about what they
 * do.
 */
export default function Error({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[error boundary]", error);
  }, [error]);

  return (
    <ErrorPage
      code={500}
      title="Something Went Wrong"
      message="An unexpected error occurred while loading this page. It has been logged; please try again in a moment."
    />
  );
}
