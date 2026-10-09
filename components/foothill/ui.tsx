import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { Brand, Icon, type IconName } from "@/components/foothill/icons";
import { MarkdownChips } from "@/components/foothill/markdown";
import { cn } from "@/lib/utils/cn";

/*
 * The public site's vocabulary of small parts: tags, the facts beside a
 * title, section headings, buttons, links, thumbnails, logos and the empty
 * state. Pure markup, so a page stays a server component while using them;
 * anything that keeps state lives in `controls.tsx`.
 *
 * Class names are the ones styles/site.css defines under `.fh-site`.
 */

/* ------------------------------------------------------------------ status */

type TagKind = "solid" | "" | "dashed" | "strike";

/**
 * A project's lifecycle as a tag's line, never as a colour: filled when it is
 * done, outlined while in progress, dashed while planned or waiting, struck
 * when it stopped. Keyed on the status slug, which is the identifier; the
 * label beside it is editorial and is only ever rendered.
 */
export const PHASE: Record<string, TagKind> = {
  "planning-requirements": "dashed",
  design: "dashed",
  "development-in-progress": "",
  "code-review": "",
  "testing-qa": "",
  reopened: "",
  "update-required": "",
  "deployment-released": "solid",
  "maintenance-support": "solid",
  completed: "solid",
  "on-hold": "dashed",
  cancelled: "strike",
};

const PHASE_TIP: Record<TagKind, string> = {
  solid: "finished, and live or delivered",
  "": "in progress",
  dashed: "planned, or on hold",
  strike: "stopped",
};

export function Tag({ kind = "", className, children, title }: { kind?: TagKind; className?: string; children: React.ReactNode; title?: string }) {
  return (
    <span className={cn("tag", kind, className)} title={title}>
      {children}
    </span>
  );
}

/** A status says what it means on hover, and to a screen reader as "Status: Completed". */
export function ProjectStatus({ slug, label }: { slug: string; label: string }) {
  const kind = PHASE[slug] ?? "dashed";
  return (
    <span className={cn("tag", kind)} title={`${label}: ${PHASE_TIP[kind]}`}>
      <span className="sr">Status: </span>
      {label}
    </span>
  );
}

/* --------------------------------------------------------------- the frame */

