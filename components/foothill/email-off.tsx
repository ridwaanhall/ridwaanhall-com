import { pathOf, type IconName } from "@/components/foothill/icons";
import { escapeHtml } from "@/lib/email/escape";

/**
 * An address the CDN's email obfuscation must leave alone. It rewrites any
 * address it finds in the HTML into a script-decoded blob, which React then
 * sees as a hydration mismatch; the markers tell it to skip what is between
 * them. They are comments, which React cannot emit, so the span is raw HTML
 * and every value in it goes through `escapeHtml` (attribute-safe: quotes too).
 *
 * Server component only: do not import it into a "use client" module (pass it
 * down as a child or a prop from a server one instead).
 */
export function EmailOff({
  address,
  link,
  className,
  icon,
  newTab,
  children,
}: {
  address: string;
  /** A mailto anchor rather than plain text. */
  link?: boolean;
  /** Anchor class; defaults to the underlined text link. */
  className?: string;
  icon?: IconName;
  newTab?: boolean;
  /** Anchor text in place of the address. Plain text, escaped. */
  children?: string;
}) {
  const safe = escapeHtml(address);
  let inner = safe;
  if (link) {
    const svg = icon
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="ico" aria-hidden="true"><path d="${escapeHtml(pathOf(icon))}"></path></svg>`
      : "";
    const away = newTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    inner = `<a class="${escapeHtml(className ?? "ul")}" href="mailto:${safe}"${away}>${svg}${children !== undefined ? escapeHtml(children) : safe}</a>`;
  }
  return <span suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `<!--email_off-->${inner}<!--/email_off-->` }} />;
}
