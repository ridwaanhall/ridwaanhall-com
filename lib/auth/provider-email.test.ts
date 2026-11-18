import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { acceptsProviderEmail } from "@/lib/auth/provider-email";

/**
 * The sign-in refusal for an address the provider has not verified, offline.
 *
 * The cell that matters is Google with `email_verified: false`. The rest
 * assert that the refusal stays that narrow: a missing claim, or a provider
 * that has no such claim at all, must still sign in, or the guard becomes a
 * lockout for everybody.
 */
describe("acceptsProviderEmail", () => {
  it("accepts a Google profile whose address is verified", () => {
    assert.equal(acceptsProviderEmail("google", { email_verified: true }), true);
  });

  it("refuses a Google profile whose address is not verified", () => {
    assert.equal(acceptsProviderEmail("google", { email_verified: false }), false);
  });

  it("accepts a Google profile that carries no verified claim", () => {
    assert.equal(acceptsProviderEmail("google", {}), true);
    assert.equal(acceptsProviderEmail("google", undefined), true);
    assert.equal(acceptsProviderEmail("google", null), true);
  });

  /*
   * Only Google's claim is read. GitHub's profile has no such field, so a
   * `false` arriving under its name is not something this check interprets.
   */
  it("does not apply the Google rule to another provider", () => {
    assert.equal(acceptsProviderEmail("github", { email_verified: false }), true);
    assert.equal(acceptsProviderEmail("github", {}), true);
    assert.equal(acceptsProviderEmail(undefined, { email_verified: false }), true);
  });
});
