import { card } from "@/lib/og/card";

/** The sharing card for this page, drawn by `lib/og/card.tsx`. */
export const alt = "About Ridwan Halim";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return card({ title: "Ridwan, known online as ridwaanhall.", lead: "Roles, schools, skills, awards and the job hunt, in public." });
}
