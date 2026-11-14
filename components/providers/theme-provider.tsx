"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ComponentProps } from "react";

const THEMES = ["dark", "light"];
const DEFAULT_THEME = "dark";

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
 * -- this is a multi-page app, so a deferred script would flash the dark
 * palette on every single navigation for a light-mode reader.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme={DEFAULT_THEME}
      enableSystem={false}
      themes={THEMES}
      disableTransitionOnChange={false}
      {...props}
    >
      <DropUnknownTheme />
      {children}
    </NextThemesProvider>
  );
}

/**
 * A stored theme this site does not offer is replaced with the default.
 *
 * next-themes writes whatever `localStorage.theme` holds straight onto
 * `data-theme` -- its `value` map applies to the class attribute only -- so a
 * browser that once stored `system` rendered `data-theme="system"`, which
 * neither palette matches: the page fell back to the root colours and skipped
 * dark-by-default. Its pre-paint script cannot be taught otherwise, so the
 * first page such a reader opens is corrected after hydration and stored, and
 * every page after that paints right.
 */
function DropUnknownTheme() {
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (theme && !THEMES.includes(theme)) setTheme(DEFAULT_THEME);
  }, [theme, setTheme]);
  return null;
}
