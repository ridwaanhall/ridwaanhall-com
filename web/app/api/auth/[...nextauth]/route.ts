/**
 * Auth.js's own endpoints: /api/auth/signin, /callback/*, /signout, /session,
 * /providers, /csrf.
 *
 * These replace allauth's `/accounts/*` URLs. The OAuth callback path changes
 * with them -- `/accounts/google/login/callback/` becomes
 * `/api/auth/callback/google` -- so both providers' registered redirect URIs
 * have to gain the new one before cutover. Adding it alongside the old one lets
 * both stacks work at once.
 */
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
