import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { H1, H2, LEAD, LINE_BUTTON, SOLID_BUTTON } from "@/components/foothill/classes";
import { Icon, type IconName } from "@/components/foothill/icons";
import { CountUp, Reveal, Roll } from "@/components/foothill/motion";
import { statusDot } from "@/lib/site/status-colors";
import { cn } from "@/lib/utils/cn";

/**
 * Every link that is an action rather than a word in a sentence: a button
 * shaped link, or a quiet one with an arrow.
 *
 * One component so the three shapes cannot drift: the label rolls on hover,
 * the arrow is the same SVG everywhere and moves the way its direction says
 * -- forward for a page on this site, up and out for somewhere else.
 */
export function ActionLink({
  href,
  children,
  variant = "text",
  icon,
  external,
  download,
  className,
}: {
  href: string;
  children: string;
  variant?: "solid" | "line" | "text";
  icon?: IconName | null;
  /** Opens elsewhere: a new tab, and the up-and-out arrow. Inferred from the href. */
  external?: boolean;
  download?: boolean;
  className?: string;
}) {
  const away = external ?? /^(https?:|mailto:)/.test(href);
  const glyph = icon === null ? null : (icon ?? (away ? "arrow-up-right" : "arrow-right"));
  const classes = cn(
    variant === "solid" && SOLID_BUTTON,
    variant === "line" && LINE_BUTTON,
    variant === "text" &&
      "group inline-flex items-center gap-2 text-[15px] font-medium text-ink",
    className,
  );
  const back = glyph === "arrow-left";
  const body = (
    <>
      {!back && <Roll>{children}</Roll>}
      {glyph && (
        <Icon
          name={glyph}
          className={cn(
            "transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)]",
            glyph === "arrow-up-right"
              ? "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              : glyph === "arrow-left"
                ? "group-hover:-translate-x-1"
                : glyph === "arrow-down"
                  ? "group-hover:translate-y-0.5"
                  : "group-hover:translate-x-1",
          )}
        />
      )}
      {back && <Roll>{children}</Roll>}
    </>
  );

  if (away || download)
    return (
      <a
        href={href}
        className={classes}
        {...(away ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...(download ? { download: true } : {})}
      >
        {body}
      </a>
    );
  return (
    <Link href={href as Route} className={classes}>
      {body}
    </Link>
  );
}

/**
 * A section's title, rising into place line by line as it is reached, with
 * how many entries sit under it set small against its first line -- "Writing
 * 20" tells a reader how much the few shown are drawn from, without a kicker
 * above the title saying so.
 */
export function Heading({
  id,
  children,
  count,
  className,
}: {
  id?: string;
  children: string;
  count?: number;
  className?: string;
}) {
  return (
    <h2 id={id} className={cn(H2, "flex items-start gap-[0.25em]", className)}>
      <Reveal as="span" lines className="block">
        {children}
      </Reveal>
      {count !== undefined && (
        <span className="mt-[0.1em] shrink-0 font-text text-[0.32em] font-normal tracking-normal text-mute">
          <CountUp value={count} />
        </span>
      )}
    </h2>
  );
}

/** The opening of a section: its title and count, and the way to the rest. */
export function SectionHead({
  title,
  count,
  href,
  linkLabel,
  id,
  className,
}: {
  title: string;
  count?: number;
  href?: string;
  linkLabel?: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-x-8 gap-y-4", className)}>
      <Heading id={id} count={count}>
        {title}
      </Heading>
      {href && linkLabel && <ActionLink href={href}>{linkLabel}</ActionLink>}
    </div>
  );
}

/** A project status: a coloured dot and its label. */
export function StatusDot({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  if (!label) return null;
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="h-[7px] w-[7px] shrink-0 rounded-full"
        style={{ backgroundColor: statusDot(color) }}
      />
      {label}
    </span>
  );
}

/**
 * A page's heading block: the title, a lead, and whatever the page puts under
 * them. What kind of page this is lives in the navbar's current link and the
 * document title, so there is no label above it.
 */
export function PageHead({
  title,
  lead,
  aside,
  children,
  className,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /**
   * What sits to the right of the heading on a wide screen, and under it on a
   * narrow one: a few facts about the page (`Glance`), or the portrait. A
   * heading alone used a third of the frame and left the rest of it empty.
   */
  aside?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  const text = (
    <>
      <h1 data-fh-split className={H1}>
        {title}
      </h1>
      {lead && (
        <p data-fh-enter className={cn(LEAD, "mt-7 max-w-[56ch]")}>
          {lead}
        </p>
      )}
      {children}
    </>
  );
  if (!aside) return <header className={cn("fh-frame max-w-[980px]", className)}>{text}</header>;
  return (
    <header className={cn("fh-frame grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10", className)}>
      <div className="lg:col-span-8">{text}</div>
      <div data-fh-enter className="lg:col-span-4">
        {aside}
      </div>
    </header>
  );
}

/** A few facts about a page, ruled, for the right of its heading. */
export function Glance({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="border-t border-line">
      {items.map((item) => (
        <Fact key={item.label} label={item.label}>
          {item.value}
        </Fact>
      ))}
    </dl>
  );
}

/** A key and its value, for the ruled fact lists on detail pages. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 text-[15px]">
      <dt className="shrink-0 text-mute">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}

/**
 * An organisation's logo, or its initials when it has none.
 *
 * Most organisations have no logo on file, so the fallback is the common case
 * and is drawn to sit beside a real logo without looking like a missing image.
 * Logos are shown in grey and take their colour back on hover.
 */
export function Logo({ src, name, className }: { src: string; name: string; className?: string }) {
  const box = cn("relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px]", className);
  if (!src) {
    const initials = name
      .split(/\s+/)
      .filter((word) => /^[A-Za-z0-9]/.test(word))
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join("");
    return (
      <span aria-hidden="true" className={cn(box, "border border-line bg-raise font-display text-[13px] font-semibold text-mute")}>
        {initials || "·"}
      </span>
    );
  }
  return (
    // The logo fills its rounded square edge to edge, with no border and no
    // inset: a mark set inside a second box reads as a card within a card.
    // The light plate only shows through a logo drawn on transparency, which
    // would otherwise vanish against the dark theme.
    <span className={cn(box, "fh-print")}>
      <Image src={src} alt={`${name} logo`} fill sizes="44px" className="fh-logo object-contain" />
    </span>
  );
}
