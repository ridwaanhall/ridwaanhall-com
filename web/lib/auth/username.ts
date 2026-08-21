/**
 * Django-compatible username generation.
 *
 * `auth_user.username` is `NOT NULL UNIQUE varchar(150)` and Django has no
 * concept of a user without one, so every account created here needs one that
 * looks like the 37 already in the table. Those were written by allauth's
 * `generate_unique_username`, and reading them back shows the two rules it
 * applied:
 *
 *   ridwan · hafidhah · laga · dian · ist · xeyla   <- Google
 *   ridwaanhall · Harindrawahyu                     <- GitHub
 *
 * The stored `first_name`s for that first group are `Ridwan`, `Xeyla`, `Dian`
 * — capitalised — so a name-derived username is **slugified**, lowercase
 * included. `Harindrawahyu` keeps its capital because it is not derived at all:
 * it is GitHub's `login`, which allauth's provider puts straight onto the user
 * and which generation then leaves alone. So the provider's own handle is taken
 * verbatim and everything else is slugified.
 *
 * The other rule that matters is what happens on a collision. allauth picks the
 * **first non-empty** candidate as the base and then suffixes *that* -- it does
 * not fall through to the next candidate. Falling through looks harmless and is
 * not: someone whose GitHub login is already taken would silently be named
 * after their first name instead, which is a different handle from the one they
 * signed in with.
 */

const MAX_LENGTH = 150;

/** Django's `UnicodeUsernameValidator` allows letters, digits and `@.+-_`. */
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
 * `dian2`, `dian3` -- as allauth does it.
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
