/**
 * The rail's collapsed state, as both halves of the app have to spell it.
 *
 * A three-line module, and it earns its own file. The obvious place for these
 * was beside the component that writes them -- but `admin-shell.tsx` is
 * `"use client"`, and **a value imported from a client module into a server
 * component is not that value.** Next replaces the module with a set of client
 * references, so the layout's `cookies().get(RAIL_COOKIE)` was looking up a
 * reference object rather than the string `"admin-rail"`, found nothing, and
 * rendered the wide rail for everybody. Nothing errored: the cookie was written
 * correctly, sent correctly, and read under a name that did not exist.
 *
 * Neither `tsc` nor the build sees it -- the export is a `string` on both sides
 * of the boundary -- and the symptom is a preference that silently never
 * applies, which looks exactly like a cookie that failed to save.
 */

/** Not `httpOnly`: the client writes it, and nothing secret is in it. */
export const RAIL_COOKIE = "admin-rail";

/** A year. This is a preference, not a session. */
export const RAIL_MAX_AGE = 60 * 60 * 24 * 365;

/** The only value that means anything; everything else is the wide rail. */
export const RAIL_MINI = "mini";
