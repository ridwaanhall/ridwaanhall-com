"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

/**
 * The Cloudflare Turnstile widget, themed with the rest of the site.
 *
 * The theme is passed explicitly rather than left to Turnstile's `auto`, which
 * follows `prefers-color-scheme`, i.e. the **operating system**. That is the
 * one signal this site deliberately never consults: dark is the brand default,
 * not a fallback for when the OS is silent, and the reader's own toggle is what
 * decides. Left on `auto`, a reader who has switched the site to light while
 * their OS is dark gets a dark box in the middle of a white form.
 *
 * So the theme is passed explicitly, from `next-themes`' resolved value.
 *
 * **It has to be rendered explicitly, not by the script's own scan**, for two
 * reasons the implicit path cannot handle: the script scans the document once
 * on load, so a widget that mounts later never appears; and `data-theme` is
 * read when the widget is created, so changing the attribute afterwards does
 * nothing. Re-rendering on every theme change is the only way it follows the
 * toggle.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; theme?: "light" | "dark" | "auto"; callback?: (token: string) => void },
      ) => string | undefined;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
    /** Set by the script's `onload` parameter once `window.turnstile` exists. */
    onTurnstileLoad?: () => void;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY;
const SCRIPT_ID = "cf-turnstile-script";

export function TurnstileWidget() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!SITE_KEY) return;
    const container = containerRef.current;
    if (!container) return;

    // `resolvedTheme` is undefined until next-themes has read storage. Waiting
    // avoids rendering a widget in the wrong theme and immediately replacing
    // it, which would flash and cost a second challenge.
    if (!resolvedTheme) return;

    let cancelled = false;

    const render = () => {
      if (cancelled || !window.turnstile) return;
      // Replace rather than re-theme: the widget reads its theme once, at
      // creation, so a change means tearing the old one down.
      if (widgetRef.current !== undefined) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = undefined;
      }
      container.innerHTML = "";
      widgetRef.current = window.turnstile.render(container, {
        sitekey: SITE_KEY,
        theme: resolvedTheme === "light" ? "light" : "dark",
      });
    };

    if (window.turnstile) {
      render();
    } else {
      // One script for the page, whichever mount gets there first. Its `onload`
      // callback is the documented way to know `window.turnstile` is ready --
      // the script's own `load` event fires slightly earlier.
      window.onTurnstileLoad = render;
      if (!document.getElementById(SCRIPT_ID)) {
        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (widgetRef.current !== undefined && window.turnstile) {
        window.turnstile.remove(widgetRef.current);
        widgetRef.current = undefined;
      }
    };
  }, [resolvedTheme]);

  // Without a site key there is nothing to render, and the server skips
  // verification for the same reason -- see `lib/email/turnstile.ts`.
  if (!SITE_KEY) return null;

  // Turnstile injects its own `<input name="cf-turnstile-response">` in here,
  // which is what the form submits and the action verifies.
  return <div ref={containerRef} className="cf-turnstile" />;
}

/** Reset the widget so a second submission gets a fresh, unused token. */
export function resetTurnstile() {
  window.turnstile?.reset();
}
