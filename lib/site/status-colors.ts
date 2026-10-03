/**
 * A project status's colour on the public site, as a dot.
 *
 * Keyed on the same eighteen tokens `project_status.color` is constrained to,
 * and that `PROJECT_STATUS_COLORS` keys its badge classes on. The site draws a
 * status as a small dot beside its label rather than as a filled badge, so it
 * needs one colour per token rather than a pair of classes -- and an inline
 * colour rather than a class, so nothing here depends on Tailwind finding a
 * class name. Mid-tone values, legible as a dot on both the mist and the pine.
 */
export const STATUS_DOT: Record<string, string> = {
  purple: "#8b6fd6",
  violet: "#7c6ce0",
  indigo: "#5f6fd8",
  blue: "#3f7fd9",
  sky: "#2f9bd0",
  cyan: "#1fa3b5",
  teal: "#1f9c8a",
  emerald: "#2e9f6a",
  green: "#4a9b45",
  lime: "#7fa12a",
  yellow: "#c9a40e",
  amber: "#d38b12",
  orange: "#d9702a",
  red: "#d0483f",
  rose: "#d24a6a",
  pink: "#cf5aa0",
  fuchsia: "#b955c4",
  zinc: "#8b9891",
};

export function statusDot(token: string | null | undefined): string {
  return STATUS_DOT[token ?? ""] ?? STATUS_DOT.zinc;
}
