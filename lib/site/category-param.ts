/**
 * Which category a filter value in an address means.
 *
 * Filters carry the category's slug, the identifier. Links shared before that
 * carried the label, so a value that matches no slug but matches a label (any
 * case) is mapped to that label's slug. Anything else is returned as it came,
 * where it simply matches nothing.
 */
export function resolveCategoryParam(value: string, options: { slug: string; label: string }[]): string {
  if (!value) return "";
  if (options.some((option) => option.slug === value)) return value;
  const wanted = value.trim().toLowerCase();
  return options.find((option) => option.label.toLowerCase() === wanted)?.slug ?? value;
}
