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
 *   node scripts/mint-session.mjs <userId> [baseUrl]
 *
 * The cookie's name follows the address (`scripts/harness.mjs`), so pass the
 * deployment's URL when the cookie is for one.
 */
import { config } from "dotenv";

import { baseUrl, mintSession, sessionCookieName } from "./harness.mjs";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const userId = process.argv[2];
if (!userId) {
  console.error("usage: node scripts/mint-session.mjs <userId> [baseUrl]");
  process.exit(1);
}

const base = baseUrl(process.argv[3]);
const token = await mintSession(userId, base, 60 * 30);
process.stdout.write(`${sessionCookieName(base)}=${token}
`);
