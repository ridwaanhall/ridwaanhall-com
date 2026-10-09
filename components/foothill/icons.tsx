/**
 * Every glyph the public site draws, in one place.
 *
 * `Icon` is the interface set: one 24 grid, one 1.75 stroke, round caps. Each
 * button and link carries the icon for what it does -- a grid for work, a
 * book for posts, a pen for writing to me, a paper plane for send -- and an
 * arrow only where a link leaves the site. Icons never grow, turn or move on
 * hover; they take the ink colour with their label and nothing else.
 *
 * Sizing is the `.ico` rule in styles/site.css (16px), or `size` when a place
 * needs another. `size` is an inline style on purpose: that rule is unlayered
 * and would beat a sizing utility.
 *
 * `Brand` is somebody else's mark -- a sign-in provider, a network, a way to
 * support the work -- keyed by the platform name the database stores. Google
 * keeps its own four colours: a monochrome G is a different, unofficial mark.
 *
 * No `"use client"` and no `process.env`: pure markup, safe on either side.
 */
import { cn } from "@/lib/utils/cn";

const STROKES = {
  right: "M5 12h14M13 6l6 6-6 6",
  left: "M19 12H5M11 6l-6 6 6 6",
  out: "M7 17 17 7M8 7h9v9",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M6 13l6 6 6-6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  menu: "M4 8h16M4 16h16",
  x: "M6 6l12 12M18 6 6 18",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  check: "M5 12l5 5 9-10",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z",
  file: "M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6",
  pin: "M12 17v5M9 3h6l-1 6 3 3v2H7v-2l3-3z",
  heart: "M19 14c1.5-1.5 3-3.3 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z",
  coffee: "M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4ZM6 2v2M10 2v2M14 2v2",
  gift: "M3 8h18v4H3zM12 8v13M19 12v9H5v-9M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5",
  globe: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20",
  github:
    "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.1-1.3-.3-2.5-1-3.5.3-1.2.3-2.4 0-3.5 0 0-1 0-3 1.5-2.6-.5-5.4-.5-8 0C6 2 5 2 5 2c-.3 1.2-.3 2.4 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.4.5-.7 1-.9 1.6-.2.6-.2 1.3-.1 1.9v4M9 18c-4.5 2-5-2-7-2",
  linkedin: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6ZM2 9h4v12H2zM4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  xlogo: "M4 4l11.7 16H20L8.3 4zM4 20l6.8-6.8M13.2 10.8 20 4",
  instagram:
    "M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5ZM16 11.4A4 4 0 1 1 12.6 8a4 4 0 0 1 3.4 3.4ZM17.5 6.5h.01",
  medium:
    "M7 7a5 5 0 1 0 0 10A5 5 0 0 0 7 7ZM16.5 7.5c-1.4 0-2.5 2-2.5 4.5s1.1 4.5 2.5 4.5S19 14.5 19 12s-1.1-4.5-2.5-4.5ZM21.5 8v8",
  chev: "M6 9l6 6 6-6",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2",
  map: "M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  msg: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  briefcase: "M4 7h16v13H4zM9 7V4h6v3M4 12h16",
  send: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  home: "M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6",
  pen: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5",
  layers: "M12 2 2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  user: "M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  login: "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3",
  chart: "M3 3v18h18M7 15v2M11 11v6M15 7v10M19 12v5",
  back: "M15 18l-6-6 6-6",
  link: "M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7",
  cloud: "M17.5 19H8a6 6 0 1 1 5.7-8h1.8a4.5 4.5 0 0 1 2 8.5M3 3l18 18",
  code: "M16 18l6-6-6-6M8 6l-6 6 6 6",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6",
  calendar: "M4 5h16v16H4zM4 10h16M9 3v4M15 3v4",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5 5h14l2 8v6H3v-6z",
  refresh: "M21 12a9 9 0 1 1-2.6-6.4M21 4v5h-5",
  award: "M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM8.5 14 7 22l5-3 5 3-1.5-8",
  school: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5",
  tool: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z",
  md: "M3 6h18v12H3zM6.5 15V9l2.5 3 2.5-3v6M16.5 9v6M14 12.5l2.5 2.5 2.5-2.5",
  alert: "M12 4.5 20.5 19.5h-17ZM12 10v4M12 16.75v.25",
  info: "M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 11v5.5M12 7.75v.25",
  reply: "M9.5 14.5 4.5 9.5l5-5M4.5 9.5h9.75A5.75 5.75 0 0 1 20 15.25V19.5",
  trash: "M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5",
  download: "M12 4v11M7 10.5l5 5 5-5M5 19.5h14",
  pulse: "M3.5 12h4l2-5 4 10 2-5h5",
  shield: "M12 3.5 19 6v6c0 4.5-3 7.5-7 8.5-4-1-7-4-7-8.5V6Z",
} as const;

/** The names the previous set used, kept so nothing that still says them breaks. */
const ALIASES = {
  "arrow-right": "right",
  "arrow-left": "left",
  "arrow-up-right": "out",
  "arrow-up": "up",
  "arrow-down": "down",
  "corner-down-right": "reply",
  close: "x",
  "chevron-down": "chev",
  doc: "file",
} as const satisfies Record<string, keyof typeof STROKES>;

export type IconName = keyof typeof STROKES | keyof typeof ALIASES;

const pathOf = (name: IconName): string =>
  name in ALIASES ? STROKES[ALIASES[name as keyof typeof ALIASES]] : STROKES[name as keyof typeof STROKES];

export function Icon({
  name,
  size,
  className,
  title,
}: {
  name: IconName;
  /** Pixels, when the place needs other than the default 16. */
  size?: number;
  className?: string;
  /** Only for an icon that stands alone with no label beside it. */
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("ico", className)}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      <path d={pathOf(name)} />
    </svg>
  );
}

const GITHUB_MARK =
  "M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z";

/** A platform name as stored, to the stroke glyph that stands for it. */
const PLATFORM: Record<string, keyof typeof STROKES> = {
  linkedin: "linkedin",
  follow_linkedin: "linkedin",
  x: "xlogo",
  twitter: "xlogo",
  instagram: "instagram",
  medium: "medium",
  email: "mail",
  mail: "mail",
  website: "globe",
  roneai: "globe",
  "github sponsors": "heart",
  "buy me a coffee": "coffee",
  saweria: "gift",
  sociabuzz: "gift",
};

/**
 * Somebody else's mark. GitHub and Google are drawn as themselves -- the two
 * a reader signs in with, where the real mark is what they look for -- and
 * every other platform as a stroke glyph in the interface's own weight.
 */
export function Brand({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const key = name.toLowerCase();
  if (key === "google")
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} className={cn("brandmark", className)} aria-hidden="true">
        <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.09 3.57-5.17 3.57-8.8z" />
        <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.9l-3.87-3c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.95H1.27v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.27 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.27a12 12 0 0 0 0 10.8z" />
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.27 6.6l4 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
      </svg>
    );
  if (key === "github")
    return (
      <svg viewBox="0 0 16 16" width={size} height={size} className={cn("brandmark", className)} aria-hidden="true">
        <path fill="currentColor" d={GITHUB_MARK} />
      </svg>
    );
  return <Icon name={PLATFORM[key] ?? "out"} size={size} className={className} />;
}
