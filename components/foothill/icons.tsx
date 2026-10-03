/**
 * Every glyph the public site draws, in one place.
 *
 * `Icon` is the interface set: arrows, search, menu, close and the handful of
 * actions. One stroke weight and one grid (24, round caps), so an arrow beside
 * a button label and an arrow in the gallery are visibly the same arrow.
 *
 * `Brand` is somebody else's mark -- a provider, a network, a way to support
 * the work -- keyed by the platform name the database stores, so a footer, a
 * share row and a contact page all ask for "github" and draw the same thing.
 * A platform with no mark of its own falls back to a neutral glyph rather than
 * to nothing.
 *
 * No `"use client"` and no `process.env`: pure markup, safe on either side.
 */
import { cn } from "@/lib/utils/cn";

const STROKES = {
  "arrow-right": "M4.5 12h15M13.5 6l6 6-6 6",
  "arrow-left": "M19.5 12h-15M10.5 6l-6 6 6 6",
  "arrow-up-right": "M7 17 17 7M8.5 7H17v8.5",
  "arrow-up": "M12 19.5v-15M6 10.5l6-6 6 6",
  "arrow-down": "M12 4.5v15M6 13.5l6 6 6-6",
  "corner-down-right": "M5 4.5v6.5a4 4 0 0 0 4 4h10.5M15 11l4.5 4L15 19",
  search: "M10.75 17.5a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5ZM15.75 15.75 20 20",
  menu: "M3.5 8.5h17M3.5 15.5h17",
  close: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  "chevron-down": "M6 9.5l6 6 6-6",
  copy: "M8.5 8.5V5.75c0-.69.56-1.25 1.25-1.25h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25H15.5M5.75 8.5h8.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5c0-.69.56-1.25 1.25-1.25Z",
  check: "M5 12.5l4.5 4.5L19 7.5",
  send: "M20.5 3.5 10 14M20.5 3.5l-6.5 17-4-6.5-6.5-4 17-6.5Z",
  reply: "M9.5 14.5 4.5 9.5l5-5M4.5 9.5h9.75A5.75 5.75 0 0 1 20 15.25V19.5",
  pin: "M9 4h6M10 4v6l-3 3.5h10L14 10V4M12 13.5V20",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5",
  download: "M12 4v11M7 10.5l5 5 5-5M5 19.5h14",
  doc: "M7 3.5h7l4 4V20.5H7ZM14 3.5V7.5h4M9.5 12h5M9.5 15.5h5",
  mail: "M3.5 6.5h17v11h-17ZM4 7l8 6 8-6",
  globe: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM3.5 12h17M12 3.5c2.3 2.3 3.5 5.2 3.5 8.5s-1.2 6.2-3.5 8.5c-2.3-2.3-3.5-5.2-3.5-8.5S9.7 5.8 12 3.5Z",
  heart: "M12 19.5s-7.5-4.4-7.5-10A4.25 4.25 0 0 1 12 6.8a4.25 4.25 0 0 1 7.5 2.7c0 5.6-7.5 10-7.5 10Z",
  coffee: "M5 9h11v5.5A4.5 4.5 0 0 1 11.5 19h-2A4.5 4.5 0 0 1 5 14.5ZM16 10.5h1.5a2.5 2.5 0 0 1 0 5H16M8 3.5v2.5M11 3.5v2.5",
  gift: "M4.5 9.5h15v3h-15ZM6 12.5v8h12v-8M12 9.5v11M12 9.5S10.5 5 8.25 5a2.25 2.25 0 0 0 0 4.5M12 9.5S13.5 5 15.75 5a2.25 2.25 0 0 1 0 4.5",
  pulse: "M3.5 12h4l2-5 4 10 2-5h5",
} as const;

export type IconName = keyof typeof STROKES;

export function Icon({
  name,
  className,
  strokeWidth = 1.6,
  title,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  /** Only for an icon that stands alone with no label beside it. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-4 w-4 shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d={STROKES[name]} />
    </svg>
  );
}

/* Filled marks, drawn on a 24 grid in currentColor. Google keeps its own four
   colours: a monochrome G is a different, unofficial mark. */
const MARKS: Record<string, string> = {
  github:
    "M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.57v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.33-1.76-1.33-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3Z",
  linkedin:
    "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z",
  x: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.6l5.24 6.93 6.06-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z",
  medium:
    "M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12Zm7.42 0c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42ZM24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12Z",
  facebook:
    "M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.08 1.85-5.98 5.86-5.98.76 0 2.07.15 2.61.3v3.32c-.28-.03-.78-.04-1.39-.04-1.97 0-2.73.75-2.73 2.69v1.29h3.92l-.67 3.67h-3.25v8.25A12 12 0 1 0 9.1 23.69Z",
};

const INSTAGRAM = (
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <circle cx="17.4" cy="6.6" r="1.15" fill="currentColor" />
  </>
);

const GOOGLE = (
  <>
    <path fill="#FFC107" d="M21.8 10.04h-.8V10H12v4h5.65A6 6 0 1 1 15.98 7.5l2.83-2.83A10 10 0 1 0 22 12c0-.67-.07-1.32-.2-1.96Z" />
    <path fill="#FF3D00" d="M3.15 7.35 6.44 9.76A6 6 0 0 1 15.98 7.5l2.83-2.83A10 10 0 0 0 3.15 7.35Z" />
    <path fill="#4CAF50" d="M12 22a10 10 0 0 0 6.7-2.6l-3.1-2.62A6 6 0 0 1 6.36 14l-3.26 2.52A10 10 0 0 0 12 22Z" />
    <path fill="#1976D2" d="M21.8 10.04h-.8V10H12v4h5.65a6 6 0 0 1-2.04 2.79l3.1 2.62C18.48 19.6 22 17 22 12c0-.67-.07-1.32-.2-1.96Z" />
  </>
);

/** A platform name as stored, to the glyph that stands for it. */
const FALLBACK: Record<string, IconName> = {
  email: "mail",
  mail: "mail",
  website: "globe",
  roneai: "globe",
  "github sponsors": "heart",
  "buy me a coffee": "coffee",
  saweria: "gift",
  sociabuzz: "gift",
};

export function Brand({ name, className }: { name: string; className?: string }) {
  const key = name.toLowerCase();
  const classes = cn("h-4 w-4 shrink-0", className);

  if (key === "google")
    return (
      <svg viewBox="0 0 24 24" className={classes} aria-hidden="true">
        {GOOGLE}
      </svg>
    );
  if (key === "instagram")
    return (
      <svg viewBox="0 0 24 24" className={classes} aria-hidden="true">
        {INSTAGRAM}
      </svg>
    );
  const mark = MARKS[key === "follow_linkedin" ? "linkedin" : key];
  if (mark)
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={classes} aria-hidden="true">
        <path d={mark} />
      </svg>
    );
  return <Icon name={FALLBACK[key] ?? "arrow-up-right"} className={className} />;
}
