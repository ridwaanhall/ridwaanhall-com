import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "Writing by Ridwan Halim";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "Mostly about code, sometimes about everything else.", lead: "Notes on building APIs and models, and guides I wished existed." });
}
