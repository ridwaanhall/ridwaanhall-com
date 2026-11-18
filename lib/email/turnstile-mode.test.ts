import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { turnstileMode } from "./turnstile-mode";

/**
 * The contact form's only spam check must not switch itself off in production
 * because a variable went missing. Asserted as the whole matrix, secret set or
 * unset against every environment `NODE_ENV` can name, because the failure
 * that matters is one cell: no secret on a deployed server.
 */
describe("turnstileMode", () => {
  it("verifies whenever a secret is set, in every environment", () => {
    for (const env of ["production", "development", "test", undefined]) {
      assert.equal(turnstileMode("0x-secret", env), "verify", String(env));
    }
  });

  it("refuses everything in production when the secret is unset", () => {
    assert.equal(turnstileMode(undefined, "production"), "refuse");
  });

  /*
   * An empty string is how an unset Vercel variable or a blank line in
   * `.env.local` usually arrives, so it counts as missing rather than as a
   * secret to send to Cloudflare.
   */
  it("treats an empty secret as unset", () => {
    assert.equal(turnstileMode("", "production"), "refuse");
    assert.equal(turnstileMode("", "development"), "skip");
  });

  it("skips the check under next dev when the secret is unset", () => {
    assert.equal(turnstileMode(undefined, "development"), "skip");
  });

  /*
   * Only `development` opens it. A missing or unexpected `NODE_ENV` is not
   * evidence of a developer's machine, so it gets the closed answer.
   */
  it("refuses when the environment is missing or unrecognised", () => {
    assert.equal(turnstileMode(undefined, undefined), "refuse");
    assert.equal(turnstileMode(undefined, "test"), "refuse");
    assert.equal(turnstileMode(undefined, "staging"), "refuse");
  });
});
