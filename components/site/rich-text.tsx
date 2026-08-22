import { sanitizeRichText } from "@/lib/utils/sanitize";

/**
 * Render stored rich-text HTML.
 *
 * A server component, deliberately: sanitising here means the bytes that reach
 * the browser are already clean, rather than shipping a sanitiser to every
 * reader and trusting it to run before anything else does.
 *
 * `.prose-content` supplies all the styling -- see styles/prose.css. The
 * content itself carries no classes; that separation is the point of the move
 * away from stored Tailwind strings.
 */
export function RichText({ html, className }: { html: string; className?: string }) {
  if (!html?.trim()) return null;

  return (
    <div
      className={className ? `prose-content ${className}` : "prose-content"}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
