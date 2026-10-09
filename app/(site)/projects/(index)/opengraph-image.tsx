import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "Projects by Ridwan Halim";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "Things I have built, and keep building.", lead: "APIs other developers lean on, dashboards, machine-learning models and the occasional experiment." });
}
