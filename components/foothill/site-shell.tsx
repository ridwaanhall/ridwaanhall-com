"use client";

import { MotionConfig } from "motion/react";
import { Suspense } from "react";

import { Cursor } from "@/components/foothill/cursor";
import { CvViewer } from "@/components/foothill/cv";
import { MarkdownViewer } from "@/components/foothill/markdown";
import { Navbar, NavbarFallback } from "@/components/foothill/navbar";
import { PaletteProvider } from "@/components/foothill/palette";
import { ScrollTop } from "@/components/foothill/scroll-top";
import { ImageServiceProvider } from "@/components/foothill/site-image";
import type { AboutData } from "@/lib/data/about";
import type { ImageSettings } from "@/lib/site/image-service";

/**
 * The public site's frame: the navbar, the page, the footer, the way back to
 * the top, and the overlays any page can open -- the search, the CV and a
 * page's Markdown twin.
 *
 * `MotionConfig reducedMotion="user"` is where every Framer Motion animation
 * on the site learns whether the reader asked for less: transforms stop,
 * opacity still fades. GSAP reads the same preference through `MOTION_OK`.
 *
 * `#page-content` is not keyed on the pathname. The router already mounts a
 * fresh page whenever a segment changes -- two posts are two cache keys -- and
 * a key would have to read the pathname, which under Cache Components means a
 * `<Suspense>` whose fallback is the whole page: every document then carried
 * its content twice. Toasts, the confirm dialog and the loading bar live
 * outside it at body level, and `scripts/check-notifications.mjs` holds them
 * there.
 *
 * The navbar is the one reader of the pathname here, and it sits inside
 * `<Suspense>`: `usePathname` suspends while prerendering a route whose
 * params were not listed in advance, and outside a boundary that blocks the
 * whole route. Its fallback is the same bar with nothing marked current.
 *
 * The footer arrives as a rendered server component, so its links cost the
 * client nothing.
 */
export function SiteShell({
  about,
  images,
  account,
  footer,
  children,
}: {
  about: AboutData;
  /** How pictures are resized: the Site settings screen's answer. */
  images: ImageSettings;
  account: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <MotionConfig reducedMotion="user">
      <ImageServiceProvider settings={images}>
        <PaletteProvider about={about}>
          <div className="fh-site">
            <a href="#page-content" className="skip">
              Skip to content
            </a>
            <Suspense fallback={<NavbarFallback about={about} account={account} />}>
              <Navbar about={about} account={account} />
            </Suspense>
            <div id="page-content" tabIndex={-1}>
              <div>{children}</div>
            </div>
            {footer}
            <ScrollTop />
            <Cursor />
            <CvViewer />
            <MarkdownViewer />
          </div>
        </PaletteProvider>
      </ImageServiceProvider>
    </MotionConfig>
  );
}
