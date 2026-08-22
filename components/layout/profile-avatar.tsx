import Image from "next/image";

/**
 * Profile photo.
 *
 * Rendered in three places -- the mobile navbar, the mobile drawer and the
 * desktop rail -- which is why `size` is a prop: the placements are genuinely
 * different contexts, not an inconsistency to normalise away.
 *
 * It carries **no status dot**. An amber pulsing `is_sick` badge and a green
 * `is_active` one used to sit in the bottom-right corner; both were removed
 * because the pulse pulled the eye off the name beside it. Both states are
 * still stated in words by the status badges under the username, so nothing is
 * lost. Don't add it back without asking.
 *
 * `priority` replaces the old `lazy` flag, inverted: the navbar avatar is above
 * the fold and should preload, the others should not.
 */
export function ProfileAvatar({
  src,
  name,
  size = 40,
  className,
  priority = false,
}: {
  src: string;
  name: string;
  /** Rendered pixel size; also the intrinsic size requested from the optimizer. */
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  if (!src) {
    // A missing photo must not render a broken image in the rail header.
    return (
      <div
        className={`shrink-0 rounded-full bg-zinc-800 ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={`${name} Profile Photo`}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}
