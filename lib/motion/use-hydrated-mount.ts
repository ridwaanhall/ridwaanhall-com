import { useState, useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * Whether this component was mounted by hydration rather than by a client
 * render.
 *
 * The difference decides whether an entrance may play. Hydrated markup was
 * painted by the server before any script ran, so animating it in from
 * nothing would show it, hide it and show it again. A component mounted by a
 * client navigation has never been painted, and can enter freely.
 *
 * During hydration `useSyncExternalStore` answers with the server snapshot,
 * so the first render sees `false` exactly when it is hydrating; the state
 * keeps that first answer for the component's life.
 */
export function useMountedByHydration(): boolean {
  const client = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [byHydration] = useState(!client);
  return byHydration;
}
