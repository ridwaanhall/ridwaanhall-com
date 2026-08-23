/**
 * Picking a username for a new account.
 *
 * `account.username` is `NOT NULL UNIQUE`, and nobody is ever asked to choose
 * one -- sign-in is a single click through a provider, and interrupting that
 * with a form would be the only friction in the flow. So one is derived, and
 * the derivation has to be stable enough that the result looks deliberate:
 *
 *   ridwan · hafidhah · laga · dian · ist · xeyla   <- Google
 *   ridwaanhall · Harindrawahyu                     <- GitHub
 *
 * A name-derived username is **slugified**, lowercase included, because a
 * display name is prose and a username is an identifier. A provider handle is
 * taken verbatim, capitals and all: someone already chose it, and it is theirs.
 *
 * The other rule that matters is what happens on a collision. The **first
 * non-empty** candidate becomes the base and gets suffixed; it does not fall
 * through to the next candidate. Falling through looks harmless and is not:
 * someone whose GitHub login is already taken would silently be named
 * after their first name instead, which is a different handle from the one they
 * signed in with.
 */

const MAX_LENGTH = 150;

/** Letters, digits and `@.+-_`; everything else is dropped or becomes a dash. */
function filterChars(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w.@+-]/g, "")
    .slice(0, MAX_LENGTH);
}

const verbatim = (value: string) => filterChars(value);
const slugified = (value: string) => filterChars(value).toLowerCase();

/**
 * The candidates to try, best first.
 *
 * `handle` is the provider's own username (GitHub's `login`) and is the only
 * one that keeps its case.
 */
export function usernameCandidates({
  handle,
  name,
  email,
}: {
  handle?: string | null;
  name?: string | null;
  email?: string | null;
}): string[] {
  const given = name?.trim().split(/\s+/)[0] ?? "";
  const local = email?.split("@")[0] ?? "";
  return [
    verbatim(handle ?? ""),
    slugified(given),
    slugified(local),
    "user",
  ].filter(Boolean);
}

/**
 * The first **non-empty** candidate, suffixed until it is free -- `dian`,
 * `dian2`, `dian3`.
 *
 * Later candidates are fallbacks for an *empty* earlier one, not for a taken
 * one, which is why only `candidates[0]` is ever the base.
 *
 * `isTaken` is passed in rather than queried here so this stays a pure
 * function: the adapter owns the database and this owns the naming rule.
 */
export async function uniqueUsername(
  candidates: string[],
  isTaken: (username: string) => Promise<boolean>,
): Promise<string> {
  const base = candidates[0] ?? "user";
  if (!(await isTaken(base))) return base;

  // Suffixing is bounded rather than a `while (true)`: a runaway loop here
  // would hold a pooler connection open for the length of a sign-in attempt.
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const candidate = `${base.slice(0, MAX_LENGTH - String(suffix).length)}${suffix}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  // 998 collisions on one base is not a case worth a fallback that could
  // itself collide; the unique constraint is the backstop.
  throw new Error(`Could not derive a free username from "${base}"`);
}
