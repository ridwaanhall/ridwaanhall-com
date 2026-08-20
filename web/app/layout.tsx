import type { Metadata, Viewport } from "next";

import { ThemeColorSync } from "@/components/providers/theme-color-sync";
import { ThemeProvider } from "@/components/providers/theme-provider";

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
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
