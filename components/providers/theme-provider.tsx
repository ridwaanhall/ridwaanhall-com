"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

/**
 * Theme provider.
 *
 * `attribute="data-theme"` is what makes this a drop-in for the site's
 * existing palette remap: every colour utility compiles to a CSS variable, and
 * `html[data-theme="light"]` in styles/theme-light.css redefines those
 * variables. Nothing in the markup uses a `dark:` variant, and adding one
 * would work against the grain.
 *
 * `enableSystem={false}` is deliberate: `prefers-color-scheme` is never
 * consulted, because dark is the brand default rather than a fallback for when
 * the OS is silent.
 *
 * next-themes injects its own blocking pre-paint script. It must stay blocking
 * -- this is a
 * multi-page app, so a deferred script would flash the dark palette on every
 * single navigation for a light-mode reader.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      enableSystem={false}
      themes={["dark", "light"]}
      disableTransitionOnChange={false}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
