import "server-only";

import { cache } from "react";

import { auth } from "@/auth";
import { getUserProfile, type UserProfile } from "@/lib/auth/profile";

/**
 * The signed-in reader, as the site's chrome needs them, or `null`.
 *
 * **Wrapped in `cache()`, and that is not an optimisation.** The account panel
 * is created once in `app/(site)/layout.tsx` and rendered in two places -- the
 * desktop rail and the mobile drawer -- so the component runs twice on every
 * request. Without the request-scoped memo that is two identities read from the
 * database to draw one name. `getStaffUser` is wrapped for exactly this reason
 * and the sidebar asks both.
 *
 * No guard on the subject: `auth.ts`'s `session` callback is the one place a
 * token becomes a session, and it already refuses a `sub` that is not a uuid.
 * Every reader of `session.user.id` is downstream of it.
 *
 * `null` covers nobody signed in *and* a token whose subject no longer names a
 * row. The chrome shows the same thing for both -- a way to sign in -- because
 * that is the fix for both.
 */
export const getViewer = cache(async function getViewer(): Promise<UserProfile | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return getUserProfile(id);
});
