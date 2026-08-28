import type { SVGProps } from "react";

/**
 * One glyph per sidebar group, plus the handful the changelist needs.
 *
 * Drawn in the same feather-stroked style as `components/icons/nav-icons.tsx`
 * rather than pulled from an icon package: the public site inlines its own,
 * and a second, differently-drawn set in the admin would read as another
 * product bolted on.
 */

type IconProps = SVGProps<SVGSVGElement>;

function Stroked({ children, ...props }: IconProps) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth={1.75}
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      height={16}
      width={16}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Stroked>
  );
}

export function ArticleIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z" />
      <path d="M17 8h3v10a2 2 0 0 1-2 2" />
      <path d="M8 8h5M8 12h5M8 16h3" />
    </Stroked>
  );
}

export function CubeIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M12 2.5 21 7v10l-9 4.5L3 17V7z" />
      <path d="M3 7l9 4.5L21 7M12 11.5V21" />
    </Stroked>
  );
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20" />
    </Stroked>
  );
}

export function ScaleIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M12 3v18M7 21h10M5 7h14M5 7l-3 6h6zM19 7l3 6h-6z" />
    </Stroked>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 12 3.1a8.4 8.4 0 0 1 9 8.4z" />
    </Stroked>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </Stroked>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Stroked>
  );
}

export function ChevronIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <polyline points="9 18 15 12 9 6" />
    </Stroked>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
    </Stroked>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M12 5v14M5 12h14" />
    </Stroked>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <polyline points="20 6 9 17 4 12" />
    </Stroked>
  );
}

export function DashIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M5 12h14" />
    </Stroked>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M3 6h18M3 12h18M3 18h18" />
    </Stroked>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Stroked>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </Stroked>
  );
}

export function SortIcon({ dir, ...props }: IconProps & { dir?: "asc" | "desc" | null }) {
  return (
    <Stroked height={12} width={12} {...props}>
      {/* Both chevrons when unsorted, so the column reads as sortable; one when
          it is the column in force, pointing the way the rows run. */}
      {dir !== "desc" && <polyline points="6 10 12 4 18 10" />}
      {dir !== "asc" && <polyline points="6 14 12 20 18 14" />}
    </Stroked>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </Stroked>
  );
}

export function ForwardIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </Stroked>
  );
}

/**
 * The rail's collapse control.
 *
 * A panel with its left column marked, which is what the rail becomes: the
 * glyph is the shape of the thing rather than a generic arrow, so it reads the
 * same whichever direction the rail is about to travel. Which direction that is
 * comes from the button's `aria-expanded` and its label, not from a second
 * glyph.
 */
export function RailIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
    </Stroked>
  );
}

/** The admin's own mark, in the rail's header. */
export function SquaresIcon(props: IconProps) {
  return (
    <Stroked {...props}>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </Stroked>
  );
}
