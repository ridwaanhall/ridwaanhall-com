import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "Ridwan Halim, full stack developer and AI/ML engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "Ridwan Halim", lead: "Full Stack Developer and AI/ML Engineer. A quiet space where machine learning, open-source, and reflections converge." });
}
