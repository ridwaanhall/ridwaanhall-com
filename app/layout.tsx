import type { Metadata, Viewport } from "next";
import { Suspense } from "react";

import { PageLoadingBar } from "@/components/layout/page-loading-bar";
import { ClickSpark } from "@/components/providers/click-spark";
import { ConfirmDialogProvider } from "@/components/providers/confirm-dialog";
import { Notifications } from "@/components/providers/notifications";
import { ThemeColorSync } from "@/components/providers/theme-color-sync";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Tooltips } from "@/components/providers/tooltips";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? "https://ridwaanhall.com"),
  // Favicons are hand-placed under public/favicon/ (copied from the Django
  // staticfiles tree), not generated, so they are declared rather than
  // discovered by file convention.
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", type: "image/x-icon" },
      { url: "/favicon/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon/favicon-32x32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  other: { "creation-date": "2025-03-16" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Dark is the default and the value in the prerendered HTML; ThemeColorSync
  // flips it client-side when the reader has chosen light. It deliberately
  // does not use a prefers-color-scheme media list -- the site never consults
  // the OS preference.
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // suppressHydrationWarning is required by next-themes: its pre-paint script
    // writes data-theme on <html> before React hydrates, so the server and
    // client markup legitimately differ on that one attribute.
    <html lang="en" suppressHydrationWarning>
      <body className="bg-black text-zinc-300 transition-colors duration-200">
        <ThemeProvider>
          <ThemeColorSync />
          {/*
            Two document-wide behaviours, mounted once. Both render nothing and
            append their own element to `document.body` -- the tooltip chip and
            the spark canvas are `position: fixed`, and `#page-content` carries
            a transform, which would otherwise become their containing block.

            They are delegated from `document` rather than attached per
            element, which is what lets them cover markup that appears later
            (gallery controls, lightbox buttons, a panel that was hidden) with
            no observer and no re-scan.
          */}
          <Tooltips />
          <ClickSpark />
          {/*
            The toast stack and the confirm dialog, both at body level and both
            for the same reason as the two above: `#page-content` animates a
            transform, and a transformed ancestor becomes the containing block
            for its `position: fixed` descendants. A stack or a dialog rendered
            inside it would be positioned against the content column instead of
            the viewport -- the dialog's backdrop blur would stop at the
            sidebar. `apps/core/tests/test_notifications.py` asserted this
            structurally, and nothing else in either tree catches it.

            `ConfirmDialogProvider` wraps `{children}` because `useConfirm`
            reads its context, but renders the dialog itself as a sibling of
            them, so the placement holds.
          */}
          <Notifications />
          {/*
            The navigation bar, body-level for the same containing-block reason
            as everything above it.

            Behind `<Suspense>` because it reads `useSearchParams()` to know
            when a navigation has committed -- paging and searching change only
            the query -- and under Cache Components that makes a component
            un-prerenderable. The boundary keeps the rest of the document
            static; the site layout wraps its admin link the same way.
          */}
          <Suspense fallback={null}>
            <PageLoadingBar />
          </Suspense>
          <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
