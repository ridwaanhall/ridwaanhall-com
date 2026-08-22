import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * One response envelope for every route handler.
 *
 * Success is `{ data }` and failure is `{ error, details? }`, always -- so a
 * client never has to guess which shape it got, and adding a top-level field
 * later (pagination metadata, say) cannot collide with a payload key.
 */
export type ApiSuccess<T> = { data: T };
export type ApiError = { error: string; details?: unknown };

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ data }, init);
}

export function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json<ApiError>({ error, ...(details ? { details } : {}) }, { status });
}

export function notFound(error = "Not found") {
  return fail(error, 404);
}

/**
 * Wrap a handler so an unexpected throw becomes a 500 rather than an unhandled
 * rejection. Mirrors `BaseView.handle_exceptions`: a data-layer failure should
 * degrade to an error response, never take the process with it.
 *
 * `unstable_rethrow` first, and it is not optional. Next signals control flow
 * by *throwing* -- `notFound()`, `redirect()`, and the interrupts the
 * prerenderer uses to discover that a route reads `searchParams` or uncached
 * data. A blanket catch swallows those signals and answers with a 500 instead,
 * so the prerenderer never learns the route bailed and sits waiting until its
 * 50s cache-fill timeout. That is not theoretical: it added ~110s to this
 * project's build and buried fourteen bogus errors in the output before this
 * line existed.
 */
export function handle<Args extends unknown[]>(
  fn: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await fn(...args);
    } catch (error) {
      unstable_rethrow(error);
      console.error("[api] unhandled error:", error);
      return fail("An internal error has occurred.", 500);
    }
  };
}
