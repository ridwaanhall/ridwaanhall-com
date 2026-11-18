"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { FRESH_RETRY_DELAYS_MS, isStale } from "@/lib/site/fresh";

/**
 * Asks the router for a fresh render when the page it sits in was cached too
 * long ago. A CDN may answer the first refresh with the very copy that
 * triggered regeneration, so it retries on a short ladder and then gives up
 * without a word. Renders nothing.
 */
export function FreshGuard({ fetchedAt }: { fetchedAt: number }) {
  const router = useRouter();
  const stamp = useRef(fetchedAt);
  const attempts = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    stamp.current = fetchedAt;
    if (!isStale(fetchedAt, Date.now())) attempts.current = 0;
  }, [fetchedAt]);

  useEffect(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };

    const check = () => {
      if (timer.current) return;
      if (!isStale(stamp.current, Date.now())) {
        attempts.current = 0;
        return;
      }
      if (attempts.current >= FRESH_RETRY_DELAYS_MS.length) return;
      const delay = FRESH_RETRY_DELAYS_MS[attempts.current++];
      timer.current = setTimeout(() => {
        timer.current = null;
        // The refreshed props may have landed fresh in the meantime.
        if (!isStale(stamp.current, Date.now())) {
          attempts.current = 0;
          return;
        }
        router.refresh();
        check();
      }, delay);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };

    check();
    window.addEventListener("pageshow", check);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("pageshow", check);
      document.removeEventListener("visibilitychange", onVisible);
      clear();
    };
  }, [router]);

  return null;
}
