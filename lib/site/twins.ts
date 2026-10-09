/**
 * Which pages have a Markdown twin.
 *
 * Every public page that carries content does, at its own path plus `.md`.
 * What is left out is left out because there is nothing in it to read: the
 * sign-in page, the admin, the API and the error pages. Pure, so the footer,
 * the proxy and the handler that renders twins all ask the same question.
 */

const STATIC = new Set([
  "/",
  "/projects",
  "/blog",
  "/about",
  "/dashboard",
  "/guestbook",
  "/contact",
  "/openhire",
  "/privacy-policy",
  "/terms",
]);

const DETAIL = /^\/(projects|blog|legal)\/[a-z0-9][a-z0-9-]*$/;

export function normalise(path: string): string {
  const bare = path.split(/[?#]/)[0] || "/";
  return bare !== "/" && bare.endsWith("/") ? bare.slice(0, -1) : bare;
}

export function hasTwin(path: string): boolean {
  const here = normalise(path);
  return STATIC.has(here) || DETAIL.test(here);
}

/** A page's path to its twin's: `/` to `/index.md`, `/about` to `/about.md`. */
export const twinOf = (path: string) => (path === "/" ? "/index.md" : `${normalise(path)}.md`);
