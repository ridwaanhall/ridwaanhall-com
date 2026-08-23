/**
 * A place, rendered the way it was stored.
 *
 * Locations were free text -- `"Surakarta, Central Java, Indonesia"` on one row,
 * `"Remote"` on another, `"Yogyakarta, Indonesia 🇮🇩"` on a third -- repeated
 * across experiences, education, applications and job openings, with the same
 * city spelled differently in different places. They are rows now, so a place
 * is written once and pointed at.
 *
 * Which means the display string has to be rebuilt, and this is the one place
 * that does it. The parts join with `", "` in the order they narrow, and the
 * flag trails the country with a space -- exactly the shape the stored strings
 * had, because that shape is what the migration parsed them out of.
 */
/**
 * Every part is nullable because the join that produces them is a left join:
 * a row whose `location_id` is null answers with nulls, not with blanks, and
 * requiring the caller to coalesce four fields before asking for a label would
 * put the same four `?? ""` at every call site.
 */
export type LocationParts = {
  city: string | null;
  region: string | null;
  country: string | null;
  flag: string | null;
};

export function locationLabel(location: LocationParts | null | undefined): string {
  if (!location) return "";
  const parts = [location.city, location.region, location.country].filter(Boolean);
  const named = parts.join(", ");
  if (!named) return location.flag ?? "";
  return location.flag ? `${named} ${location.flag}` : named;
}
