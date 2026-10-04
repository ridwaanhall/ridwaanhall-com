import { Funnel_Display, Funnel_Sans, JetBrains_Mono } from "next/font/google";

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
 * One family in two cuts carries everything: Funnel Display for headings and
 * the few large statements, Funnel Sans for interface and running text. A sans
 * for both, deliberately -- a serif brought in only for "reading" is a second
 * voice the content never asked for. JetBrains Mono is kept for data alone:
 * the dashboard's figures, code, and the admin's keys and slugs.
 *
 * `preload: false` is the whole of the tuning. `subsets` is what drives
 * preloading, so listing them would put a `<link rel="preload">` for each in
 * every document; left off, the browser reads the `unicode-range` on each
 * generated `@font-face` and fetches only the file a page's characters land
 * in. Neither Funnel cut has a Cyrillic subset, so a guestbook message in
 * Cyrillic falls through to the system face named after it.
 *
 * `app/globals.css` names Funnel Sans as Tailwind's `--font-sans`, which is
 * what the body and the admin inherit.
 */
export const funnelDisplay = Funnel_Display({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  display: "swap",
  preload: false,
  variable: "--font-funnel-display",
});

export const funnelSans = Funnel_Sans({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
  variable: "--font-funnel-sans",
});

export const jetbrains = JetBrains_Mono({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: "variable",
  display: "swap",
  preload: false,
  variable: "--font-jetbrains",
});
