/**
 * A path on this site, or the fallback.
 *
 * A redirect target comes from the browser, and an unchecked one is an open
 * redirect. Only a plain same-site path is accepted: not `//host` or `/\host`
 * (protocol-relative, to a browser), and nothing with a control character, since
 * a URL parser drops tabs and newlines before reading it, which turns "/<tab>/host"
 * into `//host`. Pure, so a test can hold every shape that has fooled a check.
 */
export function samePath(target: string | undefined | null, fallback: string): string {
  if (!target || !target.startsWith("/")) return fallback;
  if (/^\/[/\\]/.test(target)) return fallback;
  if (/[\u0000-\u001f\u007f\\]/.test(target)) return fallback;
  return target;
}
