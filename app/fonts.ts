import { Funnel_Display, Funnel_Sans, JetBrains_Mono, Onest } from "next/font/google";

/**
 * Onest, self-hosted by `next/font`.
 *
 * Its own module rather than a constant in `layout.tsx`, because
 * `global-error.tsx` needs the same variable and is a Client Component:
 * importing the layout from it would drag the layout -- and every provider it
 * mounts -- across into the client bundle. What is here compiles to a plain
 * object at build time and costs nothing on either side of that line.
 *
 * `preload: false` is the whole of the tuning, and it is deliberate. `subsets`
 * is what drives preloading, so listing all four -- which is what keeps
 * Cyrillic working -- would otherwise put four `<link rel="preload">` tags in
 * every document and fetch the Cyrillic faces for every reader, almost none of
 * whom need them. Left off, the browser reads the `unicode-range` on each
 * generated `@font-face` and fetches only the file a page's characters
 * actually land in, which is what the hand-written `@font-face` block this
 * replaced did.
 *
 * All four subsets rather than latin alone: guestbook messages are written by
 * real visitors, and dropping Cyrillic would render theirs in a fallback.
 *
 * `app/globals.css` names `--font-onest` through Tailwind's `--font-sans`.
 */
export const onest = Onest({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: "variable",
  display: "swap",
  preload: false,
  variable: "--font-onest",
});

/*
 * The public site's faces. The admin keeps Onest; these are applied only
 * inside the site shell, so nothing the admin renders changes metrics.
 *
 * One family in two cuts carries everything a reader reads: Funnel Display for
 * headings and the few large statements, Funnel Sans for interface and running
 * text. A sans for both, deliberately -- a serif brought in only for "reading"
 * is a second voice the content never asked for. JetBrains Mono is kept for
 * data alone: the dashboard's figures and code.
 *
 * `preload: false` for the same reason as above: the browser fetches only the
 * subset file a page's characters actually land in. Neither Funnel cut has a
 * Cyrillic subset, so a guestbook message in Cyrillic falls through to the
 * system face named after it in `styles/site.css`.
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
