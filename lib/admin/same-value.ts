import type { FormField, FormValue, FormValues } from "@/lib/admin/form";

/**
 * Whether a submitted value says the same thing as the stored one.
 *
 * This is what lets an untouched save be a no-op rather than a rewrite. The two
 * sides never arrive in quite the same shape -- the loader hands the form what
 * the driver returned, the parser hands the save what the browser posted -- so
 * strict equality would call almost every record changed, and the save would go
 * on writing exactly as before. Each rule below is one way the shapes differ
 * while the value does not:
 *
 * - **Blank is blank.** A nullable column left empty parses to `null` and a
 *   `NOT NULL` one to `""`; a stored `""` in a nullable column is the same
 *   nothing.
 * - **Text is trimmed on the way in**, so a stored trailing newline is not a
 *   change somebody made.
 * - **A many-to-many and a choice list are sets.** The checklist posts in the
 *   order it draws, the join table returns in whatever order Postgres likes.
 * - **A timestamp is compared to the minute**, because that is all its control
 *   can show -- see `keepStoredTime`.
 *
 * Erring is cheap in one direction only: a false "changed" costs a write that
 * says the same thing, which is what every save did before this existed. A
 * false "unchanged" would drop an edit, so when in doubt the answer is changed.
 */
export function sameFormValue(field: FormField, stored: FormValue | undefined, submitted: FormValue | undefined): boolean {
  if (field.kind === "many-to-many" || field.kind === "choice-list") {
    return sameSet(asList(stored), asList(submitted));
  }
  if (field.kind === "string-list") {
    return JSON.stringify(asList(stored)) === JSON.stringify(asList(submitted));
  }
  if (field.kind === "key-value") {
    return JSON.stringify(asRecord(stored)) === JSON.stringify(asRecord(submitted));
  }
  if (field.kind === "checkbox") return Boolean(stored) === Boolean(submitted);
  if (field.kind === "number") {
    if (isBlank(stored) || isBlank(submitted)) return isBlank(stored) && isBlank(submitted);
    return Number(stored) === Number(submitted);
  }
  if (field.kind === "datetime") {
    if (isBlank(stored) || isBlank(submitted)) return isBlank(stored) && isBlank(submitted);
    return sameMinute(String(stored), String(submitted));
  }
  if (field.kind === "date") return text(stored).slice(0, 10) === text(submitted).slice(0, 10);
  return text(stored).trim() === text(submitted).trim();
}

/** Every field the form posted says what the record already holds. */
export function sameFormValues(fields: FormField[], stored: FormValues, submitted: FormValues): boolean {
  return fields.every(
    (field) => !(field.name in submitted) || sameFormValue(field, stored[field.name], submitted[field.name]),
  );
}

/**
 * The stored timestamp, when the submitted one is that timestamp to the minute.
 *
 * A `datetime` control shows minutes and posts minutes, so a stored
 * `10:23:45.120` came back from any save as `10:23:00` -- on every record,
 * every time, whatever field was actually edited. All 57 guestbook messages
 * carry seconds, and two posted in the same minute would have swapped places
 * on the first save that touched either. The reader cannot have meant to change
 * the seconds, because they were never shown, so they are kept.
 */
export function keepStoredTime(stored: FormValue | undefined, submitted: FormValue | undefined): FormValue | undefined {
  if (typeof stored !== "string" || typeof submitted !== "string" || !stored || !submitted) return submitted;
  // The stored string itself, not a `Date` of it: Postgres keeps microseconds
  // and a `Date` does not.
  return sameMinute(stored, submitted) ? stored : submitted;
}

function sameMinute(a: string, b: string): boolean {
  const left = new Date(a).getTime();
  const right = new Date(b).getTime();
  if (Number.isNaN(left) || Number.isNaN(right)) return a === b;
  return Math.floor(left / 60_000) === Math.floor(right / 60_000);
}

const isBlank = (value: FormValue | undefined) => value === null || value === undefined || value === "";

const text = (value: FormValue | undefined) => (isBlank(value) ? "" : String(value));

function asList(value: FormValue | undefined): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asRecord(value: FormValue | undefined): Record<string, string> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function sameSet(a: string[], b: string[]): boolean {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((entry) => right.has(entry));
}
