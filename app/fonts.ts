import { Funnel_Display, Geist, Geist_Mono } from "next/font/google";

/**
 * The faces, self-hosted by `next/font`, for the public site and the admin
 * alike.
 *
 * Their own module rather than constants in `layout.tsx`, because
 * `global-error.tsx` needs the same variables and is a Client Component:
 * importing the layout from it would drag the layout -- and every provider it
 * mounts -- across into the client bundle. What is here compiles to a plain
 * object at build time and costs nothing on either side of that line.
 *
 * Three faces with one job each. Funnel Display sets every heading and the few
 * large statements; its tight, slightly squared shapes are the site's voice.
 * Geist carries everything read -- interface and running text -- because it
 * stays neutral at 13 to 17px, where the display cut would start to perform.
 * Geist Mono is for figures, dates, slugs and code, never for a label.
 *
 * `preload: false` is the whole of the tuning. `subsets` is what drives
 * preloading, so listing them would put a `<link rel="preload">` for each in
 * every document; left off, the browser reads the `unicode-range` on each
 * generated `@font-face` and fetches only the file a page's characters land
 * in. Funnel Display has no Cyrillic subset, so a guestbook message in
 * Cyrillic falls through to the system face named after it.
 *
 * `app/globals.css` names Geist as Tailwind's `--font-sans`, which is what the
 * body and the admin inherit.
 */
export const funnelDisplay = Funnel_Display({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
  preload: false,
  variable: "--font-funnel-display",
});

export const geist = Geist({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: "variable",
  display: "swap",
  preload: false,
  variable: "--font-geist",
});

export const geistMono = Geist_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: "variable",
  display: "swap",
  preload: false,
  variable: "--font-geist-mono",
});

/** Every face's variable, for the `<html>` element of each root layout. */
export const fontVariables = `${funnelDisplay.variable} ${geist.variable} ${geistMono.variable}`;
