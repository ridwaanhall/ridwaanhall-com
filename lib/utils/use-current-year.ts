"use client";

import { useSyncExternalStore } from "react";

/**
 * The current calendar year, without breaking prerendering.
 *
 * Reading the clock during a prerender is rejected under Cache Components --
 * for good reason, since the value would be frozen into the static shell. But
 * the copyright line genuinely wants the real year, and a site that is still
 * being served in January should not still say the year before.
 *
 * `useSyncExternalStore` is the sanctioned way to have both: the server
 * snapshot returns the year the bundle was built, so the prerendered HTML is
 * stable, and the client snapshot returns the real one. The two agree except
 * for a viewer loading a build made before New Year, where the year corrects
 * itself on hydration rather than staying wrong.
 */
// Inlined by next.config.ts at build time. Deliberately not `new Date()` here:
// this module is evaluated on the server while prerendering, and a clock read
// there is exactly what Cache Components rejects.
const BUILD_YEAR = Number(process.env.NEXT_PUBLIC_BUILD_YEAR) || 2026;

/** The year never changes while the page is open, so there is nothing to
 *  subscribe to. */
const subscribe = () => () => {};

export function useCurrentYear(): number {
  return useSyncExternalStore(
    subscribe,
    () => new Date().getFullYear(),
    () => BUILD_YEAR,
  );
}
