/**
 * Auth.js's own endpoints: /api/auth/signin, /callback/*, /signout, /session,
 * /providers, /csrf.
 *
 * The callback path is `/api/auth/callback/<provider>`, which is what each
 * provider's registered redirect URI has to name -- including the
 * `localhost:3000` equivalents, or sign-in works in production and nowhere
 * else.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
