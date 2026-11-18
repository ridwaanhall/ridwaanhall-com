/**
 * What Turnstile verification does with the configuration it finds, as a pure
 * function.
 *
 * `lib/email/turnstile.ts` is `server-only`, which throws under the plain node
 * test runner, so the decision lives here where `npm test` can walk the matrix.
 *
 * - **`verify`**: a secret is set, so ask Cloudflare -- in every environment.
 * - **`skip`**: no secret under `next dev`. A checkout without Cloudflare
 *   credentials can still send the contact form; nothing is checked.
 * - **`refuse`**: no secret anywhere else. Every submission is rejected.
 *
 * The convenience is keyed on `NODE_ENV === "development"` rather than on
 * `VERCEL_ENV`, and deliberately so. `next dev` sets that value itself and
 * `next build` / `next start` set `production`, so it says "this is a
 * developer's machine" without trusting a dashboard. `VERCEL_ENV` would have
 * kept the hole open on preview deployments (`preview`, not `production`),
 * which are public URLs over the same live database and the same Resend key,
 * and on any host that is not Vercel at all, where it is simply absent. An
 * unrecognised or missing `NODE_ENV` refuses too: the safe answer to "where am
 * I?" being unknown is the closed one.
 */
export type TurnstileMode = "verify" | "skip" | "refuse";

export function turnstileMode(secret: string | undefined, nodeEnv: string | undefined): TurnstileMode {
  if (secret) return "verify";
  return nodeEnv === "development" ? "skip" : "refuse";
}
