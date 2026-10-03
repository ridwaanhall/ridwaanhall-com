import { Literata, Martian_Mono, Mona_Sans } from "next/font/google";

/**
 * The site's three faces, self-hosted by `next/font`, one job each.
 *
 * - **Mona Sans** is the voice of the interface and of every heading. It is
 *   variable in width as well as weight, and the width is the point: display
 *   sizes are set wider than body text, so one family carries both a headline
 *   and a label without a second sans to pair it with.
 * - **Literata** is the reading voice -- page leads, article and project
 *   bodies, and whatever visitors write in the guestbook and comments. A book
 *   face with an optical-size axis, so it tightens at caption sizes and opens
 *   up at lead sizes on its own.
 * - **Martian Mono** carries the traces: dates, durations, counts, tags, the
 *   labels above figures, code. Set narrower than its default width, so a date
 *   beside a title reads as an annotation rather than as a second heading.
 *
 * Literata and Martian Mono both cover Cyrillic, and that decides which face
 * sets user-written text: guestbook messages are written by real visitors, and
 * Mona Sans has no Cyrillic.
 *
 * Their own module rather than constants in `layout.tsx`, because
 * `global-error.tsx` needs the same variables and is a Client Component:
 * importing the layout from it would drag the layout -- and every provider it
 * mounts -- across into the client bundle.
 *
 * `preload: false` throughout. `subsets` is what drives preloading, so listing
 * the Cyrillic ones would otherwise put their files in every document's
 * preload list. Left off, the browser reads the `unicode-range` on each
 * generated `@font-face` and fetches only the file a page's characters
 * actually land in.
 *
 * `app/globals.css` names the three variables through Tailwind's font tokens.
 */
export const monaSans = Mona_Sans({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  preload: false,
  variable: "--font-mona",
});

export const literata = Literata({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
  preload: false,
  variable: "--font-literata",
});

export const martianMono = Martian_Mono({
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  weight: "variable",
  axes: ["wdth"],
  display: "swap",
  preload: false,
  variable: "--font-martian",
});

/** All three variables, for the `<html>` element. */
export const fontVariables = `${monaSans.variable} ${literata.variable} ${martianMono.variable}`;
