import { Onest } from "next/font/google";

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
