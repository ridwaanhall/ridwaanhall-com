"use client";

import { useEffect } from "react";

import { ErrorPage } from "@/components/site/error-page";

/**
 * The uncaught-exception boundary.
 *
 * Django had no equivalent -- `BaseView.handle_exceptions` caught data errors
 * per view and rendered the same error template with a 500. This covers the
 * same ground for every route at once.
 *
 * The `reset` prop is deliberately not surfaced as a button. It re-renders the
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
