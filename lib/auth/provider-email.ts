/**
 * Whether a provider's sign-in may go ahead on the strength of the address it
 * hands over, as a pure function so `npm test` can walk it offline.
 *
 * The address a provider returns becomes `account.email`: the key Auth.js
 * matches a second provider against (refusing with `OAuthAccountNotLinked`)
 * and the inbox guestbook confirmations are sent to. An address the provider
 * itself says it has not verified is somebody's claim, not their inbox, and
 * accepting it would let one person occupy another's address -- locking the
 * real owner out of signing in with it, and pointing mail carrying the
 * claimant's words at them.
 *
 * Only an explicit `email_verified: false` refuses. Google's OpenID profile
 * carries the claim whenever the `email` scope is granted, so a missing claim
 * is not a provider saying "unverified"; refusing it would turn an absent field
 * into a lockout for everybody.
 *
 * GitHub is not checked here, and that is a known gap rather than an oversight.
 * Its `/user` profile carries no verified flag; when the address is private,
 * Auth.js's GitHub provider fills it from `/user/emails`, taking the primary
 * (or first) entry without looking at that entry's `verified`. The profile this
 * function receives has already lost that field, so checking it means a second
 * `/user/emails` request on every GitHub sign-in -- a change with its own cost
 * and failure modes, left as a separate decision.
 */
export function acceptsProviderEmail(
  provider: string | undefined,
  profile: { email_verified?: unknown } | null | undefined,
): boolean {
  if (provider === "google") return profile?.email_verified !== false;
  return true;
}
