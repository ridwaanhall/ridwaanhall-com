/**
 * Turnstile must fail closed.
 *
 * This is the contact form's only spam defence, and the failure that matters is
 * silent: a verifier that returns `true` when something goes wrong looks
 * identical to a working one until the inbox fills up. The validator was
 * written to reject on every error path and this asserts the port kept that —
 * a missing token, an empty one, and a forged one that Cloudflare's real API
 * rejects.
 *
 * **`--conditions=react-server` is required.** These modules carry
 * `import "server-only"`, which throws on purpose when imported outside a
 * server environment; the condition is what makes its no-op export resolve, and
 * it is how a check script drives real server modules rather than a copy of
 * them.
 *
 *   npx tsx --conditions=react-server scripts/check-turnstile.mjs
 */
import { config } from "dotenv";
import { reporter } from "./harness.mjs";

config({ path: ".env.local", quiet: true });

const { turnstileEnabled, verifyTurnstile } = await import("../lib/email/turnstile.ts");

const { check, finish } = reporter();

if (!turnstileEnabled()) {
  // Without a secret the verifier passes by design, which is the
  // `USE_CF_TURNSTILE` gate, so there is nothing here to assert.
  console.log("Turnstile is not configured — skipping (the verifier passes by design).");
  process.exit(0);
}

check("configured", turnstileEnabled());
check("a missing token is rejected", (await verifyTurnstile(null)) === false);
check("an empty token is rejected", (await verifyTurnstile("")) === false);
check(
  "a forged token is rejected by Cloudflare",
  (await verifyTurnstile("definitely-not-a-real-token")) === false,
);
check(
  "a forged token with a remote IP is rejected too",
  (await verifyTurnstile("nope", "203.0.113.1")) === false,
);

// Set rather than `process.exit`: exiting while fetch's socket is still closing
// trips a libuv assertion on Windows, and the run reads as failed.
process.exitCode = finish((n) => `All ${n} Turnstile checks passed — it fails closed.`);
