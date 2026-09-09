import { SURFACE, SURFACE_INTERACTIVE, SURFACE_PAD, SURFACE_RAISED } from "@/lib/ui/shapes";
import { cn } from "@/lib/utils/cn";

const TONES = {
  quiet: SURFACE,
  raised: SURFACE_RAISED,
  interactive: SURFACE_INTERACTIVE,
} as const;

/**
 * A box around something that is a thing.
 *
 * There were thirty-seven of these, differing in radius, border colour, fill
 * and whether they transitioned -- two cards sitting in equivalent grids on
 * two listings had different borders. Three is enough: at rest, one step
 * forward, and one you can click.
 *
 * **Reach for it less often than the count suggests.** The failure a small set
 * of surfaces invites is putting every piece of content in one, and a page of
 * fifteen identical bordered panels is what that looks like -- it is also
 * exactly what `/openhire` and the legal pages had. A document is read rather
 * than handled: it wants rules and rhythm and no box. Keep the surface for
 * things that are objects -- a post, a project, a reading, a panel of live data
 * -- where the border is saying "this is one of several" and is therefore
 * carrying information.
 */
export function Surface({
  as: Tag = "div",
  tone = "quiet",
  pad = true,
  className,
  children,
  ...rest
}: {
  as?: "div" | "section" | "article" | "li" | "aside";
  tone?: keyof typeof TONES;
  /** Off where the contents run to the edge -- an image, a full-bleed chart. */
  pad?: boolean;
  className?: string;
  children?: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className={cn(TONES[tone], pad && SURFACE_PAD, className)} {...rest}>
      {children}
    </Tag>
  );
}
