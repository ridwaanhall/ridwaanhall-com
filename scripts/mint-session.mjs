/**
 * Mint an Auth.js session cookie for a given `account.id`.
 *
 * Signing in for real means driving a Google or GitHub consent screen, which a
 * check script cannot do. The session is a JWT this app signs itself, so the
 * honest alternative is to issue one the same way Auth.js does and send it as
 * the same cookie -- the app then takes exactly the path a signed-in reader
 * takes, with no test-only branch anywhere in the application code.
 *
 * That it works at all is the point of the design being checked: the token
 * carries identity and nothing else. Minting one for a user who is not staff
 * does not get you into the admin, because `is_staff` is read from the database
 * on every request (`lib/auth/staff.ts`).
 *
 *   node scripts/mint-session.mjs <userId>
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const { encode } = await import("next-auth/jwt");

const userId = process.argv[2];
if (!userId) {
  console.error("usage: node scripts/mint-session.mjs <userId>");
  process.exit(1);
}

const secret = process.env.AUTH_SECRET;
if (!secret) {
  console.error("AUTH_SECRET is not set.");
  process.exit(1);
}

// `salt` must match the cookie name Auth.js reads, or the token decodes to
// null and the request is simply anonymous -- which looks like a failing gate
// rather than a mis-minted cookie.
const cookieName = "authjs.session-token";

const token = await encode({
  token: { sub: String(userId) },
  secret,
  salt: cookieName,
  maxAge: 60 * 30,
});

process.stdout.write(`${cookieName}=${token}\n`);
