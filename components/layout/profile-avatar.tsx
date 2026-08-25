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
 * `eager` marks the copy that is above the fold, which is one of them at a
 * time: the mobile navbar's below `md`, the desktop rail's above it.
 *
 * It sets `loading="eager"`, which replaces the `priority` prop Next 16
 * deprecated and is what Next names when it reports an image as the Largest
 * Contentful Paint.
 *
 * Not Next's `preload`, which is the stronger form: that calls
 * `ReactDOM.preload` itself and so is guaranteed a `<link>` in the head. This
 * page has two avatars in the markup at once -- the navbar's below `md` and
 * the rail's above it, at different widths and so different optimizer URLs --
 * and the head cannot know which one the viewport will show. The heroes get
 * the guarantee; these take React's ordinary handling.
 *
 * Which is still a preload, and worth being exact about: React hoists a
 * `<link rel="preload">` for every non-lazy `<img>` it renders on the server,
 * up to ten of them. So this changes which API asks for it, not what the
 * browser ends up fetching.
 */
export function ProfileAvatar({
  src,
  name,
  size = 40,
  className,
  eager = false,
}: {
  src: string;
  name: string;
  /** Rendered pixel size; also the intrinsic size requested from the optimizer. */
  size?: number;
  className?: string;
  eager?: boolean;
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
      loading={eager ? "eager" : "lazy"}
      className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}
