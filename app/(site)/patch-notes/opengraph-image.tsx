import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "Patch notes for ridwaanhall.com";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "Patch notes.", lead: "What changed on this site, release by release." });
}
