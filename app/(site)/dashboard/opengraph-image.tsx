import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "Ridwan Halim, coding dashboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "The work, measured.", lead: "Time in the editor and contributions, read live." });
}
