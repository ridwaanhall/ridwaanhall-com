/**
 * The Author / Co-Author badge.
 *
 * One definition for what used to be three hand-copies: the message list, the
 * pinned card, and `buildRoleBadgeHtml()` in the guestbook's inline script.
 *
 * The two sizes are spelled out rather than interpolated. Tailwind detects
 * classes as literal text, so a `text-[${n}px]` would compile to nothing at all
 * -- the same trap that made `pl-5` a no-op on the live site for seven lists.
 */
export function RoleBadge({
  isAuthor,
  isCoAuthor,
  small = false,
}: {
  isAuthor: boolean;
  isCoAuthor: boolean;
  /** The pinned card sits in a denser row. */
  small?: boolean;
}) {
  if (!isAuthor && !isCoAuthor) return null;

  const glyph = small ? 9 : 10;
  const label = small ? "text-[8px]" : "text-[9px]";

  if (isAuthor) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-bl from-purple-800 via-violet-900 to-purple-800 px-1.5 py-0.5 text-violet-50">
        <svg
          stroke="currentColor"
          fill="currentColor"
          strokeWidth={0}
          viewBox="0 0 24 24"
          height={glyph}
          width={glyph}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path fill="none" d="M0 0h24v24H0z" />
          <path d="M17 11c.34 0 .67.04 1 .09V6.27L10.5 3 3 6.27v4.91c0 4.54 3.2 8.79 7.5 9.82.55-.13 1.08-.32 1.6-.55-.69-.98-1.1-2.17-1.1-3.45 0-3.31 2.69-6 6-6z" />
          <path d="M17 13c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 1.38c.62 0 1.12.51 1.12 1.12s-.51 1.12-1.12 1.12-1.12-.51-1.12-1.12.5-1.12 1.12-1.12zm0 5.37c-.93 0-1.74-.46-2.24-1.17.05-.72 1.51-1.08 2.24-1.08s2.19.36 2.24 1.08c-.5.71-1.31 1.17-2.24 1.17z" />
        </svg>
        <span className={label}>Author</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-gradient-to-bl from-amber-700 via-yellow-800 to-amber-700 px-1.5 py-0.5 text-amber-50">
      <svg
        stroke="currentColor"
        fill="currentColor"
        strokeWidth={0}
        viewBox="0 0 24 24"
        height={glyph}
        width={glyph}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path fill="none" d="M0 0h24v24H0z" />
        <path d="M16 4l2.29 6.29c.18.18.43.29.71.29s.53-.11.71-.29L22 4H16zM10 4l2.29 6.29c.18.18.43.29.71.29s.53-.11.71-.29L16 4H10zM4 4l2.29 6.29c.18.18.43.29.71.29s.53-.11.71-.29L10 4H4zM7 14c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm10 0c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
      </svg>
      <span className={label}>Co-Author</span>
    </span>
  );
}

/** The stand-in when someone has no provider avatar. */
export function AvatarFallback({ className, glyph }: { className: string; glyph: string }) {
  return (
    <div
      className={`rounded-full border border-zinc-800 flex-shrink-0 bg-gradient-to-br from-zinc-500 to-purple-600 flex items-center justify-center ${className}`}
    >
      <svg className={`${glyph} text-white`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

/** The pin glyph, shared by the badge, both pin buttons and the section header. */
export function PinIcon({ className, filled }: { className: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 17v5" />
      <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
    </svg>
  );
}

/** The curved reply arrow, on the caption and the reply button. */
export function ReplyIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
      />
    </svg>
  );
}
