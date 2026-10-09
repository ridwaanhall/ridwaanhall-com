import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "Open to work and hiring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "Open to work, and hiring.", lead: "What I am looking for, and the people RoneAI is looking for." });
}
