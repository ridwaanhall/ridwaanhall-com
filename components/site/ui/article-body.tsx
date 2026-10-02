import { cn } from "@/lib/utils/cn";

/**
 * An article's prose, at a measure you can read.
 *
 * The body used to carry `max-w-none`, which was the one instruction it had
 * about width, and at 1216px that is about 150 characters a line -- past the
 * point where the eye reliably finds the start of the next one. Widening the
 * content column had made the writing harder to read, which is the opposite of
 * what more room is for.
 *
 * **The cap is a utility here rather than a rule in `styles/prose.css`.** That
 * sheet is unlayered, so a `max-width` in it would beat every per-instance
 * override for good -- and a gallery, a wide code block or a table inside an
 * article legitimately wants the whole column. Those live outside this wrapper
 * and keep it.
 *
 * **It does not go through `RichText`, and that is not an oversight.** This
 * takes HTML that `prepareArticle` has already sanitised *and then added
 * heading ids to*; handing it to `RichText` would sanitise it a second time and
 * strip every one of them back out, leaving a contents list whose links all
 * point at nothing. Anything without a contents list should still use
 * `RichText` -- it is the safe default, and this is the one caller that has
 * already done that work.
 */
export function ArticleBody({
  html,
  className,
}: {
  /** Already sanitised. `prepareArticle` is the only thing that produces it. */
  html: string;
  className?: string;
}) {
  if (!html?.trim()) return null;

  return (
    <div
      className={cn("prose-content max-w-measure text-body", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
