/**
 * Whether a string is a well-formed UUID.
 *
 * The guard this replaces was `Number.isInteger(id) && id > 0`, which did two
 * jobs at once: it rejected nonsense, and it kept nonsense away from Postgres.
 * That second job still matters and is easy to lose. A `uuid` column compared
 * against a malformed string does not return zero rows -- it raises
 * `22P02 invalid input syntax for type uuid`, which surfaces as a 500 on a
 * route whose honest answer is "no such record".
 *
 * Any version, since these come from `gen_random_uuid()` but may also arrive
 * from a URL somebody typed.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}
