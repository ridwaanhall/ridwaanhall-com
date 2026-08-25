"use client";

import { useEffect } from "react";

import { ErrorPage } from "@/components/site/error-page";

import { onest } from "./fonts";

import "./globals.css";

/**
 * The boundary for a failure in the root layout itself.
 *
 * `error.tsx` cannot cover this. An error boundary wraps the page, the
 * `loading` and the nested layouts *below* it, but not the layout it sits
 * beside -- so a throw in `app/layout.tsx` walks straight past it to Next's
 * built-in 500 page, which is unstyled and follows the operating system's
 * colour scheme rather than the site's.
 *
 * This file replaces the root layout while it is active, which is why it
 * repeats things that normally live there:
 *
 * - `<html>` and `<body>` -- nothing else renders them at this point.
 * - `globals.css` -- the root layout's import is not in effect, so without
 *   this the palette and every utility class below are simply absent.
 * - the font variable -- same reason; `--font-onest` is declared by the class
 *   `next/font` generates, and that class is applied per element tree.
 *
 * What it deliberately does *not* repeat is the theme provider. There is no
 * `data-theme` here, so the palette falls to the `:root` branch, which is
 * dark -- the site's own default and the value in every prerendered document.
 * A reader who chose light gets a dark error page; that is the honest trade
 * against mounting a provider whose own module may be what failed.
 *
 * `metadata` cannot be exported from a Client Component, and an error boundary
 * has to be one, so the tab title is React's `<title>`.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    console.error("[global error boundary]", error);
  }, [error]);

  return (
    <html lang="en" className={onest.variable}>
      <body className="bg-black text-zinc-300">
        <title>Something Went Wrong &middot; Ridwan Halim</title>
        <ErrorPage
          code={500}
          title="Something Went Wrong"
          message="The page could not be rendered at all. It has been logged; please try again in a moment."
        />
      </body>
    </html>
  );
}
