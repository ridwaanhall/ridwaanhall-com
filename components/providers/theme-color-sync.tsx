"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

/**
 * Keeps <meta name="theme-color"> in step with the chosen theme.
 *
 * This is the one part of theming that cannot be expressed as a palette remap:
 * the browser chrome colour is an attribute value, not a CSS variable, so
 * nothing in a stylesheet can reach it.
 *
 * Runs after paint, which is fine -- it tints browser UI, never page content,
 * so there is nothing to flash.
 */
export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", resolvedTheme === "light" ? "#ffffff" : "#000000");
  }, [resolvedTheme]);

  return null;
}