/** Ruled facts beside a page title, drawn from what the page already loaded. */
export function Facts({ rows }: { rows: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="facts">
      {rows.map(([term, value], index) => (
        <div key={index}>
          <dt>{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A page's opening: the title and its lead on the left, a few ruled facts on
 * the right, and under the title the page's Markdown twin. The title rises
 * by line (`data-fh-split`), the facts arrive just after (`data-fh-enter`).
 */
export function PageHead({
  title,
  lead,
  facts,
  crumb,
  markdown,
  children,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  facts?: [React.ReactNode, React.ReactNode][];
  crumb?: React.ReactNode;
  /** The page's path, whose `.md` twin the chips under the title open. */
  markdown?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="head wrap">
      <div>
        {crumb}
        <h1 className="t1" data-fh-split="">
          {title}
        </h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
        {markdown && <MarkdownChips path={markdown} />}
      </div>
      {facts && facts.length > 0 && (
        <div data-fh-enter="">
          <Facts rows={facts} />
        </div>
      )}
    </section>
  );
}

/** The way back from a detail page to its index. */
export function Crumb({ href, children }: { href: Route; children: React.ReactNode }) {
  return (
    <Link className="crumb" href={href}>
      <Icon name="back" />
      {children}
    </Link>
  );
}

/** A section's title with its count set small beside it, and a note under it. */
export function Heading({
  title,
  count,
  note,
  id,
  children,
}: {
  title: React.ReactNode;
  count?: number | string | null;
  note?: React.ReactNode;
  id?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="sec-h">
      <div>
        <h2 className="t2" id={id}>
          {title}
          {count != null && <sup>{count}</sup>}
        </h2>
        {note && <p>{note}</p>}
      </div>
      {children}
    </div>
  );
}

/* --------------------------------------------------------- links, buttons */

const isAway = (href: string) => /^(https?:|mailto:)/.test(href);

/**
 * A link that is an action rather than a word in a sentence: an icon for what
 * it does, and an underline that draws in on hover. A link that leaves the
 * site gets the up-and-out arrow and opens in a new tab.
 */
export function TextLink({
  href,
  icon,
  brand,
  children,
  className,
}: {
  href: string;
  icon?: IconName;
  brand?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const away = isAway(href);
  const glyph = brand ? <Brand name={brand} size={15} /> : <Icon name={icon ?? (away ? "out" : "layers")} />;
  const body = (
    <>
      {glyph}
      <span>{children}</span>
    </>
  );
  return away ? (
    <a className={cn("tl", className)} href={href} target="_blank" rel="noopener noreferrer">
      {body}
    </a>
  ) : (
    <Link className={cn("tl", className)} href={href as Route}>
      {body}
    </Link>
  );
}

/** The filled and outlined buttons, as links. A button that runs code is `ActionButton`. */
export function Button({
  href,
  icon,
  brand,
  ghost,
  sm,
  wide,
  download,
  children,
  className,
}: {
  href: string;
  icon?: IconName;
  brand?: string;
  ghost?: boolean;
  sm?: boolean;
  wide?: boolean;
  download?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const classes = cn("btn", ghost && "ghost", sm && "sm", wide && "wide", className);
  const body = (
    <>
      {brand ? <Brand name={brand} /> : icon ? <Icon name={icon} /> : null}
      {children}
    </>
  );
  if (isAway(href) || download)
    return (
      <a className={classes} href={href} {...(download ? { download: true } : { target: "_blank", rel: "noopener noreferrer" })}>
        {body}
      </a>
    );
  return (
    <Link className={classes} href={href as Route}>
      {body}
    </Link>
  );
}

/* ------------------------------------------------------------ pictures */

/**
 * A screenshot or a cover, in its own colour, in a 6px frame. Without an
 * image the frame keeps its shape and carries the title instead, so a card
 * with nothing to show still lines up with its neighbours.
 */
export function Thumb({
  src,
  alt,
  title,
  sizes = "(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw",
  priority = false,
  ratio,
  eye = true,
}: {
  src: string | null | undefined;
  alt: string;
  title: string;
  sizes?: string;
  priority?: boolean;
  ratio?: string;
  eye?: boolean;
}) {
  return (
    <div className="thumb" style={ratio ? { aspectRatio: ratio } : undefined}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} />
      ) : (
        <div className="noimg" role="img" aria-label={`${title}, no preview yet`}>
          <span>{title}</span>
        </div>
      )}
      {eye && (
        <span className="go" aria-hidden="true">
          <Icon name="eye" />
        </span>
      )}
    </div>
  );
}

export const initials = (name: string) =>
  (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

/** An organisation's logo on a white tile, or its initials when there is none. */
export function Logo({ src, name, size }: { src?: string | null; name: string; size?: number }) {
  const box = size ? { width: size, height: size } : undefined;
  if (!src)
    return (
      <span className="logo mono-tile" style={size ? { ...box, fontSize: size / 3 } : undefined} aria-hidden="true">
        {initials(name)}
      </span>
    );
  return (
    <span className="logo" style={box}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a small logo from the bucket, any aspect */}
      <img src={src} alt="" loading="lazy" />
    </span>
  );
}

/* ------------------------------------------------------------- empty state */

/**
 * What a list or a panel says when there is nothing to show: that nothing is
 * wrong, when it will fill in, and where to go meanwhile. A dashed box with an
 * icon that draws itself in -- never a blank gap, never a spinner that does
 * not stop.
 */
export function Empty({
  icon = "inbox",
  title,
  note,
  action,
  small,
  className,
}: {
  icon?: IconName;
  title: React.ReactNode;
  note?: React.ReactNode;
  action?: React.ReactNode;
  small?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("empty", small && "small", className)}>
      <span className="empty-ic">
        <Icon name={icon} className="draw" />
      </span>
      <div style={{ display: "grid", gap: 4, minWidth: 0 }}>
        <b>{title}</b>
        {note && <span className="meta">{note}</span>}
      </div>
      {action && <div className="empty-act">{action}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------- skills */

export type SkillIcon = {
  name: string;
  /** The icon's URL, from the bucket. */
  icon: string | null;
  /** Measured once: drawn in near-black (inverted on dark) or near-white (inverted on light). */
  tone?: "dark" | "light" | null;
};

/** The icon alone, inverted on the theme it would vanish against. */
export function SkillGlyph({ skill }: { skill: SkillIcon }) {
  if (!skill.icon) return <span className="ic">{skill.name.slice(0, 2)}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- an SVG from the bucket, drawn at 18px
    <img
      src={skill.icon}
      alt=""
      width={18}
      height={18}
      loading="lazy"
      className={skill.tone === "dark" ? "inv-dark" : skill.tone === "light" ? "inv-light" : undefined}
    />
  );
}

/** A skill with its own icon in its own colour. */
export function SkillChip({ skill }: { skill: SkillIcon }) {
  return (
    <span className="sk">
      <SkillGlyph skill={skill} />
      {skill.name}
    </span>
  );
}

/** Live and source, as two small marks with their meaning on hover or tap. */
export function Avail({ demo, source }: { demo: boolean; source: boolean }) {
  if (!demo && !source) return null;
  return (
    <span className="avail">
      {demo && (
        <span title="A live version to try" tabIndex={0} aria-label="Live to try">
          <Icon name="globe" size={14} />
        </span>
      )}
      {source && (
        <span title="Source on GitHub" tabIndex={0} aria-label="Source on GitHub">
          <Brand name="github" size={14} />
        </span>
      )}
    </span>
  );
}
