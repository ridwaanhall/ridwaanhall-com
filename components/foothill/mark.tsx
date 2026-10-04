/**
 * The site's mark: two summits and the saddle between them, in one stroke.
 * Merbabu on the left, a little higher, as it is.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 16" fill="none" aria-hidden="true" className={className}>
      <path
        d="M1 15 L9 2.5 L13.5 9 L17.5 4 L27 15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="4" r="1.5" className="fill-ink" />
    </svg>
  );
}
